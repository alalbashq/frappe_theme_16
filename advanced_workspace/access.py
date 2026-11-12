"""Roles and permissions behind the workspace modules.

A module's roles table names its roles and what each gets: User and Manager get
the module's rights, decided by its menu (the documents it lists, the reports and
pages it opens, and the documents those need to read); View Only sees the module
with the rights it already has.
"""

import frappe

ADVANCED_ROLE = "Advanced Workspace User"
MODULE_DT = "Advanced Workspace Module"
ITEM_DT = "Advanced Workspace Item"
ROLE_DT = "Advanced Workspace Role"
SETTINGS_DT = "Advanced Workspace Settings"

PERM_FIELDS = [
	"permlevel", "if_owner", "select", "read", "write", "create", "delete", "submit", "cancel", "amend",
	"report", "export", "import", "share", "print", "email",
]
READ = {"read": 1, "print": 1, "report": 1}
USER = {"read": 1, "write": 1, "create": 1, "print": 1, "email": 1, "report": 1, "export": 1}
MANAGER = {
	"read": 1, "write": 1, "create": 1, "delete": 1, "submit": 1, "cancel": 1, "amend": 1, "print": 1,
	"email": 1, "report": 1, "export": 1, "share": 1,
}


def workspace_on(user=None):
	"""Whether the user gets the workspace design: the workspace role and at least one module to see.

	Everyone else keeps Frappe's own Desk, untouched.
	"""
	user = user or frappe.session.user
	if user == "Guest" or ADVANCED_ROLE not in frappe.get_roles(user):
		return False
	from advanced_workspace.api import visible_modules

	return bool(visible_modules())


def ensure_role(name):
	if not frappe.db.exists("Role", name):
		frappe.get_doc({"doctype": "Role", "role_name": name, "desk_access": 1}).insert(ignore_permissions=True)


def module_saved(doc, method=None):
	"""A module saved from its form: its roles get what its menu now needs."""
	if doc.flags.get("seeding"):
		return
	apply_module(doc.name)


def apply_all():
	for name in frappe.get_all(MODULE_DT, pluck="name"):
		apply_module(name)


def apply_module(name):
	module = frappe.db.get_value(MODULE_DT, name, ["read_only", "linked_doctypes"], as_dict=True)
	if not module:
		return
	levels = {}
	for row in frappe.get_all(ROLE_DT, filters={"parent": name, "parenttype": MODULE_DT}, fields=["role", "access"]):
		if row.access in ("User", "Manager"):
			levels[row.role] = row.access
	if not levels:
		return
	roles = list(levels)
	for role in roles:
		ensure_role(role)
	common = (frappe.db.get_single_value(SETTINGS_DT, "common_doctypes") or "").split("\n")
	items = frappe.get_all(ITEM_DT, filters={"parent": name, "parenttype": MODULE_DT}, fields=["item_type", "target"])
	for item in items:
		if not item.target or item.item_type == "URL":
			continue
		if item.item_type == "Report":
			allow_report(item.target, roles)
		elif item.item_type == "Page":
			allow_page(item.target, roles)
		else:
			for role, level in levels.items():
				grant(item.target, role, READ if module.read_only else MANAGER if level == "Manager" else USER)
	for doctype in (module.linked_doctypes or "").split("\n") + common:
		if doctype.strip():
			for role in roles:
				grant(doctype.strip(), role, READ)


def copy_standard(parent):
	# A Custom DocPerm replaces a DocType's standard rules, so those come along first.
	if frappe.db.exists("Custom DocPerm", {"parent": parent}):
		return
	for row in frappe.get_all("DocPerm", filters={"parent": parent}, fields=["role", *PERM_FIELDS]):
		values = {"doctype": "Custom DocPerm", "parent": parent, "parenttype": "DocType", "parentfield": "permissions"}
		values.update(row)
		frappe.get_doc(values).insert(ignore_permissions=True)


def grant(parent, role, flags):
	"""Add these rights for the role. Rights it already has are never taken away."""
	if not frappe.db.exists("DocType", parent):
		return
	meta = frappe.get_meta(parent)
	if meta.istable or meta.issingle:
		return
	copy_standard(parent)
	values = dict(flags)
	if not meta.is_submittable:
		for key in ("submit", "cancel", "amend"):
			values.pop(key, None)
	found = frappe.db.get_value("Custom DocPerm", {"parent": parent, "role": role, "permlevel": 0, "if_owner": 0})
	if found:
		current = frappe.get_doc("Custom DocPerm", found)
		changed = False
		for key, value in values.items():
			if value and not current.get(key):
				current.set(key, value)
				changed = True
		if changed:
			current.save(ignore_permissions=True)
	else:
		values.update(
			{
				"doctype": "Custom DocPerm",
				"parent": parent,
				"parenttype": "DocType",
				"parentfield": "permissions",
				"role": role,
				"permlevel": 0,
				"if_owner": 0,
			}
		)
		frappe.get_doc(values).insert(ignore_permissions=True)
	frappe.clear_cache(doctype=parent)


def allow_page(page, roles):
	if not frappe.db.exists("Page", page):
		return
	name = frappe.db.get_value("Custom Role", {"page": page})
	if name:
		doc = frappe.get_doc("Custom Role", name)
	else:
		doc = frappe.new_doc("Custom Role")
		doc.page = page
		for role in frappe.get_all("Has Role", filters={"parent": page, "parenttype": "Page"}, pluck="role"):
			doc.append("roles", {"role": role})
	_add_roles(doc, roles)


def allow_report(report, roles):
	if not frappe.db.exists("Report", report):
		return
	name = frappe.db.get_value("Custom Role", {"report": report})
	if name:
		doc = frappe.get_doc("Custom Role", name)
	else:
		doc = frappe.new_doc("Custom Role")
		doc.report = report
		doc.ref_doctype = frappe.db.get_value("Report", report, "ref_doctype")
		for role in frappe.get_all("Has Role", filters={"parent": report, "parenttype": "Report"}, pluck="role"):
			doc.append("roles", {"role": role})
	_add_roles(doc, roles)


def _add_roles(doc, roles):
	held = {row.role for row in doc.roles}
	missing = [role for role in roles if role not in held]
	for role in missing:
		doc.append("roles", {"role": role})
	if missing or doc.is_new():
		doc.save(ignore_permissions=True)
