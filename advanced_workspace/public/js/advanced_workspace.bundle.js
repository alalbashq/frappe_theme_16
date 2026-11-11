// Loaded on every Desk page. The server decides at boot who gets the workspace design:
// the workspace role and a module to see. Everyone else keeps Frappe's own Desk.
import { mount } from "./advanced_workspace/shell";

const on = () => Boolean(frappe.boot && frappe.boot.advanced_workspace);

// Before the router starts, so Frappe's own desktop never flashes on /desk.
(function () {
	const path = window.location.pathname.replace(/\/$/, "");
	if (path === "/desk" && on()) {
		window.history.replaceState(null, "", "/desk/advanced-workspace");
	}
})();

$(document).on("app_ready", () => {
	if (on()) mount();
});
