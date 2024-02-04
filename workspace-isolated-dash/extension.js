const AppIcon = imports.ui.appDisplay.AppIcon;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;

let _appSystem;

const WorkspaceIsolator = class WorkspaceIsolator {
	constructor() {
		// Extend AppSystem to only return applications running on the active workspace
		_appSystem._workspace_isolated_dash_nyuki_get_running = _appSystem.get_running;
		_appSystem.get_running = function() {
			let running = _appSystem._workspace_isolated_dash_nyuki_get_running();
			if (Main.overview.visible) {
				return running.filter(WorkspaceIsolator.isActiveApp);
			} else {
				return running;
			}
		};
		// Extend App's activate to open a new window if no windows exist on the active workspace
		Shell.App.prototype._workspace_isolated_dash_nyuki_activate = Shell.App.prototype.activate;
		Shell.App.prototype.activate = function() {
			if (WorkspaceIsolator.isActiveApp(this)) {
				return this._workspace_isolated_dash_nyuki_activate();
			}
			return this.open_new_window(-1);
		};
		// Extend AppIcon's state change to hide 'running' indicator for applications not on the active workspace
		AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle = AppIcon.prototype._updateRunningStyle;
		AppIcon.prototype._updateRunningStyle = function() {
			if (WorkspaceIsolator.isActiveApp(this.app)) {
				this._workspace_isolated_dash_nyuki__updateRunningStyle();
			} else {
				this._dot.hide();
			}
		};
		// Refresh when the workspace is switched
		this._onSwitchWorkspaceId = global.window_manager.connect('switch-workspace', WorkspaceIsolator.refresh);
		// Refresh whenever there is a restack, including:
		// - window moved to another workspace
		// - window created
		// - window closed
		this._onRestackedId = global.display.connect('restacked', WorkspaceIsolator.refresh);
	}

	destroy() {
		// Revert the AppSystem function
		if (_appSystem._workspace_isolated_dash_nyuki_get_running) {
			_appSystem.get_running = _appSystem._workspace_isolated_dash_nyuki_get_running;
			delete _appSystem._workspace_isolated_dash_nyuki_get_running;
		}
		// Revert the App function
		if (Shell.App.prototype._workspace_isolated_dash_nyuki_activate) {
			Shell.App.prototype.activate = Shell.App.prototype._workspace_isolated_dash_nyuki_activate;
			delete Shell.App.prototype._workspace_isolated_dash_nyuki_activate;
		}
		// Revert the AppIcon function
		if (AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle) {
			AppIcon.prototype._updateRunningStyle = AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle;
			delete AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle;
		}
		// Disconnect the restacked signal
		if (this._onRestackedId) {
			global.display.disconnect(this._onRestackedId);
			this._onRestackedId = 0;
		}
		// Disconnect the switch-workspace signal
		if (this._onSwitchWorkspaceId) {
			global.window_manager.disconnect(this._onSwitchWorkspaceId);
			this._onSwitchWorkspaceId = 0;
		}
	}
};

// Check if an application is on the active workspace
WorkspaceIsolator.isActiveApp = function(app) {
	return app.is_on_workspace(global.workspaceManager.get_active_workspace());
};

// Refresh dash
WorkspaceIsolator.refresh = function() {
	const AppSystem = _appSystem || Shell.AppSystem.get_default();
	// Update icon state of all running applications
	let running;
	if (AppSystem._workspace_isolated_dash_nyuki_get_running) {
		running = AppSystem._workspace_isolated_dash_nyuki_get_running();
	} else {
		running = AppSystem.get_running();
	}
	running.forEach(function(app) {
		app.notify('state');
	});

	// Update applications shown in the dash
	let dash = Main.overview._dash || Main.overview.dash;
	dash._queueRedisplay();
};

let _wsIsolator;

function init() {
	/* do nothing */
}

function enable() {
	_appSystem = Shell.AppSystem.get_default();
	_wsIsolator = new WorkspaceIsolator();
	WorkspaceIsolator.refresh();
}

function disable() {
	_wsIsolator.destroy();
	_wsIsolator = null;
	WorkspaceIsolator.refresh();
	_appSystem = null;
}
