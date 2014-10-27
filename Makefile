PROJECT = workspace-dash

UUID = `grep -oP '(?<="uuid": ")[^"]*' $(PROJECT)/metadata.json`

SCHEMAC = glib-compile-schemas
ZIP = zip -roj
CP = rsync -aP

$(PROJECT).zip: compile
	$(ZIP) $@ $(PROJECT)

install: compile
	$(CP) $(PROJECT)/ "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

compile: clean-backups

clean-backups:
	find . -type f -name '*~' -delete

clean: clean-backups
	rm -f $(PROJECT).zip
