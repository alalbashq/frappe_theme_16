// A statistic is set the way Frappe sets a number card: its document type is a link, the fields
// to sum and to date by come from that document type, and its filters are a table that opens
// Frappe's own filter editor. Filters are saved as Frappe's list of [doctype, field, condition,
// value]; ones written earlier as an object ({"docstatus": 1}) still show and still work.
// Words are English, translated from locale/ar.po under the context "Advanced Workspace".

(() => {
	const CONTEXT = "Advanced Workspace";
	const t = (text) => __(text, null, CONTEXT);
	const NUMBERS = ["Currency", "Float", "Int", "Percent"];
	const DATES = ["Date", "Datetime"];

	frappe.ui.form.on("Advanced Workspace Stat", {
		form_render(frm, cdt, cdn) {
			refresh_row(frm, cdt, cdn);
		},
		document(frm, cdt, cdn) {
			refresh_row(frm, cdt, cdn);
		},
		stat_type(frm, cdt, cdn) {
			refresh_row(frm, cdt, cdn);
		},
	});

	function open_form(frm, cdn) {
		const grid_row = frm.fields_dict.stats && frm.fields_dict.stats.grid.grid_rows_by_docname[cdn];
		return grid_row && grid_row.grid_form ? grid_row.grid_form : null;
	}

	function refresh_row(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (!row.document) {
			fill_choices(frm, cdn, row, null);
			render_filters(frm, cdt, cdn);
			return;
		}
		frappe.model.with_doctype(row.document, () => {
			fill_choices(frm, cdn, row, frappe.get_meta(row.document));
			render_filters(frm, cdt, cdn);
		});
	}

	// "Sum Of" lists the document's number fields, "Date Field" its dates and when it was made.
	function fill_choices(frm, cdn, row, meta) {
		const fields = (meta && meta.fields) || [];
		const choice = (df) => ({ value: df.fieldname, label: `${__(df.label, null, row.document)} (${df.fieldname})` });
		const keep = (options, current) =>
			current && !options.some((o) => o.value === current) ? [...options, { value: current, label: current }] : options;
		const sums = [{ value: "", label: "" }, ...fields.filter((df) => NUMBERS.includes(df.fieldtype)).map(choice)];
		const dates = [
			{ value: "", label: "" },
			...fields.filter((df) => DATES.includes(df.fieldtype)).map(choice),
			{ value: "creation", label: `${__("Created On")} (creation)` },
		];
		set_options(frm, cdn, "sum_field", keep(sums, row.sum_field));
		set_options(frm, cdn, "date_field", keep(dates, row.date_field));
	}

	function set_options(frm, cdn, fieldname, options) {
		frm.fields_dict.stats.grid.update_docfield_property(fieldname, "options", options);
		const form = open_form(frm, cdn);
		const control = form && form.fields_dict[fieldname];
		if (control) {
			control.df.options = options;
			control.refresh();
		}
	}

	function stored_filters(row) {
		let saved;
		try {
			saved = JSON.parse(row.filters || "[]");
		} catch (error) {
			return [];
		}
		if (Array.isArray(saved)) {
			return saved
				.filter((f) => Array.isArray(f) && f.length >= 3)
				.map((f) => (f.length === 3 ? [row.document, ...f] : f.slice(0, 4)));
		}
		return Object.entries(saved || {}).map(([field, value]) =>
			Array.isArray(value) && value.length === 2 && typeof value[0] === "string"
				? [row.document, field, value[0], value[1]]
				: [row.document, field, "=", value]
		);
	}

	function shown_value(value) {
		if (Array.isArray(value)) return value.join(", ");
		return value == null ? "" : String(value);
	}

	function render_filters(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		const form = open_form(frm, cdn);
		const field = form && form.fields_dict.filters;
		if (!field) return;
		const $field = $(field.wrapper);
		$field.siblings(".aw-stat-filters").remove();
		// the JSON gives way to the table, as it does on a number card
		$field.hide();
		if (row.stat_type === "Ledger") return;
		const can_edit = frm.has_perm("write");
		const $box = $(`<div class="aw-stat-filters frappe-control" style="margin-bottom: var(--margin-md)">
			<label class="control-label">${t("Filters")}</label>
			<table class="table table-bordered" style="margin: 0; cursor: ${can_edit ? "pointer" : "default"}">
				<thead><tr>
					<th style="width: 35%">${t("Field")}</th>
					<th style="width: 20%">${t("Condition")}</th>
					<th>${t("Value")}</th>
				</tr></thead>
				<tbody></tbody>
			</table>
			${can_edit ? `<p class="text-muted small" style="margin-top: 4px">${t("Click the table to edit the filters")}</p>` : ""}
		</div>`).insertAfter($field);
		const $body = $box.find("tbody");
		const filters = stored_filters(row);
		if (!filters.length) {
			$body.append(`<tr><td colspan="3" class="text-muted text-center">${
				row.document ? t("No filters. Click to add them.") : t("Set the document type first")
			}</td></tr>`);
		}
		filters.forEach(([doctype, fieldname, condition, value]) => {
			const label = (doctype && frappe.meta.get_label(doctype, fieldname)) || fieldname;
			const owner = doctype && doctype !== row.document ? ` <span class="text-muted">(${__(doctype)})</span>` : "";
			$body.append(`<tr>
				<td>${frappe.utils.escape_html(__(label, null, doctype))}${owner}</td>
				<td>${frappe.utils.escape_html(condition || "=")}</td>
				<td>${frappe.utils.escape_html(shown_value(value))}</td>
			</tr>`);
		});

		if (!can_edit) return;
		$box.find("table").on("click", () => {
			if (!row.document) {
				frappe.msgprint(t("Set the document type first"));
				return;
			}
			const dialog = new frappe.ui.Dialog({
				title: t("Statistic Filters"),
				fields: [{ fieldtype: "HTML", fieldname: "filter_area" }],
				primary_action_label: t("Apply"),
				primary_action() {
					const chosen = (group.get_filters() || []).map((f) => f.slice(0, 4));
					dialog.hide();
					frappe.model.set_value(cdt, cdn, "filters", JSON.stringify(chosen)).then(() => render_filters(frm, cdt, cdn));
				},
			});
			const group = new frappe.ui.FilterGroup({
				parent: dialog.get_field("filter_area").$wrapper,
				doctype: row.document,
				on_change: () => {},
			});
			if (filters.length) group.add_filters_to_filter_group(filters);
			dialog.show();
		});
	}
})();
