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
	// Left by earlier versions, which kept the frame for anyone who had opened it once.
	localStorage.removeItem(`advanced_workspace_shell:${frappe.session.user}`);
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
	const KIND_ICONS = { dt: "doc", tree: "tree", page: "window", rp: "chart", url: "link" };
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

	// A module's home. After Stripe, Ramp and the Business Central role centre: one panel of
	// figures led by the module's first, each with its last twelve months; what waits for
	// someone; the latest documents in a dense table; then every document with a way to make
	// one. Colour is kept for status. Every number opens the list behind it.
	const DOC_TYPES = ["dt", "tree", "page"];
	const label = (mod, doctype) => (mod.items.find((item) => item.n === doctype) || {}).l || __(doctype);
	const full = (value) => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
	// The lead figure takes the first column over every row; the rest fill up to three
	// columns beside it, and blank cells close the last row so no gap shows.
	const grid = (n) => {
		const others = Math.max(n - 1, 0);
		// up to four in one row; past that, three or four columns, whichever leaves fewer blanks
		let cols = Math.max(Math.min(others, 4), 1);
		if (others > 4) {
			const blanksFor = (c) => Math.ceil(others / c) * c - others;
			cols = blanksFor(4) < blanksFor(3) ? 4 : 3;
		}
		const rows = Math.max(1, Math.ceil(others / cols));
		return { cols, rows, blanks: others ? cols * rows - others : 0, odd: others % 2 === 1 };
	};
	const blanks = (count) => '<div class="aw-cell blank" aria-hidden="true"></div>'.repeat(count);

	function layout(mod) {
		const docs = mod.items.map((item, i) => [item, i]).filter(([item]) => DOC_TYPES.includes(item.t));
		const links = mod.items.map((item, i) => [item, i]).filter(([item]) => !DOC_TYPES.includes(item.t));
		const hasDocs = docs.some(([item]) => item.t === "dt");
		const options = home.companies.map((c) => `<option>${esc(c)}</option>`).join("");
		const tools = `<span class="aw-bar-tools"><small>${t("من بداية السنة")}</small>${
			home.companies.length > 1 ? `<select data-company aria-label="${t("الشركة")}">${options}</select>` : ""
		}<button data-refresh title="${t("تحديث")}" aria-label="${t("تحديث")}"><svg viewBox="0 0 24 24">${
			ICONS.refresh
		}</svg></button></span>`;
		// Cells of the final size, so nothing moves when the figures land.
		const n = mod.n || 0;
		const shape = grid(n);
		const cells =
			Array.from(
				{ length: n },
				(_, i) => `<div class="aw-cell is-wait${i === 0 ? " hero" : ""}" aria-hidden="true"><i></i><i></i></div>`
			).join("") + blanks(shape.blanks);
		const chips = docs
			.map(
				([item, i]) => `<div class="aw-chip" data-doc="${i}">
        <button class="aw-chip-open" data-link="${i}">${icon(KIND_ICONS[item.t])}<span>${esc(item.l)}</span></button>
        <small data-month></small><span data-new-slot></span>
      </div>`
			)
			.join("");
		const reports = links
			.map(
				([item, i]) =>
					`<button class="aw-rep" data-link="${i}">${icon(KIND_ICONS[item.t])}<span>${esc(item.l)}</span></button>`
			)
			.join("");
		main.innerHTML = `
    <div class="aw-bar"><h2>${t("نظرة عامة")}</h2>${tools}</div>
    ${
		n
			? `<section class="aw-figs${n === 1 ? " solo" : ""}" data-figs style="--cols: ${shape.cols}; --rows: ${shape.rows}">${cells}</section>`
			: ""
	}
    ${
		hasDocs
			? `<div class="aw-two">
      <section class="aw-box">
        <header><h2>${t("ما ينتظرك")}</h2><span class="aw-count-badge" data-queue-count hidden></span></header>
        <div data-queue><div class="aw-none">${t("جارٍ التحميل")}</div></div>
      </section>
      <section class="aw-box aw-recent">
        <header><h2>${t("آخر المستندات")}</h2></header>
        <div data-recent><div class="aw-none">${t("جارٍ التحميل")}</div></div>
      </section>
    </div>`
			: ""
	}
    ${docs.length ? `<h2 class="aw-sec-title">${t("المستندات")}</h2><div class="aw-chips">${chips}</div>` : ""}
    ${links.length ? `<h2 class="aw-sec-title">${t("التقارير والصفحات")}</h2><div class="aw-reps">${reports}</div>` : ""}`;
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

	// A line of the last twelve months, oldest first, with the area under it barely tinted.
	function spark(series, tall) {
		if (!series || series.length < 2 || !series.some((v) => v)) return "";
		const w = 120;
		const h = 32;
		const top = Math.max(...series);
		const low = Math.min(0, ...series);
		const span = top - low || 1;
		const points = series.map((v, i) => [(i / (series.length - 1)) * w, h - 3 - ((v - low) / span) * (h - 6)]);
		const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
		const [lx, ly] = points[points.length - 1];
		return `<svg class="aw-spark${tall ? " tall" : ""}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="0,${h} ${line} ${w},${h}"/><polyline points="${line}"/>
      <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.2"/></svg>`;
	}

	function amount(value, isMoney, currency) {
		return `<span dir="ltr">${compact(value)}</span>${isMoney ? money(currency) : ""}`;
	}

	function cell(card, i, currency) {
		const hero = i === 0;
		const dated = card.cur != null;
		const delta =
			card.delta == null
				? ""
				: `<span class="aw-delta${card.delta < 0 ? " down" : ""}"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>${Math.abs(
						card.delta
				  )}%</span>`;
		const compare = dated
			? `<p class="aw-cmp"><span>${t("هذا الشهر")} <b dir="ltr">${compact(card.cur)}</b></span><span>${t(
					"الشهر الماضي"
			  )} <b dir="ltr">${compact(card.prev || 0)}</b></span></p>`
			: "";
		return `<button class="aw-cell${hero ? " hero" : ""}" data-kpi="${i}" title="${esc(card.l)}: ${full(card.v)}">
      <span class="aw-cell-label"><span>${esc(card.l)}</span>${delta}</span>
      <span class="aw-cell-value">${amount(card.v, card.m, currency)}</span>
      ${spark(card.series, hero)}${compare}</button>`;
	}

	function paintKpis(mod, data) {
		const select = one("[data-company]");
		if (select && data.company) select.value = data.company;
		const box = one("[data-figs]");
		if (!box) return;
		const cards = data.kpis || [];
		const shape = grid(cards.length);
		box.style.setProperty("--cols", shape.cols);
		box.style.setProperty("--rows", shape.rows);
		box.classList.toggle("solo", cards.length === 1);
		box.classList.toggle("odd", shape.odd);
		box.innerHTML = cards.length
			? cards.map((card, i) => cell(card, i, data.currency)).join("") + blanks(shape.blanks)
			: `<div class="aw-none">${t("لا توجد إحصائيات لهذا المديول.")}</div>`;
		all("[data-kpi]").forEach((el) =>
			el.addEventListener("click", () => frappe.set_route(...cards[el.dataset.kpi].route))
		);
	}

	const QUEUE = {
		late: { dot: "late", sub: "متأخرة السداد" },
		soon: { dot: "soon", sub: "تستحق خلال ٧ أيام" },
		draft: { dot: "draft", sub: "مسودات بانتظار الاعتماد" },
	};
	const STATUS_TONE = {
		Paid: "ok", Completed: "ok", Submitted: "ok", Closed: "ok", Delivered: "ok", "To Bill": "ok",
		Unpaid: "warn", "Partly Paid": "warn", "To Deliver and Bill": "warn", "To Deliver": "warn",
		"To Receive and Bill": "warn", "To Receive": "warn", "Partially Paid": "warn",
		Overdue: "bad", Cancelled: "bad", "Overdue and Discounted": "bad",
		Draft: "draft", Return: "plain", "Credit Note Issued": "plain", "Debit Note Issued": "plain",
	};

	function queueRoute(row) {
		if (row.k === "draft") return frappe.set_route("List", row.dt, { docstatus: 0 });
		frappe.route_options = {
			docstatus: 1,
			outstanding_amount: [">", 0],
			due_date: row.k === "late" ? ["<", row.today] : ["between", [row.today, row.week]],
		};
		frappe.set_route("List", row.dt);
	}

	function paintLists(mod, data) {
		const docs = data.docs || {};
		all("[data-doc]").forEach((chip) => {
			const item = mod.items[chip.dataset.doc];
			const figures = docs[item.n];
			if (!figures) return;
			chip.querySelector("[data-month]").innerHTML =
				figures.cur || figures.prev
					? `<b dir="ltr">${figures.cur.toLocaleString("en-US")}</b> ${t("هذا الشهر")}`
					: t("لا جديد هذا الشهر");
			if (figures.new) {
				chip.querySelector("[data-new-slot]").innerHTML = `<button class="aw-plus" data-new title="${t(
					"جديد"
				)}: ${esc(item.l)}" aria-label="${t("جديد")}: ${esc(item.l)}">${icon("plus")}</button>`;
				chip.querySelector("[data-new]").addEventListener("click", () => frappe.new_doc(item.n));
			}
		});

		// a server not yet restarted sends no queue: its drafts stand in for it
		const queue =
			data.queue ||
			Object.entries(docs)
				.filter(([, figures]) => figures.drafts)
				.map(([doctype, figures]) => ({ k: "draft", dt: doctype, c: figures.drafts })) ||
			[];
		const queueBox = one("[data-queue]");
		if (queueBox) {
			const badge = one("[data-queue-count]");
			const total = queue.reduce((sum, row) => sum + row.c, 0);
			badge.hidden = !total;
			badge.textContent = total.toLocaleString("en-US");
			queueBox.innerHTML = queue.length
				? queue
						.map(
							(row, i) => `<button class="aw-q" data-q="${i}">
            <i class="aw-dot ${QUEUE[row.k].dot}"></i>
            <b class="aw-q-count" dir="ltr">${row.c.toLocaleString("en-US")}</b>
            <span class="aw-q-text"><span>${esc(label(mod, row.dt))}</span><small>${t(QUEUE[row.k].sub)}</small></span>
            ${row.v ? `<span class="aw-q-amount">${amount(row.v, true, data.currency)}</span>` : ""}
            <svg class="aw-q-go" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
          </button>`
						)
						.join("")
				: `<div class="aw-clear">${icon("check")}<span>${t("لا شيء ينتظرك الآن")}</span></div>`;
			all("[data-q]").forEach((el) => el.addEventListener("click", () => queueRoute(queue[el.dataset.q])));
		}

		const recentBox = one("[data-recent]");
		if (!recentBox) return;
		const recent = data.recent || [];
		const when = (value) => {
			try {
				return frappe.datetime.prettyDate ? frappe.datetime.prettyDate(value) : window.prettyDate(value);
			} catch (error) {
				return value.slice(0, 10);
			}
		};
		const state = (row) => {
			const name = row.status || (row.ds === 2 ? "Cancelled" : row.ds === 0 ? "Draft" : "Submitted");
			// some translations carry direction marks the font has no glyph for
			const text = __(name).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "");
			return `<i class="aw-st ${STATUS_TONE[name] || "plain"}">${esc(text)}</i>`;
		};
		recentBox.innerHTML = recent.length
			? `<table class="aw-table"><thead><tr>
          <th>${t("المستند")}</th><th>${t("الطرف")}</th><th class="num">${t("القيمة")}</th><th>${t("الحالة")}</th><th>${t("منذ")}</th>
        </tr></thead><tbody>${recent
			.map(
				(row, i) => `<tr data-act="${i}" tabindex="0">
          <td><b dir="ltr">${esc(row.name)}</b><small>${esc(label(mod, row.dt))}</small></td>
          <td class="party">${esc(row.party || row.title || "")}</td>
          <td class="num">${row.amount != null ? amount(row.amount, true, row.currency || data.currency) : ""}</td>
          <td>${state(row)}</td>
          <td class="when">${esc(when(row.created))}</td>
        </tr>`
			)
			.join("")}</tbody></table>`
			: `<div class="aw-none">${t("لا توجد مستندات بعد.")}</div>`;
		all("[data-act]").forEach((el) => {
			const go = () => frappe.set_route("Form", recent[el.dataset.act].dt, recent[el.dataset.act].name);
			el.addEventListener("click", go);
			el.addEventListener("keydown", (event) => event.key === "Enter" && go());
		});
	}

	const CACHE_MS = 5 * 60 * 1000;
	const cacheKey = (mod, part) =>
		`advanced_workspace:${frappe.session.user}:${LANG}:${mod.key}:${company || ""}:${part}`;
	function cached(mod, part) {
		try {
			const saved = JSON.parse(sessionStorage.getItem(cacheKey(mod, part)));
			return saved && Date.now() - saved.at < CACHE_MS ? saved.data : null;
		} catch (error) {
			return null;
		}
	}

	// The lists come back at once; the figures can take seconds on a large ledger,
	// so the two are asked for side by side and each paints when it lands.
	async function load(mod, part, paint, fresh, mine) {
		const saved = !fresh && cached(mod, part);
		if (saved) return paint(mod, saved);
		try {
			const data = await api({ action: "module", key: mod.key, company, part });
			try {
				sessionStorage.setItem(cacheKey(mod, part), JSON.stringify({ at: Date.now(), data }));
			} catch (error) {
				// storage full: the figures still show
			}
			if (mine === request) paint(mod, data);
		} catch (error) {
			if (mine !== request) return;
			const boxes = part === "kpis" ? ["[data-figs]"] : ["[data-queue]", "[data-recent]"];
			boxes.forEach((selector) => {
				const box = one(selector);
				if (box) box.innerHTML = `<div class="aw-none">${t("تعذر التحميل. أعد فتح المديول.")}</div>`;
			});
		}
	}

	function show(mod, fresh) {
		current = mod;
		one("[data-title]").textContent = mod.label;
		all(".aw-mod").forEach((row) => row.classList.toggle("on", row.dataset.key === mod.key));
		const mine = ++request;
		layout(mod);
		main.scrollTop = 0;
		load(mod, "lists", paintLists, fresh, mine);
		if (mod.n) load(mod, "kpis", paintKpis, fresh, mine);
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
