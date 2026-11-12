// The workspace's home. Its frame draws over Desk, so this page only has to exist:
// /desk/advanced-workspace resolves to a page the same way on every Frappe 16 release,
// where a Workspace record of that name would depend on how each release reads workspaces.
frappe.pages["advanced-workspace"].on_page_load = (wrapper) => {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Advanced Workspace", null, "Advanced Workspace"),
		single_column: true,
	});
};
