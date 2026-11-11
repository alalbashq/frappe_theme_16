app_name = "advanced_workspace"
app_title = "Advanced Workspace"
app_publisher = "Albashq Alshwmy"
app_description = "Arabic workspace with a user and a manager role for every module"
app_email = "al.alshwmy@gmail.com"
app_license = "mit"

# The workspace frame, its start on /desk and its font: on every Desk page
app_include_js = ["advanced_workspace.bundle.js"]

before_install = "advanced_workspace.install.before_install"
after_install = "advanced_workspace.install.after_install"
after_migrate = "advanced_workspace.install.after_migrate"

doc_events = {
	"Advanced Workspace Module": {
		# a document added to the menu gets its permissions for the module's two roles
		"on_update": "advanced_workspace.access.module_saved",
	},
}
