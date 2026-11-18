// The MYSYS icon on every Desk page, whoever gets the workspace design: the browser tab, the icon a phone
// keeps on its home screen, the app manifest and the colour of the browser's bar. Desk's own page names the
// favicon from Website Settings, which may point at a file a site no longer has; the tab follows the app.
const BRAND = "/assets/advanced_workspace/images/brand";
const TEAL = "#005751";

function setLink(rel, href, attrs = {}) {
	let link = document.head.querySelector(`link[rel="${rel}"]`);
	if (!link) {
		link = document.createElement("link");
		link.rel = rel;
		document.head.appendChild(link);
	}
	link.href = href;
	Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
}

function setMeta(name, content) {
	document.head.querySelectorAll(`meta[name="${name}"]`).forEach((meta) => meta.setAttribute("content", content));
}

export function applyBrand() {
	setLink("icon", `${BRAND}/favicon.ico?v=3`, { type: "image/x-icon", sizes: "16x16 32x32 48x48" });
	setLink("shortcut icon", `${BRAND}/favicon.ico?v=3`, { type: "image/x-icon" });
	setLink("apple-touch-icon", `${BRAND}/apple-touch-icon.png?v=3`, { sizes: "180x180" });
	setLink("manifest", `${BRAND}/manifest.json?v=3`);
	setMeta("theme-color", TEAL);
	setMeta("msapplication-navbutton-color", TEAL);
}
