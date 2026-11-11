"""Frappe's sign-in page in the workspace's own look.

Frappe's forms and their script stay exactly as they are; this adds the
brand, the words and the moving background around them.
"""

import os

import frappe
from frappe.www.login import *  # noqa: F403 - the page settings Frappe's login defines
from frappe.www.login import get_context as frappe_get_context

import advanced_workspace

WORDS = {
	"ar": {
		"heading": "مرحباً بعودتك",
		"sub": "سجّل دخولك وكمّل شغلك من حيث وقفت.",
		"slides": [
			("فاتورتك جاهزة للطباعة", "قالب رسمي برمز الريال الجديد، ورصيد العميل في نفس الورقة."),
			("مخزونك قدّام عينك", "الرصيد والتحويل بين المستودعات، لحظة بلحظة."),
			("الكاشير ما يوقف", "نقطة البيع تكمّل لو انقطع الإنترنت، وتزامن أول ما يرجع."),
			("أرقامك في نظرة", "المبيعات والمصروفات وصافي الربح، مقارنة بالشهر الماضي."),
		],
		"show": "عرض",
	},
	"en": {
		"heading": "Welcome back",
		"sub": "Sign in and pick up where you left off.",
		"slides": [
			("Invoices ready to print", "An official layout with the new riyal sign and the customer's balance on the page."),
			("Your stock in plain sight", "Balances and transfers between warehouses, as they happen."),
			("The till keeps selling", "Point of sale carries on offline and syncs as soon as the connection is back."),
			("Your numbers at a glance", "Sales, expenses and net profit, against last month."),
		],
		"show": "Show",
	},
}


def get_context(context):
	out = frappe_get_context(context)
	lang = "ar" if (frappe.local.lang or "").startswith("ar") else "en"
	context.awl = frappe._dict(WORDS[lang])
	context.awl.lang = lang
	context.awl.version = advanced_workspace.__version__
	context.awl.logo = logo_on_disk(context.get("logo"))
	# Frappe's own heading asks for the logo too; a missing file is not requested at all
	context.logo = context.awl.logo or ""
	context.awl.year = frappe.utils.getdate().year
	return out


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
