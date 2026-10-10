# Licensed under the MIT License
# https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE


# Download javascript-build
JAVASCRIPT_BUILD_DIR ?= ../javascript-build
define WGET
ifeq '$$(wildcard $(notdir $(1)))' ''
$$(info Downloading $(notdir $(1)))
$$(shell [ -f $(JAVASCRIPT_BUILD_DIR)/$(notdir $(1)) ] && cp $(JAVASCRIPT_BUILD_DIR)/$(notdir $(1)) . || $(call WGET_CMD, $(1)))
endif
endef
WGET_CMD = if command -v wget >/dev/null 2>&1; then wget -q -c $(1); else curl -f -Os $(1); fi
$(eval $(call WGET, https://craigahobbs.github.io/javascript-build/Makefile.base))
$(eval $(call WGET, https://craigahobbs.github.io/javascript-build/jsdoc.json))
$(eval $(call WGET, https://craigahobbs.github.io/javascript-build/eslint.config.js))


# Include javascript-build
include Makefile.base


help:
	@echo "            [test-emacs]"


clean:
	rm -rf Makefile.base jsdoc.json eslint.config.js


doc:
	cp -R static/* build/doc/


# The Emacs Schema Markdown mode (static/language/schema-markdown-mode.el) unit tests - skipped if Emacs isn't installed
EMACS ?= emacs

.PHONY: test-emacs
commit: test-emacs
test-emacs:
	if command -v $(EMACS) > /dev/null 2>&1; then \
		$(EMACS) -Q --batch -L static/language -l static/language/test/schema-markdown-mode-test.el \
			--eval '(ert-run-tests-batch-and-exit $(if $(TEST),"$(TEST)",t))'; \
	else \
		echo "$(EMACS) not found - skipping the Emacs mode tests"; \
	fi
