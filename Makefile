# Licensed under the MIT License
# https://github.com/craigahobbs/schema-markdown/blob/master/LICENSE

# gh-pages paths
GHPAGES_SRC := build/doc/

# Download JavaScript Build
define WGET
ifeq '$$(wildcard $(notdir $(1)))' ''
$$(info Downloading $(notdir $(1)))
_WGET := $$(shell if which wget; then wget -q $(1); else curl -Os $(1); fi)
endif
endef
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/Makefile.base))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/jsdoc.json))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/package.json))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/.eslintrc.js))

# Include JavaScript Build
include Makefile.base

# Add additional jsdoc paths
JSDOC_ARGS := $(JSDOC_ARGS) README.md src/schema-markdown

clean:
	rm -rf Makefile.base jsdoc.json package.json .eslintrc.js

doc:
	cp -R src build/doc/doc
	mv build/doc/doc/doc.html build/doc/doc/index.html
