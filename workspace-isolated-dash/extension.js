const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const AppIcon = imports.ui.appDisplay.AppIcon;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;

const AppSystem = Shell.AppSystem.get_default();

const WorkspaceIsolator = new Lang.Class({
	Name: 'WorkspaceIsolator',

	_init: function() {
		// Extend AppSystem to only return applications running on the active workspace
		AppSystem._workspace_isolated_dash_nyuki_get_running = AppSystem.get_running;
		AppSystem.get_running = function() {
			let running = AppSystem._workspace_isolated_dash_nyuki_get_running();
			if (Main.overview.visible || Prefs.settings.get_boolean('complete-app-isolation')) {
				return running.filter(WorkspaceIsolator.isCurrentApp);
			} else {
				return running;
			}
		};
		// Extend App's activate to open a new window if no windows exist on the active workspace
		Shell.App.prototype._workspace_isolated_dash_nyuki_activate = Shell.App.prototype.activate;
		Shell.App.prototype.activate = function() {
			if (WorkspaceIsolator.isCurrentApp(this)) {
				return this._workspace_isolated_dash_nyuki_activate();
			}
			return this.open_new_window(-1);
		};
		// Extend AppIcon's state change to remove 'running' style for applications not on the active workspace
		if (AppIcon.prototype._onStateChanged) {
			AppIcon.prototype._workspace_isolated_dash_nyuki__onStateChanged = AppIcon.prototype._onStateChanged;
			AppIcon.prototype._onStateChanged = function() {
				if (WorkspaceIsolator.isCurrentApp(this.app)) {
					this._workspace_isolated_dash_nyuki__onStateChanged();
				} else {
					if (this._dot) {
						// GNOME Shell 3.16+
						this._dot.hide();
					} else {
						this.actor.remove_style_class_name('running');
					}
				}
			};
		} else if (AppIcon.prototype._updateRunningStyle) {
			AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle = AppIcon.prototype._updateRunningStyle;
			AppIcon.prototype._updateRunningStyle = function() {
				if (WorkspaceIsolator.isCurrentApp(this.app)) {
					this._workspace_isolated_dash_nyuki__updateRunningStyle();
				} else {
					if (this._dot) {
						// GNOME Shell 3.16+
						this._dot.hide();
					} else {
						this.actor.remove_style_class_name('running');
					}
				}
			};
		}
		// Refresh whenever the overview is showing
		this._onShowingId = Main.overview.connect('showing', function() {
			WorkspaceIsolator.refresh();
		});
		// Refresh whenever there is a restack, including:
		// - workspace change
		// - move window to another workspace
		// - window created
		// - window closed
		this._onRestackedId = global.screen.connect('restacked', function() {
			WorkspaceIsolator.refresh();
			// Add workaround for race condition
			Mainloop.timeout_add(150, WorkspaceIsolator.refresh);
		});
		// Set up
		if (AppIcon.prototype._onStateChanged) WorkspaceIsolator.clearIcons();
		WorkspaceIsolator.refresh();
	},

	destroy: function() {
		// Revert the AppSystem function
		if (AppSystem._workspace_isolated_dash_nyuki_get_running) {
			AppSystem.get_running = AppSystem._workspace_isolated_dash_nyuki_get_running;
			delete AppSystem._workspace_isolated_dash_nyuki_get_running;
		}
		// Revert the App function
		if (Shell.App.prototype._workspace_isolated_dash_nyuki_activate) {
			Shell.App.prototype.activate = Shell.App.prototype._workspace_isolated_dash_nyuki_activate;
			delete Shell.App.prototype._workspace_isolated_dash_nyuki_activate;
		}
		// Revert the AppIcon function
		if (AppIcon.prototype._workspace_isolated_dash_nyuki__onStateChanged) {
			AppIcon.prototype._onStateChanged = AppIcon.prototype._workspace_isolated_dash_nyuki__onStateChanged;
			delete AppIcon.prototype._workspace_isolated_dash_nyuki__onStateChanged;
		} else if (AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle) {
			AppIcon.prototype._updateRunningStyle = AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle;
			delete AppIcon.prototype._workspace_isolated_dash_nyuki__updateRunningStyle;
		}
		// Disconnect the showing signal
		if (this._onShowingId) {
			Main.overview.disconnect(this._onShowingId);
			this._onShowingId = 0;
		}
		// Disconnect the restack signal
		if (this._onRestackedId) {
			global.screen.disconnect(this._onRestackedId);
			this._onRestackedId = 0;
		}
		// Clean up
		if (AppIcon.prototype._onStateChanged) WorkspaceIsolator.clearIcons();
		WorkspaceIsolator.refresh();
	}
});
// Check if an application is on the active workspace
WorkspaceIsolator.isCurrentApp = function(app) {
	let activeWorkspace = global.screen.get_active_workspace();
	return app.is_on_workspace(activeWorkspace);
};
// Refresh dash
WorkspaceIsolator.refresh = function() {
	// Update applications shown in the dash
	AppSystem.emit('installed-changed');
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
};
// Clear icon cache
WorkspaceIsolator.clearIcons = function() {
	Main.overview._dash._box.destroy_all_children();
	Main.overview.viewSelector.appDisplay._views.forEach(function(wrapper) {
		wrapper.view._redisplay();
	});
};

function init(meta) {
	/* do nothing */
}

let _wsIsolator;

function enable() {
	_wsIsolator = new WorkspaceIsolator();
}

function disable() {
	_wsIsolator.destroy();
}
