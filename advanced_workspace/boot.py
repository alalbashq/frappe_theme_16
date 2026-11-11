"""What Desk needs to know before it draws its first page."""

from advanced_workspace.access import workspace_on


def boot_session(bootinfo):
	bootinfo.advanced_workspace = 1 if workspace_on() else 0
