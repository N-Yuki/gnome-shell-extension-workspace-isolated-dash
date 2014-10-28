const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Shell = imports.gi.Shell;

const AppSystem = Shell.AppSystem.get_default();

const WorkspaceIsolator = new Lang.Class({
	Name: 'WorkspaceIsolator',

	_init: function() {
		AppSystem._workspace_isolated_dash_nyuki_get_running = AppSystem.get_running;
		AppSystem.get_running = function() {
			let running = AppSystem._workspace_isolated_dash_nyuki_get_running();
			return running.filter(WorkspaceIsolator.isCurrentApp);
		};
		Shell.App.prototype._workspace_isolated_dash_nyuki_activate = Shell.App.prototype.activate;
		Shell.App.prototype.activate = function() {
			if (WorkspaceIsolator.isCurrentApp(this)) {
				return this._workspace_isolated_dash_nyuki_activate();
			}
			return this.open_new_window(-1);
		};
		this._onRestackedId = global.screen.connect('restacked', function() {
			AppSystem.emit('installed-changed');
			Mainloop.timeout_add(150, function() {
				AppSystem.emit('installed-changed');
			});
		});
		AppSystem.emit('installed-changed');
	},

	destroy: function() {
		if (AppSystem._workspace_isolated_dash_nyuki_get_running) {
			AppSystem.get_running = AppSystem._workspace_isolated_dash_nyuki_get_running;
			delete AppSystem._workspace_isolated_dash_nyuki_get_running;
		}
		if (Shell.App.prototype._workspace_isolated_dash_nyuki_activate) {
			Shell.App.prototype.activate = Shell.App.prototype._workspace_isolated_dash_nyuki_activate;
			delete Shell.App.prototype._workspace_isolated_dash_nyuki_activate;
		}
		if (this._onRestackedId) {
			global.screen.disconnect(this._onRestackedId);
			this._onRestackedId = 0;
		}
		AppSystem.emit('installed-changed');
	}
});
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
