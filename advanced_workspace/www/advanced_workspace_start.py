"""Where a holder of the workspace role lands: the site root and the login send them here."""

import frappe

from advanced_workspace.access import workspace_on

no_cache = 1


def get_context(context):
	# a role holder with no module to see gets Frappe's own Desk
	frappe.local.flags.redirect_location = "/desk/advanced-workspace" if workspace_on() else "/desk"
	raise frappe.Redirect
