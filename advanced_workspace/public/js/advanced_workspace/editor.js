// Arranging the menu in place, for whoever may write its modules: modules and their items are
// dragged into order (an item may move to another module), items and modules are added, items
// are removed, and the whole menu is saved at once.
//
// Dragging follows the pointer, so a mouse, a pen and a finger all work, and the arrow keys move
// the item whose handle has the focus. The menu sits in the frame's shadow root, where the
// browser's own drag and drop does not reach reliably.

const MODULE_DT = "Advanced Workspace Module";
const ITEM_TYPES = ["DocType", "Report", "Page", "URL"];
const KIND = { DocType: "dt", Report: "rp", Page: "page", URL: "url" };

export async function editMenu({ nav, side, t, esc, icon, canAddModule }) {
	const menu = await frappe.xcall("advanced_workspace.api.menu_for_editing");
	const removed = new Set();

	const itemHtml = (item, fresh) => `
    <div class="aw-edit-item${fresh ? " is-new" : ""}" ${fresh ? `data-new="${esc(JSON.stringify(fresh))}"` : `data-row="${esc(item.row)}"`}>
      <span class="aw-grip" data-drag="item" tabindex="0" role="button" aria-label="${esc(t("Drag to reorder"))}">${icon("grip")}</span>
      ${icon({ dt: "doc", tree: "tree", rp: "chart", page: "window", url: "link" }[item.t] || "doc")}
      <span class="name">${esc(item.l)}</span>
      <button class="aw-edit-x" data-remove aria-label="${esc(t("Remove"))}" title="${esc(t("Remove"))}">${icon("x")}</button>
    </div>`;
	const moduleHtml = (mod, fresh) => `
    <section class="aw-edit-mod${fresh ? " is-new" : ""}" ${fresh ? `data-new="${esc(JSON.stringify(fresh))}"` : `data-key="${esc(mod.key)}"`}>
      <div class="aw-edit-head">
        <span class="aw-grip" data-drag="mod" tabindex="0" role="button" aria-label="${esc(t("Drag to reorder"))}">${icon("grip")}</span>
        ${icon(mod.icon)}<span class="name">${esc(mod.label)}</span>
        ${fresh ? "" : `<button class="aw-edit-gear" data-settings aria-label="${esc(t("Module Settings"))}" title="${esc(t("Module Settings"))}">${icon("gear")}</button>`}
      </div>
      <div class="aw-edit-items">${mod.items.map((item) => itemHtml(item)).join("")}</div>
      <button class="aw-edit-add" data-add-item>${icon("plus")}<span>${esc(t("Add item"))}</span></button>
    </section>`;

	nav.innerHTML = `
  <div class="aw-edit">
    <div class="aw-edit-bar">
      <b>${esc(t("Edit Workspace"))}</b>
      <p>${esc(t("Drag modules and items into order, or add new ones."))}</p>
      <div><button class="aw-edit-save" data-save>${esc(t("Save"))}</button><button data-cancel>${esc(t("Cancel"))}</button></div>
    </div>
    <div class="aw-edit-mods">${menu.modules.map((mod) => moduleHtml(mod)).join("")}</div>
    ${canAddModule ? `<button class="aw-edit-add-mod" data-add-module>${icon("plus")}<span>${esc(t("Add module"))}</span></button>` : ""}
  </div>`;
	const root = nav.querySelector(".aw-edit");
	const mods = root.querySelector(".aw-edit-mods");

	// ------------------------------------------------------------------ dragging
	root.addEventListener("pointerdown", (event) => {
		const grip = event.target.closest("[data-drag]");
		if (!grip || event.button > 0) return;
		const kind = grip.dataset.drag;
		const piece = grip.closest(kind === "mod" ? ".aw-edit-mod" : ".aw-edit-item");
		event.preventDefault();
		piece.classList.add("is-dragging");
		root.classList.add("is-moving");
		const move = (e) => {
			// near the panel's top or bottom edge, it scrolls along
			const box = side.getBoundingClientRect();
			if (e.clientY < box.top + 40) side.scrollTop -= 10;
			else if (e.clientY > box.bottom - 40) side.scrollTop += 10;
			let list = piece.parentElement;
			if (kind === "item") {
				// an item goes to the module under the pointer
				const over = [...mods.children].find((mod) => {
					const r = mod.getBoundingClientRect();
					return e.clientY >= r.top && e.clientY <= r.bottom;
				});
				if (over) list = over.querySelector(".aw-edit-items");
			}
			const others = [...list.children].filter((c) => c !== piece);
			const before = others.find((c) => {
				const r = c.getBoundingClientRect();
				return e.clientY < r.top + r.height / 2;
			});
			if (before !== piece.nextElementSibling || list !== piece.parentElement) list.insertBefore(piece, before || null);
		};
		// on the window: the piece moves in the page as it is dragged, and a moved element loses
		// the pointer's capture, so its own listeners would miss the release
		const end = () => {
			piece.classList.remove("is-dragging");
			root.classList.remove("is-moving");
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", end);
			window.removeEventListener("pointercancel", end);
			grip.focus({ preventScroll: true });
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", end);
		window.addEventListener("pointercancel", end);
	});
	root.addEventListener("keydown", (event) => {
		const grip = event.target.closest?.("[data-drag]");
		if (!grip || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
		event.preventDefault();
		const piece = grip.closest(grip.dataset.drag === "mod" ? ".aw-edit-mod" : ".aw-edit-item");
		if (event.key === "ArrowUp" && piece.previousElementSibling) piece.parentElement.insertBefore(piece, piece.previousElementSibling);
		if (event.key === "ArrowDown" && piece.nextElementSibling) piece.parentElement.insertBefore(piece.nextElementSibling, piece);
		grip.focus();
	});

	// ------------------------------------------------------------------ adding and removing
	const addItem = (list) => {
		const dialog = new frappe.ui.Dialog({
			title: t("Add item"),
			fields: [
				{ fieldname: "item_type", fieldtype: "Select", label: t("Type"), options: ITEM_TYPES, default: "DocType", reqd: 1 },
				{
					fieldname: "target",
					fieldtype: "Dynamic Link",
					label: t("Link To"),
					options: "item_type",
					// only what opens by itself, found by its English or Arabic name
					get_query: () => ({ query: "advanced_workspace.api.menu_targets" }),
					depends_on: "eval:doc.item_type !== 'URL'",
					mandatory_depends_on: "eval:doc.item_type !== 'URL'",
				},
				{ fieldname: "doc_view", fieldtype: "Select", label: t("View"), options: "\nList\nTree", depends_on: "eval:doc.item_type === 'DocType'" },
				{
					fieldname: "url",
					fieldtype: "Data",
					label: t("URL"),
					depends_on: "eval:doc.item_type === 'URL'",
					mandatory_depends_on: "eval:doc.item_type === 'URL'",
				},
				{ fieldname: "label", fieldtype: "Data", label: t("Label"), description: t("Left empty, the item takes the name of what it opens.") },
			],
			primary_action_label: t("Add"),
			primary_action(values) {
				const fresh = {
					item_type: values.item_type,
					target: values.item_type === "URL" ? null : values.target,
					url: values.item_type === "URL" ? values.url : null,
					doc_view: values.item_type === "DocType" ? values.doc_view || null : null,
					label: values.label || null,
				};
				const kind = fresh.item_type === "DocType" && fresh.doc_view === "Tree" ? "tree" : KIND[fresh.item_type];
				list.insertAdjacentHTML(
					"beforeend",
					itemHtml({ t: kind, l: fresh.label || (fresh.url ? fresh.url : __(fresh.target)) }, fresh)
				);
				dialog.hide();
			},
		});
		dialog.show();
	};
	const addModule = () => {
		const dialog = new frappe.ui.Dialog({
			title: t("Add module"),
			fields: [
				{ fieldname: "label", fieldtype: "Data", label: t("Name"), reqd: 1 },
				{ fieldname: "icon", fieldtype: "Select", label: t("Icon"), options: menu.icons, default: "box" },
			],
			primary_action_label: t("Add"),
			primary_action(values) {
				const fresh = { label: values.label.trim(), icon: values.icon || "box" };
				mods.insertAdjacentHTML("beforeend", moduleHtml({ ...fresh, items: [] }, fresh));
				mods.lastElementChild.scrollIntoView({ block: "nearest" });
				dialog.hide();
			},
		});
		dialog.show();
	};

	return new Promise((resolve) => {
		root.addEventListener("click", async (event) => {
			const target = event.target.closest("button");
			if (!target) return;
			if (target.matches("[data-remove]")) {
				const item = target.closest(".aw-edit-item");
				if (item.dataset.row) removed.add(item.dataset.row);
				item.remove();
			} else if (target.matches("[data-add-item]")) {
				addItem(target.closest(".aw-edit-mod").querySelector(".aw-edit-items"));
			} else if (target.matches("[data-add-module]")) {
				addModule();
			} else if (target.matches("[data-settings]")) {
				// in a new tab, so what is arranged here is not lost
				window.open(frappe.utils.get_form_link(MODULE_DT, target.closest(".aw-edit-mod").dataset.key), "_blank");
			} else if (target.matches("[data-cancel]")) {
				resolve(null);
			} else if (target.matches("[data-save]")) {
				const arranged = [...mods.children].map((mod) => ({
					key: mod.dataset.key || null,
					new: mod.dataset.new ? JSON.parse(mod.dataset.new) : null,
					items: [...mod.querySelectorAll(".aw-edit-item")].map((item) =>
						item.dataset.row ? { row: item.dataset.row } : JSON.parse(item.dataset.new)
					),
				}));
				target.disabled = true;
				try {
					const modules = await frappe.xcall("advanced_workspace.api.save_menu", {
						menu: arranged,
						removed: [...removed],
					});
					frappe.show_alert({ message: t("The menu is saved."), indicator: "green" });
					resolve(modules);
				} catch (error) {
					// Frappe has shown the server's message; the menu stays open to be put right
					console.error(error);
					target.disabled = false;
				}
			}
		});
	});
}
