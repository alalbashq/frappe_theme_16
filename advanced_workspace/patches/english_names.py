"""Sites set up before names went English (2026-11-12): move them to Frappe's way.

- A name is one English label; its Arabic comes from locale/ar.po. Where a site had
  written its own Arabic, it is kept as a row in Frappe's Translation list.
- A menu item is Frappe's shortcut: Tree becomes a DocType shown as a tree, Link a URL.
- A module's user role, manager role and other roles become one roles table.
- The roles take English names, so every link to them moves with them.
"""

import frappe
from frappe.translate import get_all_translations

CONTEXT = "Advanced Workspace"
MODULE = "Advanced Workspace Module"
ITEM = "Advanced Workspace Item"
STAT = "Advanced Workspace Stat"
ROLE_TABLE = "Advanced Workspace Role"

OLD_WORKSPACE_ROLE = "مستخدم مساحة العمل المتقدمة"
ROLE_WORDS = {
	"المالية": "Finance", "الحسابات": "Accounts", "المشتريات": "Purchasing", "المبيعات": "Sales",
	"الوصول": "Access", "المخازن": "Stock", "نقاط البيع": "Point of Sale", "الموارد البشرية": "HR",
	"الرواتب": "Payroll", "علاقات العملاء": "CRM", "المشاريع": "Projects", "التصنيع": "Manufacturing",
	"الأصول": "Assets", "الجودة": "Quality", "الدعم الفني": "Support",
}
# the form labels this app once wrote into the Translation list; locale/ar.po has them now
OLD_FORM_LABELS = (
	"Name in Arabic", "Name in English", "Type", "Document, Report or Link", "Enabled", "Calculation",
	"Document", "Sum Field", "Date Field", "Filters (JSON)", "Ledger Line", "Key", "Sequence", "Icon",
	"Read Only for Module Roles", "Opens First Item Directly", "Roles", "User Role", "Manager Role",
	"Other Roles That See This Module", "Menu Items", "Statistics", "Linked Documents",
	"Documents Needing Read Access (one per line)", "Documents Every Role Reads (one per line)",
	"Advanced Workspace Module", "Advanced Workspace Settings",
)


def execute():
	if not frappe.db.has_column(MODULE, "label_en"):
		return
	frappe.clear_cache()
	english_labels()
	shortcut_items()
	roles_tables()
	english_roles()
	frappe.db.delete("Translation", {"language": "ar", "source_text": ["in", OLD_FORM_LABELS]})
	frappe.clear_cache()


def english_labels():
	known = get_all_translations("ar")
	kept = {}
	for table in (MODULE, ITEM, STAT):
		for row in frappe.db.sql(f"select name, label, label_en from `tab{table}`", as_dict=True):
			english = (row.label_en or "").strip()
			arabic = (row.label or "").strip()
			if not english:
				continue  # a name written in one language only stays as it is
			if table == MODULE and english == "Projects":
				english = "Project Management"  # the module, apart from its Projects list
			frappe.db.set_value(table, row.name, "label", english, update_modified=False)
			if not arabic or arabic == english:
				continue
			if arabic in (known.get(f"{english}:{CONTEXT}"), known.get(english)) or english in kept:
				continue
			kept[english] = arabic
			frappe.get_doc(
				{
					"doctype": "Translation",
					"language": "ar",
					"source_text": english,
					"translated_text": arabic,
					"context": CONTEXT,
				}
			).insert(ignore_permissions=True)


def shortcut_items():
	for row in frappe.db.sql(f"select name, item_type, target from `tab{ITEM}`", as_dict=True):
		if row.item_type == "Tree":
			frappe.db.set_value(ITEM, row.name, {"item_type": "DocType", "doc_view": "Tree"}, update_modified=False)
		elif row.item_type == "Link":
			frappe.db.set_value(
				ITEM, row.name, {"item_type": "URL", "url": row.target, "target": None}, update_modified=False
			)


def roles_tables():
	if not frappe.db.has_column(MODULE, "user_role"):
		return
	for module in frappe.db.sql(f"select name, user_role, manager_role from `tab{MODULE}`", as_dict=True):
		if frappe.db.exists(ROLE_TABLE, {"parent": module.name, "parenttype": MODULE}):
			continue
		rows = [(module.user_role, "User"), (module.manager_role, "Manager")]
		rows += [
			(role, "View Only")
			for role in frappe.get_all(
				"Has Role", filters={"parent": module.name, "parenttype": MODULE}, pluck="role", order_by="idx asc"
			)
		]
		seen = set()
		for idx, (role, access) in enumerate((r for r in rows if r[0]), start=1):
			if role in seen:
				continue
			seen.add(role)
			frappe.get_doc(
				{
					"doctype": ROLE_TABLE,
					"parent": module.name,
					"parenttype": MODULE,
					"parentfield": "roles",
					"idx": idx,
					"role": role,
					"access": access,
				}
			).db_insert()
		frappe.db.delete("Has Role", {"parent": module.name, "parenttype": MODULE})


def english_roles():
	renames = {OLD_WORKSPACE_ROLE: "Advanced Workspace User"}
	for arabic, english in ROLE_WORDS.items():
		renames["مستخدم " + arabic] = f"Workspace {english} User"
		renames["مدير " + arabic] = f"Workspace {english} Manager"
	for old, new in renames.items():
		if frappe.db.exists("Role", old) and not frappe.db.exists("Role", new):
			frappe.rename_doc("Role", old, new, force=True, show_alert=False)
			frappe.db.set_value("Role", new, "role_name", new, update_modified=False)
		frappe.db.delete("Translation", {"language": "en", "source_text": old})
