# Licensed under the MIT License
# https://github.com/craigahobbs/schema-markdown/blob/main/LICENSE

# Download JavaScript Build
define WGET
ifeq '$$(wildcard $(notdir $(1)))' ''
$$(info Downloading $(notdir $(1)))
_WGET := $$(shell if which wget; then wget -q $(1); else curl -Os $(1); fi)
endif
endef
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/Makefile.base))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/jsdoc.json))
$(eval $(call WGET, https://raw.githubusercontent.com/craigahobbs/javascript-build/main/.eslintrc.cjs))

# Include JavaScript Build
include Makefile.base

clean:
	rm -rf Makefile.base jsdoc.json .eslintrc.cjs

doc:
	mkdir -p build/doc/doc/schema-markdown
	cp src/schema-markdown/doc/* build/doc/doc/
	cp src/schema-markdown/*.js build/doc/doc/schema-markdown
	sed -i.bak "s/'..\//'.\/schema-markdown\//g" build/doc/doc/doc.js
	rm build/doc/doc/doc.js.bak
