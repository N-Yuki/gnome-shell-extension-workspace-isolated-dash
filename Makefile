PROJECT = workspace-isolated-dash

UUID = `grep -oP '(?<="uuid": ")[^"]*' $(PROJECT)/metadata.json`

ZIP = zip -FSro
CP = rsync -aP

all: package

$(PROJECT).zip: clean-backups
	cd $(PROJECT) && $(ZIP) ../$@ .

package: $(PROJECT).zip

install: clean-backups
	mkdir -p "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"
	$(CP) $(PROJECT)/ "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

uninstall:
	rm -rf "$(HOME)/.local/share/gnome-shell/extensions/$(UUID)/"

clean: clean-backups clean-package

clean-backups:
	find . -type f -name '*~' -delete

clean-package:
	rm -f $(PROJECT).zip

.PHONY: all package install uninstall clean clean-backups clean-package
