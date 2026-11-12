"""What each module shows and which roles it brings. Only the documents that matter.

Every label is English, as in Frappe; its Arabic is in locale/ar.po under the context
"Advanced Workspace"."""


def dt(name, label, tree=False):
	return {"t": "tree" if tree else "dt", "n": name, "l": label}


def page(name, label):
	return {"t": "page", "n": name, "l": label}


def url(path, label):
	return {"t": "url", "n": path, "l": label}


def rp(name, label):
	return {"t": "rp", "n": name, "l": label}


def sum_kpi(label, doctype, field, date="posting_date", where=None):
	return {"l": label, "k": "sum", "dt": doctype, "f": field, "d": date, "w": where or {"docstatus": 1}}


def count_kpi(label, doctype, date=None, where=None):
	return {"l": label, "k": "count", "dt": doctype, "d": date, "w": where or {}}


def gl_kpi(label, root):
	return {"l": label, "k": "gl", "root": root}


MODULES = [
	{
		"key": "pos", "label": "Point of Sale", "icon": "pos", "role": "Point of Sale",
		"items": [page("point-of-sale", "Open Point of Sale"), dt("POS Profile", "POS Profiles"), dt("POS Opening Entry", "Shift Opening"), dt("POS Closing Entry", "Shift Closing"), dt("POS Invoice", "POS Invoice"), dt("Sales Invoice", "Sales Invoice")],
		"read": ["Customer", "Item", "Warehouse"],
		"kpis": [count_kpi("POS Invoices", "Sales Invoice", date="posting_date", where={"docstatus": 1, "is_pos": 1}), count_kpi("POS Profiles", "POS Profile", where={"disabled": 0})],
	},
	{
		"key": "finance", "label": "Financial Management", "icon": "wallet", "role": "Finance",
		"items": [
			rp("Profit and Loss Statement", "Income Statement"), rp("Balance Sheet", "Balance Sheet"),
			rp("Cash Flow", "Cash Flow"), rp("Budget Variance Report", "Budget Variance"),
			dt("Budget", "Budgets"), dt("Cost Center", "Cost Centers", tree=True), dt("Bank Account", "Bank Accounts"),
		],
		"read": ["GL Entry", "Account", "Fiscal Year"],
		"kpis": [gl_kpi("Total Income", "Income"), gl_kpi("Total Expenses", "Expense"), gl_kpi("Net Profit", "Net"), gl_kpi("Cash and Bank Balance", "Cash")],
	},
	{
		"key": "accounts", "label": "Accounts", "icon": "banknote", "role": "Accounts",
		"items": [
			dt("Account", "Chart of Accounts", tree=True), dt("Sales Invoice", "Sales Invoice"), dt("Purchase Invoice", "Purchase Invoice"),
			dt("Journal Entry", "Journal Entries"), dt("Payment Entry", "Payment Entry"), rp("Accounts Receivable", "Accounts Receivable"),
			rp("General Ledger", "General Ledger"), rp("Trial Balance", "Trial Balance"), rp("Accounts Payable", "Accounts Payable"),
		],
		"read": ["GL Entry", "Customer", "Supplier", "Item", "Fiscal Year"],
		"kpis": [
			sum_kpi("Total Sales Invoices", "Sales Invoice", "grand_total"),
			sum_kpi("Total Purchase Invoices", "Purchase Invoice", "grand_total"),
			sum_kpi("Total Payments Received", "Payment Entry", "paid_amount", where={"docstatus": 1, "payment_type": "Receive"}),
			sum_kpi("Total Payments Made", "Payment Entry", "paid_amount", where={"docstatus": 1, "payment_type": "Pay"}),
			sum_kpi("Customer Receivables", "Sales Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			sum_kpi("Supplier Payables", "Purchase Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			count_kpi("Journal Entries", "Journal Entry", date="posting_date", where={"docstatus": 1}),
			count_kpi("Payment Entries", "Payment Entry", date="posting_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "buying", "label": "Purchasing", "icon": "bag", "role": "Purchasing",
		"items": [
			dt("Supplier", "Suppliers"), dt("Material Request", "Material Request"), dt("Purchase Order", "Purchase Order"), dt("Purchase Receipt", "Purchase Receipt"),
			dt("Purchase Invoice", "Purchase Invoice"), rp("Purchase Register", "Purchase Register"), rp("Accounts Payable", "Supplier Payables"), rp("Purchase Analytics", "Purchase Analytics"),
		],
		"read": ["Item", "Warehouse"],
		"kpis": [
			sum_kpi("Purchase Invoices", "Purchase Invoice", "grand_total"), sum_kpi("Purchase Orders", "Purchase Order", "grand_total", date="transaction_date"),
			count_kpi("Material Requests", "Material Request", date="transaction_date", where={"docstatus": 1}), count_kpi("Suppliers", "Supplier", where={"disabled": 0}),
			sum_kpi("Supplier Payables", "Purchase Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			count_kpi("Purchase Receipts", "Purchase Receipt", date="posting_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "selling", "label": "Sales", "icon": "receipt", "role": "Sales",
		"items": [
			dt("Customer", "Customers"), dt("Quotation", "Quotation"), dt("Sales Order", "Sales Order"), dt("Delivery Note", "Delivery Note"),
			dt("Sales Invoice", "Sales Invoice"), rp("Sales Register", "Sales Register"), rp("Accounts Receivable", "Customer Receivables"), rp("Sales Analytics", "Sales Analytics"),
		],
		"read": ["Item", "Warehouse", "Item Price"],
		"kpis": [
			sum_kpi("Sales Invoices", "Sales Invoice", "grand_total"), sum_kpi("Sales Orders", "Sales Order", "grand_total", date="transaction_date"),
			count_kpi("Quotations", "Quotation", date="transaction_date", where={"docstatus": 1}), count_kpi("Customers", "Customer", where={"disabled": 0}),
			sum_kpi("Customer Receivables", "Sales Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			count_kpi("Delivery Notes", "Delivery Note", date="posting_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "access", "label": "Access Management", "icon": "shield", "role": "Access",
		"items": [dt("User", "Users"), dt("Role Profile", "Role Profiles"), dt("User Permission", "User Permissions"), dt("Advanced Workspace Module", "Menu Settings")],
		"read_only_items": True,
		"kpis": [count_kpi("Active Users", "User", where={"enabled": 1, "user_type": "System User"}), count_kpi("Role Profiles", "Role Profile")],
	},
	{
		"key": "stock", "label": "Stock", "icon": "box", "role": "Stock",
		"items": [
			dt("Item", "Items"), dt("Stock Entry", "Stock Entry"), dt("Material Request", "Material Request"), dt("Purchase Receipt", "Purchase Receipt"), dt("Delivery Note", "Delivery Note"),
			dt("Stock Reconciliation", "Stock Reconciliation"), rp("Stock Balance", "Stock Balance"), rp("Stock Ledger", "Stock Ledger"), dt("Warehouse", "Warehouses", tree=True),
		],
		"read": ["Supplier", "Customer"],
		"kpis": [
			count_kpi("Items", "Item", where={"disabled": 0}), count_kpi("Warehouses", "Warehouse", where={"disabled": 0, "is_group": 0}),
			count_kpi("Stock Entries", "Stock Entry", date="posting_date", where={"docstatus": 1}), count_kpi("Material Requests", "Material Request", date="transaction_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "stock_quick", "label": "Stock Summary", "icon": "box", "role_of": "Stock", "link": rp("Stock Balance", "Stock Balance"),
	},
	{
		"key": "hr", "label": "Human Resources", "icon": "users", "role": "HR",
		"items": [
			dt("Employee", "Employees"), dt("Attendance", "Attendance"), dt("Leave Application", "Leave Application"), dt("Expense Claim", "Expense Claim"),
			dt("Holiday List", "Holiday Lists"), rp("Monthly Attendance Sheet", "Monthly Attendance"), rp("Employee Leave Balance", "Leave Balances"),
		],
		"kpis": [
			count_kpi("Active Employees", "Employee", where={"status": "Active"}), count_kpi("Leave Applications", "Leave Application", date="posting_date", where={"docstatus": 1}),
			sum_kpi("Expense Claims", "Expense Claim", "grand_total"), count_kpi("Attendance Records", "Attendance", date="attendance_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "payroll", "label": "Payroll", "icon": "coins", "role": "Payroll",
		"items": [
			dt("Salary Structure", "Salary Structure"), dt("Salary Structure Assignment", "Salary Assignment"), dt("Payroll Entry", "Payroll Entry"), dt("Salary Slip", "Salary Slip"),
			dt("Additional Salary", "Additional Salary"), rp("Salary Register", "Salary Register"),
		],
		"read": ["Employee"],
		"kpis": [sum_kpi("Net Pay", "Salary Slip", "net_pay"), count_kpi("Salary Slips", "Salary Slip", date="posting_date", where={"docstatus": 1})],
	},
	{
		"key": "crm", "label": "Leads and Opportunities", "icon": "target", "role": "CRM",
		"items": [dt("Lead", "Leads"), dt("Opportunity", "Opportunities"), dt("Customer", "Customers"), rp("Lead Details", "Lead Details")],
		"kpis": [count_kpi("Leads", "Lead", date="creation"), count_kpi("Opportunities", "Opportunity", date="creation")],
	},
	{
		"key": "projects", "label": "Project Management", "icon": "brief", "role": "Projects",
		"items": [dt("Project", "Projects"), dt("Task", "Tasks"), dt("Timesheet", "Timesheets"), rp("Project Summary", "Project Summary")],
		"kpis": [count_kpi("Open Projects", "Project", where={"status": "Open"}), count_kpi("Open Tasks", "Task", where={"status": "Open"})],
	},
	{
		"key": "manufacturing", "label": "Manufacturing", "icon": "factory", "role": "Manufacturing",
		"items": [dt("BOM", "Bill of Materials"), dt("Work Order", "Work Order"), dt("Job Card", "Job Card"), dt("Production Plan", "Production Plan"), rp("Production Analytics", "Production Analytics")],
		"read": ["Item", "Warehouse"],
		"kpis": [count_kpi("Work Orders", "Work Order", date="creation", where={"docstatus": 1}), count_kpi("Bills of Materials", "BOM", where={"docstatus": 1, "is_active": 1})],
	},
	{
		"key": "assets", "label": "Fixed Assets", "icon": "building", "role": "Assets",
		"items": [dt("Asset", "Assets"), dt("Asset Category", "Asset Categories"), dt("Asset Movement", "Asset Movements"), rp("Fixed Asset Register", "Fixed Asset Register")],
		"read": ["Item", "Location"],
		"kpis": [count_kpi("Assets", "Asset", where={"docstatus": 1})],
	},
	{
		"key": "quality", "label": "Quality", "icon": "check", "role": "Quality",
		"items": [dt("Quality Inspection", "Quality Inspection"), dt("Non Conformance", "Non Conformance")],
		"read": ["Item"],
		"kpis": [count_kpi("Quality Inspections", "Quality Inspection", date="report_date", where={"docstatus": 1})],
	},
	{
		"key": "support", "label": "Support", "icon": "headset", "role": "Support",
		"items": [dt("Issue", "Issues"), dt("Warranty Claim", "Warranty Claims")],
		"read": ["Customer"],
		"kpis": [count_kpi("Open Issues", "Issue", where={"status": "Open"}), count_kpi("All Issues", "Issue", date="creation")],
	},
]

# Every role reads these, or a form with a link to them will not open.
COMMON_READ = [
	"Company", "Currency", "UOM", "Item Group", "Brand", "Territory", "Customer Group", "Supplier Group",
	"Price List", "Mode of Payment", "Cost Center", "Department", "Designation", "Payment Terms Template",
	"Sales Taxes and Charges Template", "Purchase Taxes and Charges Template", "Item Tax Template",
]

# Users on ERPNext's own roles keep their modules without being given the new ones.
STANDARD_ROLES = {
	"finance": ["Accounts Manager"],
	"accounts": ["Accounts User", "Accounts Manager"],
	"buying": ["Purchase User", "Purchase Manager"],
	"selling": ["Sales User", "Sales Manager"],
	"access": [],
	"stock": ["Stock User", "Stock Manager"],
	"stock_quick": ["Stock User", "Stock Manager"],
	"pos": [],
	"hr": ["HR User", "HR Manager"],
	"payroll": ["HR Manager"],
	"crm": ["Sales User", "Sales Manager"],
	"projects": ["Projects User", "Projects Manager"],
	"manufacturing": ["Manufacturing User", "Manufacturing Manager"],
	"assets": ["Accounts Manager"],
	"quality": ["Quality Manager"],
	"support": ["Support Team"],
}
