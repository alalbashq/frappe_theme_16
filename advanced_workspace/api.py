"""What the signed-in user may see of the workspace.

Lists go through frappe.get_list, so a user's roles and User Permissions
apply to every figure: nothing is counted that they could not open.
"""

import json

import frappe
from frappe import _
from frappe.utils import add_days, add_months, flt, get_first_day, getdate, nowdate

MODULE_DT = "Advanced Workspace Module"
ITEM_TYPES = {"DocType": "dt", "Tree": "tree", "Report": "rp", "Page": "page", "Link": "url"}


@frappe.whitelist()
def home(action=None, key=None, company=None, lang=None):
	if frappe.session.user == "Guest" or frappe.get_cached_value("User", frappe.session.user, "user_type") != "System User":
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
		return module_figures(key, company)
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
	return frappe.get_list("Company", pluck="name", order_by="name asc", limit_page_length=50)


def pick_company(wanted):
	names = companies()
	if wanted and wanted in names:
		return wanted
	return names[0] if names else None


# ---------------------------------------------------------------------- figures


def module_figures(key, company):
	roles = set(frappe.get_roles())
	module = next((row for row in load_modules() if row["key"] == key), None)
	if not module or not holds_module(module, roles):
		frappe.throw(_("Unknown module"), frappe.PermissionError)
	company = pick_company(company)
	figures = Figures(company)
	cards = [card for card in (figures.kpi(spec) for spec in module["kpis"]) if card]
	return {
		"company": company,
		"currency": frappe.db.get_value("Company", company, "default_currency") if company else None,
		"kpis": cards,
		"drafts": figures.drafts(module),
	}


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
		today = nowdate()
		month_start = get_first_day(today)
		last_start = add_months(month_start, -1)
		last_end = add_days(month_start, -1)
		year_start = getdate(today).replace(month=1, day=1)
		money = spec["k"] != "count"
		if spec["k"] == "gl":
			if not can_read("GL Entry") or not self.company:
				return None
			now, before = getdate(today), getdate(last_start)
			route = ["query-report", "General Ledger"]
			value = self.gl_value(spec["root"], [(now.year, m) for m in range(1, now.month + 1)])
			if spec["root"] == "Cash":
				return card(spec, value, money, None, None, route)
			current = self.gl_value(spec["root"], [(now.year, now.month)])
			previous = self.gl_value(spec["root"], [(before.year, before.month)])
			return card(spec, value, money, current, previous, route)
		if not can_read(spec["dt"]):
			return None
		route = ["List", spec["dt"]]
		if not spec.get("d"):
			return card(spec, self.measure(spec, None, None), money, None, None, route)
		value = self.measure(spec, year_start, today)
		current = self.measure(spec, month_start, today)
		previous = self.measure(spec, last_start, last_end)
		return card(spec, value, money, current, previous, route)

	def drafts(self, module):
		out, seen = [], set()
		for item in module.get("items", []):
			if item["t"] != "dt" or item["n"] in seen or not can_read(item["n"]):
				continue
			seen.add(item["n"])
			if not frappe.get_meta(item["n"]).is_submittable:
				continue
			count = int(self.measure({"dt": item["n"], "w": {"docstatus": 0}}, None, None))
			if count:
				out.append({"l": item["l"], "n": item["n"], "c": count})
		return out


def card(spec, value, money, current, previous, route):
	return {
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
