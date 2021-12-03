# Licensed under the MIT License
# https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE


# Download javascript-build
define WGET
ifeq '$$(wildcard $(notdir $(1)))' ''
$$(info Downloading $(notdir $(1)))
_WGET := $$(shell $(call WGET_CMD, $(1)))
endif
endef
WGET_CMD = if which wget; then wget -q -c $(1); else curl -f -Os $(1); fi
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/Makefile.base))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/jsdoc.json))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/.eslintrc.cjs))


# Override defaults
AVA_ARGS ?= test/
C8_ARGS ?= --100 --allowExternal
ESLINT_ARGS ?= lib/ test/
JSDOC_ARGS ?= -c jsdoc.json -r README.md lib/


# Include javascript-build
include Makefile.base


clean:
	rm -rf Makefile.base jsdoc.json .eslintrc.cjs
