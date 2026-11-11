// The workspace frame. It stays on <body> for the whole visit: Desk moves pages in and out,
// and lists, forms, reports and trees are Frappe's own pages, placed inside this frame.
import { ICONS, SAR } from "./icons";
import { WORDS } from "./words";
import { HTML, CSS } from "./markup";

const HOST_ID = "advanced-workspace-host";
const FONT_URL = "/assets/advanced_workspace/fonts/ibm-plex-sans-arabic";

// The route itself, not its text: "Advanced Workspace Module" holds the same words.
export function isHome() {
	const route = frappe.get_route() || [];
	return route[0] === "Workspaces" && route[route.length - 1] === "Advanced Workspace";
}

let syncFrame = null;

export function mount() {
	if (document.getElementById(HOST_ID)) {
		syncFrame?.();
		return;
	}
	const host = document.createElement("div");
	host.id = HOST_ID;
	document.body.appendChild(host);
	const scope = host.attachShadow({ mode: "open" });
	scope.innerHTML = `<style>${CSS}</style>${HTML}`;
	// Kept for this user on this browser: a new tab or a restart keeps the frame.
	localStorage.setItem(`advanced_workspace_shell:${frappe.session.user}`, "1");
	document.head.appendChild(pageStyle());
	document.documentElement.classList.add("aw-on");
	run(scope);
}

// Rules for the page around the frame. Fonts are declared here, not in the shadow root,
// because a font face only loads from the document.
function pageStyle() {
	const faces = [400, 500, 600, 700]
		.map(
			(weight) =>
				`@font-face { font-family: "IBM Plex Sans Arabic"; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("${FONT_URL}/ibm-plex-sans-arabic-${weight}.woff2") format("woff2"); }`
		)
		.join("\n");
	const style = document.createElement("style");
	style.textContent = `
  ${faces}
  html.aw-on { --font-stack: "IBM Plex Sans Arabic", "InterVariable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  :root { --aw-side: clamp(200px, 14vw, 260px); }
  body.aw-framed .body-sidebar-container { display: none !important; }
  body.aw-framed .sidebar-toggle-btn { display: none !important; }
  body > .frappe-menu { z-index: 1030 !important; }
  body > .dropdown-notifications { position: fixed; top: 42px; bottom: 0; left: 0; z-index: 1030; width: 360px; max-width: 100vw; }
  body > .dropdown-notifications .notifications-list { position: absolute; inset: 0; width: 100% !important; min-width: 0 !important; height: 100% !important; min-height: 0; }
  body.aw-framed .main-section { position: fixed !important; inset: 42px var(--aw-side) 0 0; width: auto !important; height: auto !important; }
  html[dir="ltr"] body.aw-framed .main-section { inset: 42px 0 0 var(--aw-side); }
  body.aw-framed.aw-no-side .main-section { inset: 42px 0 0 0; }
  html[dir="ltr"] body > .dropdown-notifications { left: auto; right: 0; }
  @media (max-width: 1023px) { body.aw-framed .main-section, html[dir="ltr"] body.aw-framed .main-section { inset: 42px 0 0 0; } }
`;
	return style;
}

function run(scope) {
	const LANG = frappe.boot.lang || "en";
	const t = (arabic) => (LANG === "ar" ? arabic : __(WORDS[arabic] || arabic));
	const one = (selector) => scope.querySelector(selector);
	const all = (selector) => [...scope.querySelectorAll(selector)];
	const esc = (value) => frappe.utils.escape_html(value == null ? "" : String(value));
	const app = one(".aw");
	app.dir = frappe.utils.is_rtl() ? "rtl" : "ltr";
	all("[data-t]").forEach((el) => {
		el.textContent = t(el.dataset.t);
	});
	all("[data-t-title]").forEach((el) => {
		el.title = t(el.dataset.tTitle);
		el.setAttribute("aria-label", el.title);
	});
	const main = one("[data-main]");
	const CHEVRON = '<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
	const icon = (name) => `<svg viewBox="0 0 24 24">${ICONS[name] || ICONS.box}</svg>`;
	const api = (args) => frappe.xcall("advanced_workspace.api.home", args);

	let home = null;
	let current = null;
	let company = localStorage.getItem("advanced_workspace_company") || null;
	let request = 0;

	function compact(value) {
		const abs = Math.abs(value);
		if (abs >= 1e6) return (value / 1e6).toFixed(2) + " M";
		if (abs >= 1e4) return (value / 1e3).toFixed(1) + " K";
		return Number(value.toFixed(2)).toLocaleString("en-US");
	}

	function money(currency) {
		if (currency === "SAR") return SAR;
		return currency ? `<small>${esc(currency)}</small>` : "";
	}

	const DRAWER_WIDTH = 1023;
	const closeDrawer = () => app.classList.remove("is-open");

	function open(item) {
		closeDrawer();
		if (item.t === "page") frappe.set_route(item.n);
		else if (item.t === "url" && item.n.startsWith("/desk/")) frappe.set_route(item.n.slice(6));
		else if (item.t === "url") window.location.href = item.n;
		else if (item.t === "rp") frappe.set_route("query-report", item.n);
		else if (item.t === "tree") frappe.set_route("Tree", item.n);
		else frappe.set_route("List", item.n);
	}

	function buildNav() {
		const nav = one("[data-nav]");
		nav.innerHTML = home.modules
			.map(
				(mod) => `
    <div class="aw-mod" data-key="${esc(mod.key)}">
      <button class="aw-mod-btn" aria-expanded="false">${icon(mod.icon)}<span>${esc(mod.label)}</span>${
					mod.items.length ? CHEVRON : ""
				}</button>
      <div class="aw-sub">${mod.items.map((item, i) => `<button data-i="${i}">${esc(item.l)}</button>`).join("")}</div>
    </div>`
			)
			.join("");
		all(".aw-mod").forEach((row) => {
			const mod = home.modules.find((m) => m.key === row.dataset.key);
			row.querySelector(".aw-mod-btn").addEventListener("click", () => {
				if (mod.link) return open(mod.link);
				// Nothing closes by itself: a list collapsing above the pointer is what shook the menu.
				const button = row.querySelector(".aw-mod-btn");
				const isOpen = row.classList.contains("open");
				const shown = current === mod && isHome();
				if (!isOpen || shown) {
					row.classList.toggle("open", !isOpen);
					button.setAttribute("aria-expanded", !isOpen);
				}
				if (!shown) goHome(mod);
			});
			row.querySelectorAll("[data-i]").forEach((btn) =>
				btn.addEventListener("click", () => open(mod.items[btn.dataset.i]))
			);
		});
	}

	function layout(mod) {
		const links = mod.items
			.map((item, i) => `<button class="aw-card aw-link" data-link="${i}">${esc(item.l)}</button>`)
			.join("");
		const options = home.companies.map((c) => `<option>${esc(c)}</option>`).join("");
		// Empty tiles of the final size, so nothing moves when the figures land.
		const places = Array.from({ length: mod.n || 0 }, () => '<div class="aw-card aw-kpi plain"></div>').join("");
		main.innerHTML = `<div class="aw-bar"><h2>${t("الإحصائيات")}</h2><span><small>${t("من بداية السنة")}</small>${
			home.companies.length > 1 ? `<select data-company aria-label="${t("الشركة")}">${options}</select>` : ""
		}<button data-refresh title="${t("تحديث")}" aria-label="${t("تحديث")}"><svg viewBox="0 0 24 24">${
			ICONS.refresh
		}</svg></button></span></div>
    <div class="aw-kpis" data-kpis>${places}</div>
    <h2 class="aw-head">${t("المستندات والتقارير")}</h2>
    <div class="aw-links">${links}</div>
    <h2 class="aw-head">${t("لوحة التحكم")}</h2>
    <div class="aw-drafts" data-drafts></div>`;
		const select = one("[data-company]");
		if (select && company) select.value = company;
		select?.addEventListener("change", (event) => {
			company = event.target.value;
			localStorage.setItem("advanced_workspace_company", company);
			show(mod);
		});
		one("[data-refresh]").addEventListener("click", () => show(mod, true));
		all("[data-link]").forEach((el) => el.addEventListener("click", () => open(mod.items[el.dataset.link])));
	}

	function amount(value, isMoney, currency) {
		return `<span dir="ltr">${compact(value)}</span>${isMoney ? money(currency) : ""}`;
	}

	function tile(card, i, currency) {
		const dated = card.cur != null;
		const top = Math.max(Math.abs(card.cur || 0), Math.abs(card.prev || 0)) || 1;
		const delta =
			card.delta == null
				? ""
				: `<span class="aw-delta ${card.delta < 0 ? "down" : ""}"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>${Math.abs(
						card.delta
				  )}%</span>`;
		const compare = dated
			? `<dl class="aw-compare">
      <div><dt>${t("هذا الشهر")}</dt><dd>${amount(card.cur, false)}</dd></div>
      <div><dt>${t("الشهر الماضي")}</dt><dd>${amount(card.prev || 0, false)}</dd></div>
    </dl>
    <div class="aw-meter" aria-hidden="true"><i class="past" style="width:${
		(Math.abs(card.prev || 0) / top) * 100
	}%"></i><i style="width:${(Math.abs(card.cur) / top) * 100}%"></i></div>`
			: "";
		return `<button class="aw-card aw-kpi ${dated ? "" : "plain"}" data-kpi="${i}">
    <div class="aw-kpi-label"><span>${esc(card.l)}</span>${delta}</div>
    <div class="aw-kpi-value">${amount(card.v, card.m, currency)}</div>${compare}</button>`;
	}

	function paint(mod, data) {
		const select = one("[data-company]");
		if (select && data.company) select.value = data.company;
		one("[data-kpis]").innerHTML =
			data.kpis.map((card, i) => tile(card, i, data.currency)).join("") ||
			`<div class="aw-wait">${t("لا توجد إحصائيات لهذا المديول.")}</div>`;
		one("[data-drafts]").innerHTML = data.drafts.length
			? data.drafts
					.map(
						(row, i) =>
							`<button data-draft="${i}"><span>${t("مسودات")} ${esc(row.l)}</span><b>${row.c}</b></button>`
					)
					.join("")
			: `<p>${t("لا توجد مسودات تنتظر الاعتماد.")}</p>`;
		all("[data-kpi]").forEach((el) =>
			el.addEventListener("click", () => frappe.set_route(...data.kpis[el.dataset.kpi].route))
		);
		all("[data-draft]").forEach((el) =>
			el.addEventListener("click", () =>
				frappe.set_route("List", data.drafts[el.dataset.draft].n, { docstatus: 0 })
			)
		);
	}

	const CACHE_MS = 5 * 60 * 1000;
	const cacheKey = (mod) => `advanced_workspace:${frappe.session.user}:${LANG}:${mod.key}:${company || ""}`;
	function cached(mod) {
		try {
			const saved = JSON.parse(sessionStorage.getItem(cacheKey(mod)));
			return saved && Date.now() - saved.at < CACHE_MS ? saved.data : null;
		} catch (error) {
			return null;
		}
	}

	async function show(mod, fresh) {
		current = mod;
		one("[data-title]").textContent = mod.label;
		all(".aw-mod").forEach((row) => row.classList.toggle("on", row.dataset.key === mod.key));
		const mine = ++request;
		layout(mod);
		const saved = !fresh && cached(mod);
		if (saved) return paint(mod, saved);
		try {
			const data = await api({ action: "module", key: mod.key, company });
			try {
				sessionStorage.setItem(cacheKey(mod), JSON.stringify({ at: Date.now(), data }));
			} catch (error) {
				// storage full: the figures still show
			}
			if (mine === request) paint(mod, data);
		} catch (error) {
			if (mine === request)
				one("[data-kpis]").innerHTML = `<div class="aw-wait">${t("تعذر التحميل. أعد فتح المديول.")}</div>`;
		}
	}

	function sync() {
		const framed = !isHome();
		document.body.classList.toggle("aw-framed", framed);
		app.classList.toggle("is-framed", framed);
		const route = frappe.get_route() || [];
		const name = ["query-report", "List", "Form", "Tree"].includes(route[0]) ? route[1] : route[0];
		all(".aw-sub button").forEach((btn) => btn.classList.remove("on"));
		if (!framed || !name || !home) return;
		for (const row of all(".aw-mod")) {
			const mod = home.modules.find((m) => m.key === row.dataset.key);
			const i = mod.items.findIndex((item) => item.n === name);
			if (i < 0) continue;
			// The open module wins when several hold this document.
			if (row.classList.contains("open") || !one(".aw-mod.open")) {
				row.classList.add("open");
				row.querySelector(`[data-i="${i}"]`)?.classList.add("on");
				return;
			}
		}
	}

	function goHome(mod) {
		if (!isHome()) frappe.set_route("advanced-workspace");
		show(mod);
	}

	// Frappe's own panel, with its tabs, reading and counts. It sits in the Desk sidebar, hidden
	// behind this frame, so it moves to <body>; its code keeps working on the same element.
	function wireNotifications() {
		const bell = one("[data-bell]");
		const count = one("[data-bell-count]");
		const panel = document.querySelector(".dropdown-notifications");
		if (!panel) {
			bell.hidden = true;
			return;
		}
		const source = document.querySelector(".sidebar-notification-count");
		const showCount = () => {
			const text = source ? source.textContent.trim() : "";
			count.textContent = text;
			count.hidden = !text || source.classList.contains("hidden");
		};
		if (source) {
			new MutationObserver(showCount).observe(source, {
				childList: true,
				characterData: true,
				subtree: true,
				attributes: true,
			});
			showCount();
		}
		document.body.appendChild(panel);
		bell.addEventListener("click", (event) => {
			// Frappe closes the panel on any click outside it, and this button is outside.
			event.stopPropagation();
			panel.classList.toggle("hidden");
			if (!panel.classList.contains("hidden")) window.jQuery(panel).trigger("show.bs.dropdown");
		});
		document.addEventListener("click", (event) => {
			if (!event.composedPath().includes(panel)) panel.classList.add("hidden");
		});
	}

	function wireTop() {
		// Frappe's own search window: its button sits in the Desk sidebar behind this frame.
		one("[data-search]").addEventListener("click", () => {
			const opener =
				document.querySelector("#navbar-modal-search") ||
				document.querySelector(".navbar-modal-search-mobile");
			if (opener) opener.click();
		});
		one("[data-full]").addEventListener("click", () =>
			document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
		);
		one("[data-theme]").addEventListener("click", () => new frappe.ui.ThemeSwitcher().show());
		wireNotifications();
		const language = one("[data-lang]");
		const target = LANG === "ar" ? "en" : "ar";
		language.textContent = target === "ar" ? "العربية" : "English";
		language.addEventListener("click", async () => {
			language.disabled = true;
			await api({ action: "language", lang: target });
			window.location.reload();
		});
		one("[data-go-home]").addEventListener("click", () => {
			const first = home.modules.find((m) => m.key === "accounts") || home.modules.find((m) => !m.link);
			if (first) goHome(first);
		});
		one("[data-scrim]").addEventListener("click", closeDrawer);
		one("[data-toggle]").addEventListener("click", () => {
			if (window.innerWidth <= DRAWER_WIDTH) return app.classList.toggle("is-open");
			document.body.classList.toggle("aw-no-side", app.classList.toggle("is-closed"));
		});
		const avatar = one("[data-user-btn]");
		avatar.innerHTML = home.image
			? `<img src="${esc(home.image)}" alt="">`
			: esc(frappe.get_abbr(home.full_name || frappe.session.user));
		// Frappe's own menu, the one at the top of its sidebar, under the avatar.
		const items = frappe.app.sidebar?.sidebar_header?.dropdown_items || [];
		frappe.ui.create_menu({
			parent: window.jQuery(avatar),
			// Measures from the avatar's far edge, so the menu stays on screen either way round.
			open_on_left: true,
			menu_items: [
				{
					name: "my-profile",
					label: "My Profile",
					icon: "user",
					onClick: () => frappe.ui.toolbar.route_to_user(),
				},
				{ is_divider: true },
				...(items.length
					? items.filter((item) => item.name !== "edit-sidebar")
					: [{ name: "logout", label: "Logout", icon: "logout", onClick: () => frappe.app.logout() }]),
			],
		});
	}

	(async () => {
		try {
			home = await api({ action: "home" });
		} catch (error) {
			main.innerHTML = `<div class="aw-empty">${t("تعذر تحميل مساحة العمل. أعد تحميل الصفحة.")}</div>`;
			return;
		}
		wireTop();
		buildNav();
		syncFrame = sync;
		frappe.router.on("change", sync);
		sync();
		const first = home.modules.find((m) => m.key === "accounts") || home.modules.find((m) => !m.link);
		if (!first) {
			main.innerHTML = `<div class="aw-empty">${t(
				"لا توجد مديولات مخصصة لحسابك. اطلب من مدير النظام إسناد دور لك."
			)}</div>`;
			one("[data-title]").textContent = t("مساحة العمل");
			return;
		}
		if (!one(".aw-mod.open")) one(`.aw-mod[data-key="${first.key}"]`)?.classList.add("open");
		show(first);
	})();
}
