const Workspace = imports.ui.workspace;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Lang = imports.lang;

const AppSystem = Shell.AppSystem.get_default();

const WorkspaceIsolator = new Lang.Class({
	Name: 'WorkspaceIsolator',

	_init: function() {
		AppSystem.get_running_main = AppSystem.get_running;
		AppSystem.get_running = Lang.bind(this, function() {
			let running = AppSystem.get_running_main();
			return running.filter(this._isCurrentApp, this);
		});
		Shell.App.prototype.activate_main = Shell.App.prototype.activate;
		Shell.App.prototype.activate = function() {
			let activeWorkspace = global.screen.get_active_workspace();
			if (this.is_on_workspace(activeWorkspace)) {
				return this.activate_main();
			}
			return this.open_new_window(-1);
		};
		this._onRestackedId = global.screen.connect('restacked', function() {
			AppSystem.emit('installed-changed');
		});
	},

	destroy: function() {
		AppSystem.get_running = AppSystem.get_running_main;
		delete AppSystem.get_running_main;
		Shell.App.prototype.activate = Shell.App.prototype.activate_main;
		delete Shell.App.prototype.activate_main;
		AppSystem.emit('installed-changed');
		global.screen.disconnect(this._onRestackedId);
	},

	_isCurrentApp: function(app) {
		let activeWorkspace = global.screen.get_active_workspace();
		return app.is_on_workspace(activeWorkspace);
	}
});

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
