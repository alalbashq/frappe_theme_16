app_name = "advanced_workspace"
app_title = "Advanced Workspace"
app_publisher = "Albashq Alshwmy"
app_description = "Arabic workspace with a user and a manager role for every module"
app_email = "al.alshwmy@gmail.com"
app_license = "mit"

# The workspace frame, its start on /desk and its font: on every Desk page
app_include_js = ["advanced_workspace.bundle.js"]
# For every Desk user, with or without the workspace (a child table's Link dropdown in RTL)
app_include_css = ["advanced_workspace.bundle.css"]

# The MYSYS icon in the workspace's colours (public/images/brand): the browser tab, Frappe's boot splash
# and the app's logo. A favicon or splash image set in Website Settings still comes first.
app_logo_url = "/assets/advanced_workspace/images/brand/mysys-icon.svg"
website_context = {
	"favicon": "/assets/advanced_workspace/images/brand/favicon.ico",
	"splash_image": "/assets/advanced_workspace/images/brand/mysys-splash.svg",
}

# whether this user gets the workspace design, decided on the server
boot_session = "advanced_workspace.boot.boot_session"

before_install = "advanced_workspace.install.before_install"
after_install = "advanced_workspace.install.after_install"
before_migrate = "advanced_workspace.install.before_migrate"
after_migrate = "advanced_workspace.install.after_migrate"

doc_events = {
	"Advanced Workspace Module": {
		# a document added to the menu gets its permissions for the module's two roles
		"on_update": "advanced_workspace.access.module_saved",
	},
}
