"""What each module shows and which roles it brings. Only the documents that matter."""


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
		"key": "pos", "label": "نقاط البيع", "icon": "pos", "role": "نقاط البيع",
		"items": [page("point-of-sale", "فتح نقطة البيع"), dt("POS Profile", "ملفات نقاط البيع"), dt("POS Opening Entry", "فتح الوردية"), dt("POS Closing Entry", "إغلاق الوردية"), dt("POS Invoice", "فاتورة نقطة البيع"), dt("Sales Invoice", "فاتورة مبيعات")],
		"read": ["Customer", "Item", "Warehouse"],
		"kpis": [count_kpi("فواتير نقاط البيع", "Sales Invoice", date="posting_date", where={"docstatus": 1, "is_pos": 1}), count_kpi("ملفات نقاط البيع", "POS Profile", where={"disabled": 0})],
	},
	{
		"key": "finance", "label": "الإدارة المالية", "icon": "wallet", "role": "المالية",
		"items": [
			rp("Profit and Loss Statement", "قائمة الدخل"), rp("Balance Sheet", "قائمة المركز المالي"),
			rp("Cash Flow", "التدفقات النقدية"), rp("Budget Variance Report", "انحراف الموازنة"),
			dt("Budget", "الموازنات"), dt("Cost Center", "مراكز التكلفة", tree=True), dt("Bank Account", "الحسابات البنكية"),
		],
		"read": ["GL Entry", "Account", "Fiscal Year"],
		"kpis": [gl_kpi("إجمالي الإيرادات", "Income"), gl_kpi("إجمالي النفقات", "Expense"), gl_kpi("صافي الربح", "Net"), gl_kpi("رصيد النقدية والبنوك", "Cash")],
	},
	{
		"key": "accounts", "label": "إدارة الحسابات", "icon": "banknote", "role": "الحسابات",
		"items": [
			dt("Account", "الشجرة المحاسبية", tree=True), dt("Sales Invoice", "فاتورة مبيعات"), dt("Purchase Invoice", "فاتورة مشتريات"),
			dt("Journal Entry", "القيود اليومية"), dt("Payment Entry", "سند نقدي"), rp("Accounts Receivable", "الحسابات المدينة"),
			rp("General Ledger", "دفتر الأستاذ العام"), rp("Trial Balance", "ميزان المراجعة"), rp("Accounts Payable", "الحسابات الدائنة"),
		],
		"read": ["GL Entry", "Customer", "Supplier", "Item", "Fiscal Year"],
		"kpis": [
			sum_kpi("إجمالي الفواتير الصادرة", "Sales Invoice", "grand_total"),
			sum_kpi("إجمالي الفواتير الواردة", "Purchase Invoice", "grand_total"),
			sum_kpi("إجمالي المدفوعات الواردة", "Payment Entry", "paid_amount", where={"docstatus": 1, "payment_type": "Receive"}),
			sum_kpi("إجمالي المدفوعات الصادرة", "Payment Entry", "paid_amount", where={"docstatus": 1, "payment_type": "Pay"}),
			sum_kpi("مستحقات العملاء", "Sales Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			sum_kpi("مستحقات الموردين", "Purchase Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			count_kpi("القيود اليومية", "Journal Entry", date="posting_date", where={"docstatus": 1}),
			count_kpi("سندات الصرف والقبض", "Payment Entry", date="posting_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "buying", "label": "إدارة المشتريات", "icon": "bag", "role": "المشتريات",
		"items": [
			dt("Supplier", "الموردون"), dt("Material Request", "طلب مواد"), dt("Purchase Order", "أمر شراء"), dt("Purchase Receipt", "إيصال استلام"),
			dt("Purchase Invoice", "فاتورة مشتريات"), rp("Purchase Register", "سجل المشتريات"), rp("Accounts Payable", "مستحقات الموردين"), rp("Purchase Analytics", "تحليل المشتريات"),
		],
		"read": ["Item", "Warehouse"],
		"kpis": [
			sum_kpi("فواتير المشتريات", "Purchase Invoice", "grand_total"), sum_kpi("أوامر الشراء", "Purchase Order", "grand_total", date="transaction_date"),
			count_kpi("طلبات المواد", "Material Request", date="transaction_date", where={"docstatus": 1}), count_kpi("الموردون", "Supplier", where={"disabled": 0}),
			sum_kpi("مستحقات الموردين", "Purchase Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			count_kpi("إيصالات الاستلام", "Purchase Receipt", date="posting_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "selling", "label": "إدارة المبيعات", "icon": "receipt", "role": "المبيعات",
		"items": [
			dt("Customer", "العملاء"), dt("Quotation", "عرض سعر"), dt("Sales Order", "أمر بيع"), dt("Delivery Note", "إذن تسليم"),
			dt("Sales Invoice", "فاتورة مبيعات"), rp("Sales Register", "سجل المبيعات"), rp("Accounts Receivable", "مستحقات العملاء"), rp("Sales Analytics", "تحليل المبيعات"),
		],
		"read": ["Item", "Warehouse", "Item Price"],
		"kpis": [
			sum_kpi("فواتير المبيعات", "Sales Invoice", "grand_total"), sum_kpi("أوامر البيع", "Sales Order", "grand_total", date="transaction_date"),
			count_kpi("عروض الأسعار", "Quotation", date="transaction_date", where={"docstatus": 1}), count_kpi("العملاء", "Customer", where={"disabled": 0}),
			sum_kpi("مستحقات العملاء", "Sales Invoice", "outstanding_amount", date=None, where={"docstatus": 1, "outstanding_amount": [">", 0]}),
			count_kpi("أذونات التسليم", "Delivery Note", date="posting_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "access", "label": "إدارة الوصول", "icon": "shield", "role": "الوصول",
		"items": [dt("User", "المستخدمون"), dt("Role Profile", "ملفات الأدوار"), dt("User Permission", "صلاحيات المستخدمين"), dt("Advanced Workspace Module", "إعدادات القائمة")],
		"read_only_items": True,
		"kpis": [count_kpi("المستخدمون النشطون", "User", where={"enabled": 1, "user_type": "System User"}), count_kpi("ملفات الأدوار", "Role Profile")],
	},
	{
		"key": "stock", "label": "الرصيد المخزني", "icon": "box", "role": "المخازن",
		"items": [
			dt("Item", "الأصناف"), dt("Stock Entry", "حركة مخزنية"), dt("Material Request", "طلب مواد"), dt("Purchase Receipt", "إيصال استلام"), dt("Delivery Note", "إذن تسليم"),
			dt("Stock Reconciliation", "تسوية المخزون"), rp("Stock Balance", "رصيد المخزون"), rp("Stock Ledger", "دفتر المخزون"), dt("Warehouse", "المستودعات", tree=True),
		],
		"read": ["Supplier", "Customer"],
		"kpis": [
			count_kpi("الأصناف", "Item", where={"disabled": 0}), count_kpi("المستودعات", "Warehouse", where={"disabled": 0, "is_group": 0}),
			count_kpi("الحركات المخزنية", "Stock Entry", date="posting_date", where={"docstatus": 1}), count_kpi("طلبات المواد", "Material Request", date="transaction_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "stock_quick", "label": "قائمة مختصرة للمخزون", "icon": "box", "role_of": "المخازن", "link": rp("Stock Balance", "رصيد المخزون"),
	},
	{
		"key": "hr", "label": "الموارد البشرية", "icon": "users", "role": "الموارد البشرية",
		"items": [
			dt("Employee", "الموظفون"), dt("Attendance", "الحضور"), dt("Leave Application", "طلب إجازة"), dt("Expense Claim", "مطالبة مصروف"),
			dt("Holiday List", "قوائم العطلات"), rp("Monthly Attendance Sheet", "كشف الحضور الشهري"), rp("Employee Leave Balance", "أرصدة الإجازات"),
		],
		"kpis": [
			count_kpi("الموظفون النشطون", "Employee", where={"status": "Active"}), count_kpi("طلبات الإجازة", "Leave Application", date="posting_date", where={"docstatus": 1}),
			sum_kpi("مطالبات المصروفات", "Expense Claim", "grand_total"), count_kpi("سجلات الحضور", "Attendance", date="attendance_date", where={"docstatus": 1}),
		],
	},
	{
		"key": "payroll", "label": "الرواتب", "icon": "coins", "role": "الرواتب",
		"items": [
			dt("Salary Structure", "هيكل الراتب"), dt("Salary Structure Assignment", "تعيين هيكل الراتب"), dt("Payroll Entry", "مسير الرواتب"), dt("Salary Slip", "قسيمة الراتب"),
			dt("Additional Salary", "راتب إضافي"), rp("Salary Register", "سجل الرواتب"),
		],
		"read": ["Employee"],
		"kpis": [sum_kpi("صافي الرواتب", "Salary Slip", "net_pay"), count_kpi("قسائم الرواتب", "Salary Slip", date="posting_date", where={"docstatus": 1})],
	},
	{
		"key": "crm", "label": "إدارة العملاء المحتملين", "icon": "target", "role": "علاقات العملاء",
		"items": [dt("Lead", "العملاء المحتملون"), dt("Opportunity", "الفرص"), dt("Customer", "العملاء"), rp("Lead Details", "تفاصيل العملاء المحتملين")],
		"kpis": [count_kpi("العملاء المحتملون", "Lead", date="creation"), count_kpi("الفرص", "Opportunity", date="creation")],
	},
	{
		"key": "projects", "label": "إدارة المشاريع", "icon": "brief", "role": "المشاريع",
		"items": [dt("Project", "المشاريع"), dt("Task", "المهام"), dt("Timesheet", "سجل ساعات العمل"), rp("Project Summary", "ملخص المشاريع")],
		"kpis": [count_kpi("المشاريع المفتوحة", "Project", where={"status": "Open"}), count_kpi("المهام المفتوحة", "Task", where={"status": "Open"})],
	},
	{
		"key": "manufacturing", "label": "التصنيع", "icon": "factory", "role": "التصنيع",
		"items": [dt("BOM", "قائمة المواد"), dt("Work Order", "أمر عمل"), dt("Job Card", "بطاقة عمل"), dt("Production Plan", "خطة الإنتاج"), rp("Production Analytics", "تحليل الإنتاج")],
		"read": ["Item", "Warehouse"],
		"kpis": [count_kpi("أوامر العمل", "Work Order", date="creation", where={"docstatus": 1}), count_kpi("قوائم المواد", "BOM", where={"docstatus": 1, "is_active": 1})],
	},
	{
		"key": "assets", "label": "الأصول الثابتة", "icon": "building", "role": "الأصول",
		"items": [dt("Asset", "الأصول"), dt("Asset Category", "فئات الأصول"), dt("Asset Movement", "حركة الأصول"), rp("Fixed Asset Register", "سجل الأصول الثابتة")],
		"read": ["Item", "Location"],
		"kpis": [count_kpi("الأصول", "Asset", where={"docstatus": 1})],
	},
	{
		"key": "quality", "label": "الجودة", "icon": "check", "role": "الجودة",
		"items": [dt("Quality Inspection", "فحص الجودة"), dt("Non Conformance", "عدم المطابقة")],
		"read": ["Item"],
		"kpis": [count_kpi("فحوصات الجودة", "Quality Inspection", date="report_date", where={"docstatus": 1})],
	},
	{
		"key": "support", "label": "الدعم الفني", "icon": "headset", "role": "الدعم الفني",
		"items": [dt("Issue", "البلاغات"), dt("Warranty Claim", "مطالبات الضمان")],
		"read": ["Customer"],
		"kpis": [count_kpi("البلاغات المفتوحة", "Issue", where={"status": "Open"}), count_kpi("كل البلاغات", "Issue", date="creation")],
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

ENGLISH = {
	"نقاط البيع": "Point of Sale", "ملفات نقاط البيع": "POS Profiles", "فتح الوردية": "Shift Opening", "إغلاق الوردية": "Shift Closing",
	"فاتورة مبيعات": "Sales Invoice", "فواتير نقاط البيع": "POS Invoices", "الإدارة المالية": "Financial Management", "قائمة الدخل": "Income Statement",
	"قائمة المركز المالي": "Balance Sheet", "التدفقات النقدية": "Cash Flow", "انحراف الموازنة": "Budget Variance", "الموازنات": "Budgets",
	"مراكز التكلفة": "Cost Centers", "الحسابات البنكية": "Bank Accounts", "إجمالي الإيرادات": "Total Income", "إجمالي النفقات": "Total Expenses",
	"صافي الربح": "Net Profit", "رصيد النقدية والبنوك": "Cash and Bank Balance", "إدارة الحسابات": "Accounts", "الشجرة المحاسبية": "Chart of Accounts",
	"فاتورة مشتريات": "Purchase Invoice", "القيود اليومية": "Journal Entries", "سند نقدي": "Payment Entry", "الحسابات المدينة": "Accounts Receivable",
	"دفتر الأستاذ العام": "General Ledger", "ميزان المراجعة": "Trial Balance", "الحسابات الدائنة": "Accounts Payable",
	"إجمالي الفواتير الصادرة": "Total Sales Invoices", "إجمالي الفواتير الواردة": "Total Purchase Invoices", "إجمالي المدفوعات الواردة": "Total Payments Received",
	"إجمالي المدفوعات الصادرة": "Total Payments Made", "مستحقات العملاء": "Customer Receivables", "مستحقات الموردين": "Supplier Payables",
	"سندات الصرف والقبض": "Payment Entries", "إدارة المشتريات": "Purchasing", "الموردون": "Suppliers", "طلب مواد": "Material Request", "أمر شراء": "Purchase Order",
	"إيصال استلام": "Purchase Receipt", "سجل المشتريات": "Purchase Register", "تحليل المشتريات": "Purchase Analytics", "فواتير المشتريات": "Purchase Invoices",
	"أوامر الشراء": "Purchase Orders", "طلبات المواد": "Material Requests", "إيصالات الاستلام": "Purchase Receipts", "إدارة المبيعات": "Sales", "العملاء": "Customers",
	"عرض سعر": "Quotation", "أمر بيع": "Sales Order", "إذن تسليم": "Delivery Note", "سجل المبيعات": "Sales Register", "تحليل المبيعات": "Sales Analytics",
	"فواتير المبيعات": "Sales Invoices", "أوامر البيع": "Sales Orders", "عروض الأسعار": "Quotations", "أذونات التسليم": "Delivery Notes", "إدارة الوصول": "Access Management",
	"المستخدمون": "Users", "ملفات الأدوار": "Role Profiles", "صلاحيات المستخدمين": "User Permissions", "إعدادات القائمة": "Menu Settings",
	"المستخدمون النشطون": "Active Users", "الرصيد المخزني": "Stock", "الأصناف": "Items", "حركة مخزنية": "Stock Entry", "تسوية المخزون": "Stock Reconciliation",
	"رصيد المخزون": "Stock Balance", "دفتر المخزون": "Stock Ledger", "المستودعات": "Warehouses", "الحركات المخزنية": "Stock Entries",
	"قائمة مختصرة للمخزون": "Stock Summary", "الموارد البشرية": "Human Resources", "الموظفون": "Employees", "الحضور": "Attendance", "طلب إجازة": "Leave Application",
	"مطالبة مصروف": "Expense Claim", "قوائم العطلات": "Holiday Lists", "كشف الحضور الشهري": "Monthly Attendance", "أرصدة الإجازات": "Leave Balances",
	"الموظفون النشطون": "Active Employees", "طلبات الإجازة": "Leave Applications", "مطالبات المصروفات": "Expense Claims", "سجلات الحضور": "Attendance Records",
	"الرواتب": "Payroll", "هيكل الراتب": "Salary Structure", "تعيين هيكل الراتب": "Salary Assignment", "مسير الرواتب": "Payroll Entry", "قسيمة الراتب": "Salary Slip",
	"راتب إضافي": "Additional Salary", "سجل الرواتب": "Salary Register", "صافي الرواتب": "Net Pay", "قسائم الرواتب": "Salary Slips",
	"إدارة العملاء المحتملين": "Leads and Opportunities", "العملاء المحتملون": "Leads", "الفرص": "Opportunities", "تفاصيل العملاء المحتملين": "Lead Details",
	"إدارة المشاريع": "Projects", "المشاريع": "Projects", "المهام": "Tasks", "سجل ساعات العمل": "Timesheets", "ملخص المشاريع": "Project Summary",
	"المشاريع المفتوحة": "Open Projects", "المهام المفتوحة": "Open Tasks", "التصنيع": "Manufacturing", "قائمة المواد": "Bill of Materials", "أمر عمل": "Work Order",
	"بطاقة عمل": "Job Card", "خطة الإنتاج": "Production Plan", "تحليل الإنتاج": "Production Analytics", "أوامر العمل": "Work Orders", "قوائم المواد": "Bills of Materials",
	"الأصول الثابتة": "Fixed Assets", "الأصول": "Assets", "فئات الأصول": "Asset Categories", "حركة الأصول": "Asset Movements", "سجل الأصول الثابتة": "Fixed Asset Register",
	"الجودة": "Quality", "فحص الجودة": "Quality Inspection", "عدم المطابقة": "Non Conformance", "فحوصات الجودة": "Quality Inspections", "الدعم الفني": "Support",
	"البلاغات": "Issues", "مطالبات الضمان": "Warranty Claims", "البلاغات المفتوحة": "Open Issues", "كل البلاغات": "All Issues", "فتح نقطة البيع": "Open Point of Sale", "فاتورة نقطة البيع": "POS Invoice", "وردية الفتح": "Opening Shift", "وردية الإغلاق": "Closing Shift",
}

# Frappe's translation table, for the settings forms.
FORM_LABELS = {
	"Name in Arabic": "الاسم بالعربية", "Name in English": "الاسم بالإنجليزية", "Type": "النوع", "Document, Report or Link": "المستند أو التقرير أو الرابط",
	"Enabled": "مفعل", "Calculation": "الحساب", "Document": "المستند", "Sum Field": "حقل المجموع", "Date Field": "حقل التاريخ", "Filters (JSON)": "الفلاتر (JSON)",
	"Ledger Line": "بند الأستاذ العام", "Key": "المعرّف", "Sequence": "الترتيب", "Icon": "الأيقونة", "Read Only for Module Roles": "قراءة فقط لأدوار المديول",
	"Opens First Item Directly": "يفتح العنصر الأول مباشرة", "Roles": "الأدوار", "User Role": "دور المستخدم", "Manager Role": "دور المدير",
	"Other Roles That See This Module": "أدوار أخرى ترى المديول", "Menu Items": "عناصر القائمة", "Statistics": "الإحصائيات",
	"Linked Documents": "مستندات مرتبطة", "Documents Needing Read Access (one per line)": "مستندات تحتاج صلاحية قراءة (سطر لكل مستند)",
	"Documents Every Role Reads (one per line)": "مستندات يقرؤها كل دور (سطر لكل مستند)",
	"Advanced Workspace Module": "إعدادات القائمة", "Advanced Workspace Settings": "إعدادات مساحة العمل",
}

# Role names are Arabic everywhere; in English they read through Frappe's translation table.
ROLE_ENGLISH = {
	"المالية": "Finance", "الحسابات": "Accounts", "المشتريات": "Purchasing", "المبيعات": "Sales", "الوصول": "Access", "المخازن": "Stock",
	"نقاط البيع": "Point of Sale", "الموارد البشرية": "HR", "الرواتب": "Payroll", "علاقات العملاء": "CRM", "المشاريع": "Projects",
	"التصنيع": "Manufacturing", "الأصول": "Assets", "الجودة": "Quality", "الدعم الفني": "Support",
}
