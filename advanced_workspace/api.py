"""What the signed-in user may see of the workspace.

Lists go through frappe.get_list, so a user's roles and User Permissions
apply to every figure: nothing is counted that they could not open.
"""

import json

import frappe
from frappe import _
from frappe.utils import add_days, add_months, flt, get_first_day, getdate, nowdate

MODULE_DT = "Advanced Workspace Module"
ADVANCED_ROLE = "مستخدم مساحة العمل المتقدمة"
ITEM_TYPES = {"DocType": "dt", "Tree": "tree", "Report": "rp", "Page": "page", "Link": "url"}


@frappe.whitelist()
def home(action=None, key=None, company=None, lang=None, part=None):
	if frappe.session.user == "Guest" or frappe.get_cached_value("User", frappe.session.user, "user_type") != "System User":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if ADVANCED_ROLE not in frappe.get_roles():
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if action == "home":
		profile = frappe.db.get_value("User", frappe.session.user, ["full_name", "user_image"], as_dict=True)
		return {
			"modules": visible_modules(),
			"companies": companies(),
			"full_name": profile.full_name,
			"image": profile.user_image,
		}
	if action == "language":
		return set_language(lang)
	if action == "module":
		return module_figures(key, company, part)
	frappe.throw(_("Unknown action"))


def set_language(lang):
	if lang not in ("ar", "en"):
		frappe.throw(_("Unknown language"))
	# saved through the document, which clears the user's cached session and language
	user = frappe.get_doc("User", frappe.session.user)
	user.language = lang
	user.save(ignore_permissions=True)
	return lang


# ---------------------------------------------------------------------- menu


def word(arabic, english):
	return arabic if frappe.local.lang == "ar" else (english or arabic)


def load_modules():
	"""The menu is whatever the settings table says, read fresh on each request."""
	rows = frappe.get_all(
		MODULE_DT,
		filters={"enabled": 1},
		order_by="sequence asc",
		fields=["name", "label", "label_en", "icon", "user_role", "manager_role", "direct_link"],
	)
	names = [row.name for row in rows]
	if not names:
		return []
	items = frappe.get_all(
		"Advanced Workspace Item",
		filters={"parent": ["in", names], "parenttype": MODULE_DT, "enabled": 1},
		fields=["parent", "label", "label_en", "item_type", "target"],
		order_by="idx asc",
	)
	stats = frappe.get_all(
		"Advanced Workspace Stat",
		filters={"parent": ["in", names], "parenttype": MODULE_DT},
		order_by="idx asc",
		fields=["parent", "label", "label_en", "stat_type", "document", "sum_field", "date_field", "filters", "ledger_root"],
	)
	extra = frappe.get_all(
		"Has Role", filters={"parent": ["in", names], "parenttype": MODULE_DT}, fields=["parent", "role"]
	)
	out = []
	for row in rows:
		kpis = []
		for stat in stats:
			if stat.parent != row.name:
				continue
			if stat.stat_type == "Ledger":
				kpis.append({"l": word(stat.label, stat.label_en), "k": "gl", "root": stat.ledger_root})
			else:
				kpis.append(
					{
						"l": word(stat.label, stat.label_en),
						"k": "sum" if stat.stat_type == "Sum" else "count",
						"dt": stat.document,
						"f": stat.sum_field if stat.stat_type == "Sum" else None,
						"d": stat.date_field or None,
						"w": json.loads(stat.filters) if stat.filters else {},
					}
				)
		out.append(
			{
				"key": row.name,
				"label": word(row.label, row.label_en),
				"icon": row.icon,
				"direct": row.direct_link,
				"kpis": kpis,
				"roles": [r for r in (row.user_role, row.manager_role) if r]
				+ [r.role for r in extra if r.parent == row.name],
				"items": [
					{"t": ITEM_TYPES.get(i.item_type, "dt"), "n": i.target, "l": word(i.label, i.label_en)}
					for i in items
					if i.parent == row.name
				],
			}
		)
	return out


def can_read(doctype):
	return bool(doctype) and bool(frappe.db.exists("DocType", doctype)) and frappe.has_permission(doctype, "read")


def can_run(report):
	return bool(frappe.db.exists("Report", report)) and frappe.get_doc("Report", report).is_permitted()


def can_open_page(page):
	return bool(frappe.db.exists("Page", page)) and frappe.get_doc("Page", page).is_permitted()


def allowed_item(item):
	if item["t"] == "url":
		return True
	if item["t"] == "page":
		return can_open_page(item["n"])
	return can_run(item["n"]) if item["t"] == "rp" else can_read(item["n"])


def holds_module(module, roles):
	if frappe.session.user == "Administrator" or "System Manager" in roles:
		return True
	return any(name in roles for name in module["roles"])


def visible_modules():
	roles = set(frappe.get_roles())
	out = []
	for module in load_modules():
		if not holds_module(module, roles):
			continue
		items = [item for item in module["items"] if allowed_item(item)]
		if not items:
			continue
		if module["direct"]:
			out.append({"key": module["key"], "label": module["label"], "icon": module["icon"], "link": items[0], "items": []})
		else:
			out.append(
				{
					"key": module["key"],
					"label": module["label"],
					"icon": module["icon"],
					"items": items,
					"n": len(module["kpis"]),
				}
			)
	return out


def companies():
	# a user who cannot read companies still gets the menu, without the company picker
	if not frappe.has_permission("Company", "read"):
		return []
	return frappe.get_list("Company", pluck="name", order_by="name asc", limit_page_length=50)


def pick_company(wanted):
	names = companies()
	if wanted and wanted in names:
		return wanted
	return names[0] if names else None


# ---------------------------------------------------------------------- figures


def module_figures(key, company, part=None):
	"""part="lists": the documents and recent activity, which come back at once;
	part="kpis": the set statistics, which can take seconds on a large ledger."""
	roles = set(frappe.get_roles())
	module = next((row for row in load_modules() if row["key"] == key), None)
	if not module or not holds_module(module, roles):
		frappe.throw(_("Unknown module"), frappe.PermissionError)
	company = pick_company(company)
	figures = Figures(company)
	out = {
		"company": company,
		"currency": frappe.db.get_value("Company", company, "default_currency") if company else None,
	}
	if part in (None, "kpis"):
		out["kpis"] = [card for card in (figures.kpi(spec) for spec in module["kpis"]) if card]
	if part in (None, "lists"):
		out["docs"] = figures.documents(module)
		out["queue"] = figures.queue(module, out["docs"])
		out["recent"] = figures.recent(module)
	return out


class Figures:
	def __init__(self, company):
		self.company = company
		self._ledger = None

	def measure(self, spec, start, end):
		doctype = spec["dt"]
		filters = dict(spec.get("w") or {})
		if self.company and frappe.get_meta(doctype).has_field("company"):
			filters["company"] = self.company
		if spec.get("d") and start:
			filters[spec["d"]] = ["between", [start, end]]
		if spec.get("f"):
			rows = frappe.get_list(doctype, filters=filters, fields=[{"SUM": spec["f"], "as": "v"}])
		else:
			rows = frappe.get_list(doctype, filters=filters, fields=[{"COUNT": "name", "as": "v"}])
		return flt(rows[0].get("v")) if rows else 0

	def ledger(self):
		# One grouped read serves every card: the ledger runs to hundreds of thousands
		# of rows, and a query per figure took over a minute.
		if self._ledger is not None:
			return self._ledger
		roots, cash = {}, []
		for row in frappe.get_all(
			"Account", filters={"company": self.company, "is_group": 0}, fields=["name", "root_type", "account_type"]
		):
			roots[row.name] = row.root_type
			if row.account_type in ("Bank", "Cash"):
				cash.append(row.name)
		year = getdate(nowdate()).year
		months = {}
		if frappe.db.db_type == "sqlite":
			hint, y_of, m_of = "", "cast(strftime('%%Y', posting_date) as integer)", "cast(strftime('%%m', posting_date) as integer)"
		else:
			hint, y_of, m_of = " force index (posting_date_company_index)", "year(posting_date)", "month(posting_date)"
		for account, y, m, value in frappe.db.sql(
			f"""select account, {y_of}, {m_of}, sum(credit - debit)
			from `tabGL Entry`{hint}
			where company = %s and is_cancelled = 0 and posting_date between %s and %s
			group by account, {y_of}, {m_of}""",
			(self.company, f"{year - 1}-01-01", nowdate()),
		):
			root = roots.get(account)
			if root in ("Income", "Expense"):
				months[(int(y), int(m), root)] = months.get((int(y), int(m), root), 0) + flt(value)
		balance = 0
		if cash:
			balance = flt(
				frappe.db.sql(
					"select sum(debit - credit) from `tabGL Entry` where account in %(names)s and is_cancelled = 0",
					{"names": cash},
				)[0][0]
			)
		self._ledger = {"months": months, "cash": balance}
		return self._ledger

	def gl_value(self, root, periods):
		if root == "Cash":
			return self.ledger()["cash"]
		months = self.ledger()["months"]
		income = sum(months.get((y, m, "Income"), 0) for y, m in periods)
		expense = -sum(months.get((y, m, "Expense"), 0) for y, m in periods)
		if root == "Income":
			return income
		if root == "Expense":
			return expense
		return income - expense

	def kpi(self, spec):
		"""A figure for the year to date, this month against last, and its last twelve months."""
		today = getdate(nowdate())
		months = last_months(today)
		this, before = months[-1], months[-2]
		money = spec["k"] != "count"
		if spec["k"] == "gl":
			if not can_read("GL Entry") or not self.company:
				return None
			route = ["query-report", "General Ledger"]
			if spec["root"] == "Cash":
				return card(spec, self.gl_value("Cash", []), money, None, None, route)
			value = self.gl_value(spec["root"], [(today.year, m) for m in range(1, today.month + 1)])
			series = [self.gl_value(spec["root"], [month]) for month in months]
			return card(spec, value, money, series[-1], series[-2], route, series)
		if not can_read(spec["dt"]):
			return None
		route = ["List", spec["dt"]]
		if not spec.get("d"):
			return card(spec, self.measure(spec, None, None), money, None, None, route)
		by_month = self.monthly(spec, months[0], today)
		series = [by_month.get(month, 0) for month in months]
		value = sum(v for (y, _m), v in by_month.items() if y == today.year)
		return card(spec, value, money, by_month.get(this, 0), by_month.get(before, 0), route, series)

	def monthly(self, spec, first, today):
		"""Sum or count per month from the first month on, in one grouped read that
		keeps the user's permissions."""
		doctype = spec["dt"]
		filters = dict(spec.get("w") or {})
		if self.company and frappe.get_meta(doctype).has_field("company"):
			filters["company"] = self.company
		filters[spec["d"]] = ["between", [f"{first[0]}-{first[1]:02d}-01", str(today)]]
		value = {"SUM": spec["f"], "as": "v"} if spec.get("f") else {"COUNT": "name", "as": "v"}
		rows = frappe.get_list(
			doctype,
			filters=filters,
			fields=[{"YEAR": spec["d"], "as": "y"}, {"MONTH": spec["d"], "as": "m"}, value],
			group_by="y, m",
			order_by="y asc, m asc",
		)
		return {(int(row.y), int(row.m)): flt(row.v) for row in rows}

	def doctypes(self, module):
		"""The module's own documents this user can read, once each, in menu order."""
		seen = []
		for item in module.get("items", []):
			doctype = item["n"]
			if item["t"] != "dt" or doctype in seen or not can_read(doctype):
				continue
			meta = frappe.get_meta(doctype)
			if meta.issingle or meta.istable:
				continue
			seen.append(doctype)
		return seen

	def documents(self, module):
		"""Per document: how many were made this month and last, drafts waiting, and whether
		this user may make one. Every module has these, with or without set statistics."""
		today = nowdate()
		month_start = get_first_day(today)
		last_start = add_months(month_start, -1)
		last_end = add_days(month_start, -1)
		out = {}
		for doctype in self.doctypes(module):
			made = {"dt": doctype, "d": "creation", "w": {}}
			row = {
				"cur": int(self.measure(made, f"{month_start} 00:00:00", f"{today} 23:59:59.999999")),
				"prev": int(self.measure(made, f"{last_start} 00:00:00", f"{last_end} 23:59:59.999999")),
				"drafts": 0,
				"new": 1 if frappe.has_permission(doctype, "create") else 0,
			}
			if frappe.get_meta(doctype).is_submittable:
				row["drafts"] = int(self.measure({"dt": doctype, "w": {"docstatus": 0}}, None, None))
			out[doctype] = row
		return out

	def queue(self, module, docs):
		"""What waits for someone: invoices past their due date, those due within a
		week, and drafts awaiting approval."""
		today = nowdate()
		week = add_days(today, 7)
		late, soon, drafts = [], [], []
		for doctype in self.doctypes(module):
			meta = frappe.get_meta(doctype)
			if docs.get(doctype, {}).get("drafts"):
				drafts.append({"k": "draft", "dt": doctype, "c": docs[doctype]["drafts"]})
			if not (meta.is_submittable and meta.has_field("outstanding_amount") and meta.has_field("due_date")):
				continue
			base = {"docstatus": 1, "outstanding_amount": [">", 0]}
			if self.company and meta.has_field("company"):
				base["company"] = self.company
			for bucket, kind, due in ((late, "late", ["<", today]), (soon, "soon", ["between", [today, week]])):
				row = frappe.get_list(
					doctype,
					filters={**base, "due_date": due},
					fields=[{"COUNT": "name", "as": "c"}, {"SUM": "outstanding_amount", "as": "v"}],
				)
				if row and row[0].c:
					bucket.append({"k": kind, "dt": doctype, "c": int(row[0].c), "v": flt(row[0].v), "today": today, "week": week})
		return late + soon + drafts

	def recent(self, module, limit=8):
		"""The latest documents of the module, newest first. By creation, which every
		table indexes: sorting a large one by its last change took seconds."""
		rows = []
		for doctype in self.doctypes(module):
			meta = frappe.get_meta(doctype)
			title = meta.title_field if meta.title_field and meta.has_field(meta.title_field) else None
			party = next(
				(f for f in (title, "customer_name", "supplier_name", "party_name", "employee_name", "title") if f and meta.has_field(f)),
				None,
			)
			amount = next(
				(f for f in ("grand_total", "paid_amount", "total_debit", "total_amount") if meta.has_field(f)), None
			)
			extra = [f for f in (party, amount, "currency", "status") if f and meta.has_field(f)]
			fields = ["name", "creation", "modified", "docstatus", *dict.fromkeys(extra)]
			filters = {"company": self.company} if self.company and meta.has_field("company") else {}
			for row in frappe.get_list(
				doctype, filters=filters, fields=fields, order_by="creation desc", limit_page_length=4
			):
				rows.append(
					{
						"dt": doctype,
						"name": row.name,
						"title": row.get(title) if title else None,
						"party": row.get(party) if party else None,
						"amount": flt(row.get(amount)) if amount else None,
						"currency": row.get("currency") or None,
						"status": row.get("status") or None,
						"created": str(row.creation),
						"modified": str(row.modified),
						"ds": row.docstatus,
						"sub": 1 if meta.is_submittable else 0,
					}
				)
		rows.sort(key=lambda row: row["created"], reverse=True)
		return rows[:limit]


def last_months(today):
	"""The last twelve (year, month) pairs, oldest first, ending with this month."""
	out, year, month = [], today.year, today.month
	for _ in range(12):
		out.append((year, month))
		year, month = (year, month - 1) if month > 1 else (year - 1, 12)
	return out[::-1]


def card(spec, value, money, current, previous, route, series=None):
	return {
		"series": series,
		"l": spec["l"],
		"v": value,
		"m": 1 if money else 0,
		"cur": current,
		"prev": previous,
		"delta": None if current is None else change(current, previous),
		"route": route,
	}


def change(current, previous):
	if not previous:
		return None
	return round((current - previous) / abs(previous) * 100)
