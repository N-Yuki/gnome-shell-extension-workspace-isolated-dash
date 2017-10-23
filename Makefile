PROJECT = workspace-isolated-dash

SCHEMAS_PATH = $(PROJECT)/schemas
SCHEMA = org.gnome.shell.extensions.n-yuki.$(PROJECT).gschema.xml
SCHEMA_SRC = $(SCHEMAS_PATH)/$(SCHEMA)
SCHEMA_BIN = $(SCHEMAS_PATH)/gschemas.compiled

UUID = `grep -oP '(?<="uuid": ")[^"]*' $(PROJECT)/metadata.json`

SCHEMAC = glib-compile-schemas
ZIP = zip -ro
CP = rsync -aP

all: compile

$(PROJECT).zip: compile
	cd $(PROJECT) && $(ZIP) ../$@ .

install: compile
	mkdir -p "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"
	$(CP) $(PROJECT)/ "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

compile: clean-backups

$(SCHEMA_BIN): $(SCHEMA_SRC)
	$(SCHEMAC) $(SCHEMAS_PATH)

clean-backups:
	find . -type f -name '*~' -delete

clean: clean-backups
	rm -f $(PROJECT).zip $(SCHEMA_BIN)

uninstall:
	rm -rf "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

.PHONY: all install compile clean-backups clean uninstall
