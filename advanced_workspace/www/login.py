"""Frappe's sign-in page in the workspace's own look.

Frappe's forms and their script stay exactly as they are; this adds the
brand, the words and the moving background around them.
"""

import os

import frappe
from frappe.www.login import *  # noqa: F403 - the page settings Frappe's login defines
from frappe.www.login import get_context as frappe_get_context

import advanced_workspace


def get_context(context):
	out = frappe_get_context(context)
	# the words and slides are in login.html; this gives it what only Python knows
	context.awl = frappe._dict(
		lang="ar" if (frappe.local.lang or "").startswith("ar") else "en",
		version=asset_version(),
		logo=logo_on_disk(context.get("logo")),
		year=frappe.utils.getdate().year,
	)
	# Frappe's own heading asks for the logo too; a missing file is not requested at all
	context.logo = context.awl.logo or ""
	return out


def asset_version():
	"""Changes whenever the page's stylesheet or script does, so browsers never keep an old one."""
	public = os.path.join(os.path.dirname(advanced_workspace.__file__), "public")
	stamps = [os.path.getmtime(os.path.join(public, path)) for path in ("css/login_day.css", "js/login_day.js")]
	stamps.append(os.path.getmtime(os.path.join(public, "images", "login")))
	return f"{advanced_workspace.__version__}-{int(max(stamps))}"


def logo_on_disk(url):
	"""The site's own logo, or nothing: a missing file or Frappe's default shows the name instead."""
	url = url or ""
	if url.startswith("/files/"):
		return url if os.path.exists(frappe.get_site_path("public", url.lstrip("/"))) else None
	if url.startswith("/private/files/"):
		return url if os.path.exists(frappe.get_site_path(url.lstrip("/"))) else None
	if not url or url.startswith("/assets/frappe/"):
		return None
	return url
