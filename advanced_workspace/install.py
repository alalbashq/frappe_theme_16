"""Install, migrate, and take over sites that ran the earlier Package version."""

import json

import frappe
from frappe.installer import update_site_config

from advanced_workspace import access, catalog

MODULE = "Advanced Workspace"
PACKAGE = "advanced-workspace"
DOCTYPES = (
	"Advanced Workspace Module",
	"Advanced Workspace Item",
	"Advanced Workspace Stat",
	"Advanced Workspace Settings",
)
START_PAGE = "advanced-workspace-start"
START_FILE = "advanced-workspace-start.js"
ITEM_TYPES = {"dt": "DocType", "tree": "Tree", "rp": "Report", "page": "Page", "url": "Link"}
STAT_TYPES = {"sum": "Sum", "count": "Count", "gl": "Ledger"}


def before_install():
	adopt_package()
	# the workspace record names this role, and is synced before after_install runs
	access.ensure_role(access.ADVANCED_ROLE)


def after_install():
	seed_modules()
	ensure_basics()
	access.apply_all()


def after_migrate():
	ensure_basics()


# ---------------------------------------------------------------------- the Package version


def adopt_package():
	"""The Package version kept its code in scripts and blocks; the app carries all of that now.

	Its module and DocTypes move to the app with their rows, so the menu a
	site already set up stays as it is. Everything else it made is removed.
	"""
	if not frappe.db.exists("Module Def", MODULE):
		return
	for doctype, filters in (
		("Server Script", {"module": MODULE}),
		("Client Script", {"module": MODULE}),
		("Custom HTML Block", {"name": "Advanced Workspace Block"}),
		("Web Page", {"name": START_PAGE}),
		("File", {"file_name": START_FILE, "is_private": 0}),
		("Workspace", {"name": "Advanced Workspace"}),
	):
		for name in frappe.get_all(doctype, filters=filters, pluck="name"):
			frappe.delete_doc(doctype, name, force=True, ignore_permissions=True)

	# Frappe adds the app's Module Def right after this and refuses a second one. The
	# DocTypes keep their module name, so they belong to the new record.
	frappe.db.delete("Module Def", {"name": MODULE})
	for doctype in DOCTYPES:
		if frappe.db.exists("DocType", doctype):
			frappe.db.set_value("DocType", doctype, "custom", 0)

	if frappe.db.exists("Package", PACKAGE):
		for name in frappe.get_all("Package Release", filters={"package": PACKAGE}, pluck="name"):
			frappe.delete_doc("Package Release", name, force=True, ignore_permissions=True)
		frappe.delete_doc("Package", PACKAGE, force=True, ignore_permissions=True)

	# The Package version needed this line for /desk; the app loads its own script.
	includes = frappe.get_site_config().get("app_include_js")
	if isinstance(includes, list) and f"/files/{START_FILE}" in includes:
		rest = [path for path in includes if path != f"/files/{START_FILE}"]
		update_site_config("app_include_js", rest if rest else "None")
	frappe.db.commit()


# ---------------------------------------------------------------------- setup


def on_site(item):
	if item["t"] == "url":
		return True
	kinds = {"rp": "Report", "page": "Page"}
	return bool(frappe.db.exists(kinds.get(item["t"], "DocType"), item["n"]))


def seed_modules():
	"""The menu of a new site, from the catalog. Rows a site already has are never written over."""
	for index, module in enumerate(catalog.MODULES):
		if frappe.db.exists(access.MODULE_DT, module["key"]):
			continue
		# only what this site has: without HRMS, say, there is no HR module to show
		items = [item for item in ([module["link"]] if module.get("link") else module.get("items", [])) if on_site(item)]
		if not items:
			continue
		role = module.get("role") or module.get("role_of")
		user_role, manager_role = "مستخدم " + role, "مدير " + role
		access.ensure_role(user_role)
		access.ensure_role(manager_role)
		doc = frappe.new_doc(access.MODULE_DT)
		doc.update(
			{
				"module_key": module["key"],
				"label": module["label"],
				"label_en": catalog.ENGLISH.get(module["label"]),
				"icon": module["icon"],
				"sequence": (index + 1) * 10,
				"enabled": 1,
				"read_only": 1 if module.get("read_only_items") else 0,
				"direct_link": 1 if module.get("link") else 0,
				"user_role": user_role,
				"manager_role": manager_role,
				"linked_doctypes": "\n".join(module.get("read", [])),
			}
		)
		for item in items:
			doc.append(
				"items",
				{
					"label": item["l"],
					"label_en": catalog.ENGLISH.get(item["l"]),
					"item_type": ITEM_TYPES[item["t"]],
					"target": item["n"],
					"enabled": 1,
				},
			)
		for stat in module.get("kpis", []):
			if stat.get("dt") and not frappe.db.exists("DocType", stat["dt"]):
				continue
			doc.append(
				"stats",
				{
					"label": stat["l"],
					"label_en": catalog.ENGLISH.get(stat["l"]),
					"stat_type": STAT_TYPES[stat["k"]],
					"document": stat.get("dt"),
					"sum_field": stat.get("f"),
					"date_field": stat.get("d"),
					"filters": json.dumps(stat.get("w") or {}),
					"ledger_root": stat.get("root"),
				},
			)
		for name in catalog.STANDARD_ROLES.get(module["key"], []):
			if frappe.db.exists("Role", name):
				doc.append("roles", {"role": name})
		doc.flags.seeding = True
		doc.insert(ignore_permissions=True)


def ensure_basics():
	"""What every site needs, safe to run on each migrate: nothing a site changed is undone."""
	# rows from before the English column get it, never overwritten
	for table in DOCTYPES[:3]:
		for row in frappe.get_all(table, filters={"label_en": ["in", ["", None]]}, fields=["name", "label"]):
			if catalog.ENGLISH.get(row.label):
				frappe.db.set_value(table, row.name, "label_en", catalog.ENGLISH[row.label])
	for source, text in catalog.FORM_LABELS.items():
		if not frappe.db.exists("Translation", {"language": "ar", "source_text": source}):
			frappe.get_doc(
				{"doctype": "Translation", "language": "ar", "source_text": source, "translated_text": text}
			).insert(ignore_permissions=True)
	for word, english in catalog.ROLE_ENGLISH.items():
		for prefix, suffix in (("مستخدم ", " User"), ("مدير ", " Manager")):
			name = prefix + word
			if frappe.db.exists("Role", name) and not frappe.db.exists(
				"Translation", {"language": "en", "source_text": name}
			):
				frappe.get_doc(
					{
						"doctype": "Translation",
						"language": "en",
						"source_text": name,
						"translated_text": f"Workspace {english}{suffix}",
					}
				).insert(ignore_permissions=True)
	settings = frappe.get_doc(access.SETTINGS_DT)
	if not settings.common_doctypes:
		settings.common_doctypes = "\n".join(catalog.COMMON_READ)
		settings.save(ignore_permissions=True)
	# Frappe sends a role's holders to its Home Page from the site root and after login
	access.ensure_role(access.ADVANCED_ROLE)
	frappe.db.set_value("Role", access.ADVANCED_ROLE, "home_page", START_PAGE)
	frappe.db.commit()
