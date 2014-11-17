const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const PREFS_UI = 'prefs.ui';

function _getSettings() {
	let prefsSchema = Me.metadata['settings-schema'];
	let localSchemas = Me.dir.get_child('schemas').get_path();
	let systemSchemas = Gio.SettingsSchemaSource.get_default();
	let schemaSource = Gio.SettingsSchemaSource.new_from_directory(localSchemas, systemSchemas, false);
	let schemaObj = schemaSource.lookup(prefsSchema, true);
	if (!schemaObj) {
		throw new Error('Schema ' + prefsSchema + ' could not be found for extension ' + Me.metadata.uuid + '. Please check your installation.');
	}
	return new Gio.Settings({ settings_schema: schemaObj });
}

let settings = _getSettings();

const WorkspaceIsolatorPrefsWidget = new Lang.Class({
	Name: 'WorkspaceIsolatorPrefsWidget',

	_init: function() {
		this._builder = new Gtk.Builder();
		let fullIsolate = settings.get_boolean('complete-app-isolation');
		settings.set_boolean('complete-app-isolation', fullIsolate);
	},

	_updateWidget: function() {
		let fullIsolate = settings.get_boolean('complete-app-isolation');
		this._builder.get_object('fullisolateswitch').set_active(fullIsolate);
	},

	buildPrefsWidget: function() {
		this._builder.add_from_file(Me.dir.get_path() + '/' + PREFS_UI);
		this._updateWidget();
		let settingsChangedId = settings.connect('changed', Lang.bind(this, this._updateWidget));
		this._builder.get_object('fullisolateswitch').connect('notify::active', Lang.bind(this, function(widget) {
			settings.set_boolean('complete-app-isolation', widget.get_active());
		}));
		return this._builder.get_object('mainbox');
	}
});

let _prefsWidget;

function init() {
	_prefsWidget = new WorkspaceIsolatorPrefsWidget();
}

function buildPrefsWidget() {
	return _prefsWidget.buildPrefsWidget();
}
