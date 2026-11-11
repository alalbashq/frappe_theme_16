"""Where a holder of the workspace role lands: the site root and the login send them here."""

import frappe

no_cache = 1


def get_context(context):
	frappe.local.flags.redirect_location = "/desk/advanced-workspace"
	raise frappe.Redirect
