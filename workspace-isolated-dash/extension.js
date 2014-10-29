const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Shell = imports.gi.Shell;

const AppSystem = Shell.AppSystem.get_default();

const WorkspaceIsolator = new Lang.Class({
	Name: 'WorkspaceIsolator',

	_init: function() {
		// Extend AppSystem to only return applications running on the active workspace
		AppSystem._workspace_isolated_dash_nyuki_get_running = AppSystem.get_running;
		AppSystem.get_running = function() {
			let running = AppSystem._workspace_isolated_dash_nyuki_get_running();
			return running.filter(WorkspaceIsolator.isCurrentApp);
		};
		// Extend App's activate to open a new window if no windows exist on the active workspace
		Shell.App.prototype._workspace_isolated_dash_nyuki_activate = Shell.App.prototype.activate;
		Shell.App.prototype.activate = function() {
			if (WorkspaceIsolator.isCurrentApp(this)) {
				return this._workspace_isolated_dash_nyuki_activate();
			}
			return this.open_new_window(-1);
		};
		// Refresh the dash whenever there is a restack, including:
		// - workspace change
		// - move window to another workspace
		// - window created
		// - window closed
		this._onRestackedId = global.screen.connect('restacked', function() {
			AppSystem.emit('installed-changed');
			// Add workaround to race condition
			Mainloop.timeout_add(150, function() {
				AppSystem.emit('installed-changed');
			});
		});
		// Refresh
		AppSystem.emit('installed-changed');
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
		// Disconnect the restack signal
		if (this._onRestackedId) {
			global.screen.disconnect(this._onRestackedId);
			this._onRestackedId = 0;
		}
		// Refresh
		AppSystem.emit('installed-changed');
	}
});
// Check if an application is on the active workspace
WorkspaceIsolator.isCurrentApp = function(app) {
	let activeWorkspace = global.screen.get_active_workspace();
	return app.is_on_workspace(activeWorkspace);
}

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
