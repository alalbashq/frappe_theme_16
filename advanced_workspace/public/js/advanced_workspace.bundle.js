// Loaded on every Desk page. Holders of the workspace role, and whoever has opened the
// workspace on this browser, get its frame on any route, a reload or a new tab included.
import { isHome, mount } from "./advanced_workspace/shell";

const ROLE = "مستخدم مساحة العمل المتقدمة";
const roles = () => (frappe.boot && frappe.boot.user && frappe.boot.user.roles) || [];

// Before the router starts, so Frappe's own desktop never flashes on /desk.
(function () {
	const path = window.location.pathname.replace(/\/$/, "");
	if (path === "/desk" && roles().includes(ROLE)) {
		window.history.replaceState(null, "", "/desk/advanced-workspace");
	}
})();

$(document).on("app_ready", () => {
	const seen = localStorage.getItem(`advanced_workspace_shell:${frappe.session.user}`);
	if (seen || roles().includes(ROLE) || isHome()) mount();
	frappe.router.on("change", () => {
		if (isHome()) mount();
	});
});
