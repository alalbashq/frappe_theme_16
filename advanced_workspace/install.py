"""Install, migrate, and take over sites that ran the earlier Package version."""

import hashlib
import json
import os

import frappe
from frappe.installer import update_site_config

from advanced_workspace import access, catalog

MODULE = "Advanced Workspace"
LAYOUT_MODULE = "Form Layout"
PACKAGE = "advanced-workspace"
DOCTYPES = (
	"Advanced Workspace Module",
	"Advanced Workspace Item",
	"Advanced Workspace Stat",
	"Advanced Workspace Settings",
)
START_PAGE = "advanced-workspace-start"
START_FILE = "advanced-workspace-start.js"
ITEM_TYPES = {"dt": "DocType", "tree": "DocType", "rp": "Report", "page": "Page", "url": "URL"}
STAT_TYPES = {"sum": "Sum", "count": "Count", "gl": "Ledger"}


def before_install():
	adopt_package()
	# the workspace record names this role, and is synced before after_install runs
	access.ensure_role(access.ADVANCED_ROLE)


def after_install():
	adopt_package_rows()
	seed_modules()
	ensure_basics()
	access.apply_all()
	apply_form_layouts()


def before_migrate():
	ensure_layout_module()
	remember_layout_settings()


def after_migrate():
	for name in adopt_package_rows():
		access.apply_module(name)
	ensure_basics()
	apply_form_layouts()


# ---------------------------------------------------------------------- form layouts


def ensure_layout_module():
	"""Form Layout holds no DocTypes, so only an install makes its Module Def; a site that had the
	app before it gets one here, ahead of the customizations sync that links to it."""
	if not frappe.db.exists("Module Def", LAYOUT_MODULE):
		frappe.get_doc(
			{"doctype": "Module Def", "module_name": LAYOUT_MODULE, "app_name": "advanced_workspace"}
		).insert(ignore_permissions=True)


# what the site had, before this migrate, for each setting a layout file holds
_before_migrate = {}


def layout_files():
	folder = frappe.get_app_path("advanced_workspace", "form_layout", "custom")
	for name in sorted(os.listdir(folder)):
		if name.endswith(".json"):
			with open(os.path.join(folder, name), encoding="utf-8") as f:
				text = f.read()
			yield folder, name, text, json.loads(text)


def setter_name(setter):
	"""A Property Setter's name, as Frappe makes it."""
	return f"{setter['doc_type']}-{setter.get('field_name') or setter.get('row_name') or 'main'}-{setter['property']}"


def remember_layout_settings():
	_before_migrate.clear()
	for _folder, _name, _text, data in layout_files():
		for setter in data["property_setters"]:
			name = setter_name(setter)
			_before_migrate[name] = frappe.db.get_value("Property Setter", name, "value")


def apply_form_layouts():
	"""Lays each Form Layout file over its form when the file is new or has changed since it was
	last laid. Otherwise the form stays as the site has it, so what was changed there in Customize
	Form outlives a migrate.

	The files do not sync on every migrate (Frappe syncs them at install), but another app's
	customizations do, and may put that app's own value back over a setting (MYSYS POS has a field
	order for Sales Invoice). Such a setting returns to what the site had before the migrate: its
	own change, or the layout's.
	"""
	from frappe.modules.utils import sync_customizations_for_doctype

	others = None
	for folder, name, text, data in layout_files():
		# a form whose app is not installed yet is laid once it is
		if not frappe.db.exists("DocType", data["doctype"]):
			continue
		key = f"advanced_workspace_form_layout:{name}"
		stamp = hashlib.sha1(text.encode()).hexdigest()
		if frappe.db.get_global(key) != stamp:
			# A form the site's own settings make invalid (a Unique on a field with repeated
			# values, say: Frappe validates the whole form here) keeps its layout as it was
			# and is logged; the other forms, and the migrate, go on. It is tried again on
			# the next migrate, as its stamp is not written.
			savepoint = f"aw_layout_{hashlib.sha1(name.encode()).hexdigest()[:12]}"
			frappe.db.savepoint(savepoint)
			try:
				sync_customizations_for_doctype(data, folder, name)
				drop_removed(data)
				reset_saved_columns(data)
			except Exception:
				frappe.db.rollback(save_point=savepoint)
				frappe.log_error(title=f"Advanced Workspace: form layout {name} not applied")
				continue
			frappe.db.set_global(key, stamp)
			continue
		if others is None:
			others = other_apps_settings()
		for setter in data["property_setters"]:
			keep_site_setting(setter, others.get(setter_name(setter)))
	frappe.db.commit()


def other_apps_settings():
	"""The property setters that other apps sync on every migrate, by name, with their values."""
	values = {}
	for app in frappe.get_installed_apps():
		if app == "advanced_workspace":
			continue
		for module in frappe.get_module_list(app):
			folder = frappe.get_app_path(app, frappe.scrub(module), "custom")
			if not os.path.isdir(folder):
				continue
			for name in os.listdir(folder):
				if not name.endswith(".json"):
					continue
				with open(os.path.join(folder, name), encoding="utf-8") as f:
					data = json.load(f)
				if data.get("sync_on_migrate"):
					for setter in data.get("property_setters") or []:
						values[setter_name(setter)] = setter.get("value")
	return values


def keep_site_setting(setter, theirs):
	"""Puts back what the site had before the migrate, when another app's sync changed it."""
	name = setter_name(setter)
	before = _before_migrate.get(name)
	now = frappe.db.get_value("Property Setter", name, "value")
	ours = setter["value"]
	if before is None:
		return
	# the site had the layout's value, or one an app had put over it (in this migrate or at its
	# install): the layout's; otherwise the site's own change
	target = ours if before in (ours, theirs) else before
	if now == target:
		return
	doc = frappe.get_doc(
		dict(setter, doctype="Property Setter", value=target, module=LAYOUT_MODULE if target == ours else None)
	)
	doc.flags.validate_fields_for_doctype = False
	doc.insert(ignore_permissions=True)


def drop_removed(data):
	"""Frappe's sync only adds and updates, so what a layout file no longer has is removed here:
	its property setters, and its layout breaks (they hold no data)."""
	doctype = data["doctype"]
	kept = {(p["field_name"], p["property"]) for p in data["property_setters"]}
	for setter in frappe.get_all(
		"Property Setter",
		filters={"module": LAYOUT_MODULE, "doc_type": doctype},
		fields=["name", "field_name", "property"],
	):
		if (setter.field_name, setter.property) not in kept:
			frappe.delete_doc("Property Setter", setter.name, ignore_permissions=True)
	fields = {f["fieldname"] for f in data["custom_fields"]}
	for field in frappe.get_all(
		"Custom Field",
		filters={
			"module": LAYOUT_MODULE,
			"dt": doctype,
			"fieldtype": ["in", ["Tab Break", "Section Break", "Column Break"]],
		},
		fields=["name", "fieldname"],
	):
		if field.fieldname not in fields:
			frappe.delete_doc("Custom Field", field.name, ignore_permissions=True)


def reset_saved_columns(data):
	"""A table whose columns a layout sets shows them to everyone: the columns a user chose for it
	(Frappe keeps them per user, as GridView) are dropped once, whenever its layout file changes."""
	child = data["doctype"]
	if not any(p["property"] in ("in_list_view", "columns") for p in data["property_setters"]):
		return
	parents = set(frappe.get_all("DocField", filters={"fieldtype": "Table", "options": child}, pluck="parent"))
	parents |= set(frappe.get_all("Custom Field", filters={"fieldtype": "Table", "options": child}, pluck="dt"))
	for parent in parents:
		for user, raw in frappe.db.sql(
			"select `user`, `data` from `__UserSettings` where `doctype`=%s", parent
		):
			settings = json.loads(raw or "{}")
			if child in (settings.get("GridView") or {}):
				del settings["GridView"][child]
				frappe.db.sql(
					"update `__UserSettings` set `data`=%s where `user`=%s and `doctype`=%s",
					(json.dumps(settings), user, parent),
				)
	# the cached copies are written back to the table later, so they go too
	for raw in frappe.cache.hgetall("_user_settings"):
		key = raw.decode() if isinstance(raw, bytes) else raw
		if key.split("::", 1)[0] in parents:
			frappe.cache.hdel("_user_settings", key)


# ---------------------------------------------------------------------- the Package version


def adopt_package_rows():
	"""Rows the Package version wrote in its own shape, put into the app's.

	- A tree item was item_type "Tree"; the app keeps item_type "DocType" with doc_view "Tree"
	  (Frappe refuses to save a module that still has the old value).
	- A module named its roles in two columns, user_role and manager_role; the app reads its
	  roles table. A module with no roles there gets the roles of those columns, so whoever saw
	  it before still does; one without them gets the catalog's roles, as on a new site.
	  Only on such a site (the columns are still in the table): elsewhere a module without
	  roles was made that way and is left alone.

	Returns the modules given roles, for their permissions to be applied. Never touches a
	module that already has roles. Safe to run on every migrate.
	"""
	if not frappe.db.table_exists(access.MODULE_DT):
		return []
	frappe.db.sql(
		f"update `tab{access.ITEM_DT}` set item_type='DocType', doc_view='Tree' where item_type='Tree'"
	)
	old_columns = frappe.db.has_column(access.MODULE_DT, "user_role") and frappe.db.has_column(
		access.MODULE_DT, "manager_role"
	)
	if not old_columns:
		# not a site that ran the Package version: a module without roles there was made so
		# on purpose (in the menu's editor, say) and stays as it is
		return []
	catalog_by_key = {module["key"]: module for module in catalog.MODULES}
	given = []
	for name in frappe.get_all(access.MODULE_DT, pluck="name"):
		if frappe.db.exists(access.ROLE_DT, {"parent": name, "parenttype": access.MODULE_DT}):
			continue
		pairs = []
		user_role, manager_role = frappe.db.sql(
			f"select user_role, manager_role from `tab{access.MODULE_DT}` where name=%s", name
		)[0]
		pairs = [(role, level) for role, level in ((user_role, "User"), (manager_role, "Manager")) if role and frappe.db.exists("Role", role)]
		standard = []
		if not pairs:
			module = catalog_by_key.get(name) or {}
			role = module.get("role") or module.get("role_of") or frappe.db.get_value(access.MODULE_DT, name, "label") or name
			pairs = [(f"Workspace {role} User", "User"), (f"Workspace {role} Manager", "Manager")]
			standard = [r for r in catalog.STANDARD_ROLES.get(name, []) if frappe.db.exists("Role", r)]
		doc = frappe.get_doc(access.MODULE_DT, name)
		for role, level in pairs:
			access.ensure_role(role)
			doc.append("roles", {"role": role, "access": level})
		for role in standard:
			doc.append("roles", {"role": role, "access": "View Only"})
		doc.flags.seeding = True
		doc.save(ignore_permissions=True)
		given.append(name)
	return given


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
		user_role, manager_role = f"Workspace {role} User", f"Workspace {role} Manager"
		access.ensure_role(user_role)
		access.ensure_role(manager_role)
		doc = frappe.new_doc(access.MODULE_DT)
		doc.update(
			{
				"module_key": module["key"],
				"label": module["label"],
				"icon": module["icon"],
				"sequence": (index + 1) * 10,
				"enabled": 1,
				"read_only": 1 if module.get("read_only_items") else 0,
				"direct_link": 1 if module.get("link") else 0,
				"linked_doctypes": "\n".join(module.get("read", [])),
			}
		)
		doc.append("roles", {"role": user_role, "access": "User"})
		doc.append("roles", {"role": manager_role, "access": "Manager"})
		for item in items:
			doc.append(
				"items",
				{
					"label": item["l"],
					"item_type": ITEM_TYPES[item["t"]],
					"target": None if item["t"] == "url" else item["n"],
					"url": item["n"] if item["t"] == "url" else None,
					"doc_view": "Tree" if item["t"] == "tree" else None,
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
				doc.append("roles", {"role": name, "access": "View Only"})
		doc.flags.seeding = True
		doc.insert(ignore_permissions=True)


# What waits on the module home (unpaid invoices by due date) is a few hundred rows out
# of a table that runs to hundreds of thousands; without this a full scan took seconds.
INDEXES = {
	"Sales Invoice": ["outstanding_amount", "due_date"],
	"Purchase Invoice": ["outstanding_amount", "due_date"],
}


def ensure_indexes():
	for doctype, columns in INDEXES.items():
		if frappe.db.table_exists(doctype):
			frappe.db.add_index(doctype, columns, index_name="aw_outstanding_due_index")


def ensure_basics():
	"""What every site needs, safe to run on each migrate: nothing a site changed is undone."""
	ensure_indexes()
	settings = frappe.get_doc(access.SETTINGS_DT)
	if not settings.common_doctypes:
		settings.common_doctypes = "\n".join(catalog.COMMON_READ)
		settings.save(ignore_permissions=True)
	# The home was a Workspace record before it was the app's own page; a Frappe that ranks
	# workspaces first would keep opening the record, so it goes.
	if frappe.db.exists("Workspace", {"name": "Advanced Workspace", "module": MODULE}):
		frappe.delete_doc("Workspace", "Advanced Workspace", force=True, ignore_permissions=True, ignore_on_trash=True)
	# Frappe sends a role's holders to its Home Page from the site root and after login
	access.ensure_role(access.ADVANCED_ROLE)
	frappe.db.set_value("Role", access.ADVANCED_ROLE, "home_page", START_PAGE)
	frappe.db.commit()
