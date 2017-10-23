PROJECT = workspace-isolated-dash

SCHEMAS_PATH = $(PROJECT)/schemas
SCHEMA = org.gnome.shell.extensions.n-yuki.$(PROJECT).gschema.xml
SCHEMA_SRC = $(SCHEMAS_PATH)/$(SCHEMA)
SCHEMA_BIN = $(SCHEMAS_PATH)/gschemas.compiled

UUID = `grep -oP '(?<="uuid": ")[^"]*' $(PROJECT)/metadata.json`

SCHEMAC = glib-compile-schemas
ZIP = zip -FSro
CP = rsync -aP

all: compile

$(SCHEMA_BIN): $(SCHEMA_SRC)
	$(SCHEMAC) $(SCHEMAS_PATH)

$(PROJECT).zip: clean-backups
	cd $(PROJECT) && $(ZIP) ../$@ .

compile: package

schema: $(SCHEMA_BIN)

package: $(PROJECT).zip

install: clean-backups
	mkdir -p "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"
	$(CP) $(PROJECT)/ "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

uninstall:
	rm -rf "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

clean: clean-backups clean-packages

clean-backups:
	find . -type f -name '*~' -delete

clean-packages:
	rm -f $(PROJECT).zip $(SCHEMA_BIN)

.PHONY: all compile schema package install uninstall clean clean-backups clean-packages
