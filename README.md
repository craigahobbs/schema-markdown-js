# schema-markdown

[![npm](https://img.shields.io/npm/v/schema-markdown)](https://www.npmjs.com/package/schema-markdown)
[![GitHub](https://img.shields.io/github/license/craigahobbs/schema-markdown-js)](https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE)

schema-markdown is a schema definition and validation library.


## Links

- [The Schema Markdown Language](https://craigahobbs.github.io/schema-markdown-js/language/)
- [API Documentation](https://craigahobbs.github.io/schema-markdown-js/)
- [Source code](https://github.com/craigahobbs/schema-markdown-js)


## Define a Schema

Schemas are defined using the
[Schema Markdown language](https://craigahobbs.github.io/schema-markdown-js/language/),
which is parsed by the
[parseSchemaMarkdown](https://craigahobbs.github.io/schema-markdown-js/module-lib_parser.html#.parseSchemaMarkdown)
function. For example:

~~~ javascript
import {parseSchemaMarkdown} from 'schema-markdown/lib/parser.js';

export const modelTypes = parseSchemaMarkdown(`\
# An aggregate numerical operation
struct Aggregation

    # The aggregation function - default is "Sum"
    optional AggregationFunction aggregation

    # The numbers to aggregate on
    int[len > 0] numbers

# An aggregation function
enum AggregationFunction
    Average
    Sum
`);
~~~


## Validate using a Schema

To validate an object using the schema, use the
[validateType](https://craigahobbs.github.io/schema-markdown-js/module-lib_schema.html#.validateType)
function. For example:

~~~ javascript
import {validateType} from 'schema-markdown/lib/schema.js';

const obj = validateType(modelTypes, 'Aggregation', {'numbers': [1, 2, '3', 4]});
console.assert(obj.numbers[2] === 3);
~~~

Notice that the numerical input '3' above is *type-massaged* to the integer 3 by validation.

Validation fails if the object does not match the schema:

~~~ javascript
try {
    validateType(modelTypes, 'Aggregation', {'numbers': [1, 2, 'asdf', 4]});
} catch ({message}) {
    console.assert(message === "Invalid value \"asdf\" (type 'string') for member 'numbers.2', expected type 'int'", message);
}
~~~

Validation also fails if a member constraint is violated:

~~~ javascript
try {
    validateType(modelTypes, 'Aggregation', {'numbers': []});
} catch ({message}) {
    console.assert(message === "Invalid value [] (type 'object') for member 'numbers', expected type 'array' [len > 0]", message);
}
~~~


## Schema Documentation

You can document a schema with BareScript's
[schemaDoc application](https://craigahobbs.github.io/bare-script/library/#var.vGroup='schemaDoc.bare')
running on the
[MarkdownUp application](https://craigahobbs.github.io/markdown-up/).

If your
[type model JSON file](https://craigahobbs.github.io/bare-script/model/#var.vURL=''&var.vName='Types')
or
[Schema Markdown file](https://craigahobbs.github.io/schema-markdown-js/language/)
is publicly visible, you can use the BareScript model application with the `var.vURL` query argument:

<https://craigahobbs.github.io/bare-script/model/#var.vURL='https://craigahobbs.github.io/bare-script/library/model.json'>

**Note:** Schema Markdown files use the `.smd` file extension.


### Self-Hosting Schema Documentation

You can host the schemaDoc application yourself by downloading the
[MarkdownUp Application HTML stub](https://craigahobbs.github.io/markdown-up/#host-markdown-web-pages).

~~~sh
curl -O https://craigahobbs.github.io/markdown-up/extra/index.html
~~~

Replace the MarkdownUp application creation line:

~~~javascript
        const app = new MarkdownUp(window);
~~~

With the following:

```javascript
        const app = new MarkdownUp(window, {
            'markdownText': `\
~~~markdown-script
include <schemaDoc.bare>

schemaDocMain('model.json', 'My Model')
~~~
`
        });
```

To view locally, start a local static web server:

~~~ sh
python3 -m http.server
~~~


## Development

This package is developed using [javascript-build](https://github.com/craigahobbs/javascript-build#readme).
It was started using [javascript-template](https://github.com/craigahobbs/javascript-template#readme) as follows:

~~~
template-specialize javascript-template/template/ schema-markdown-js/ -k package schema-markdown -k name 'Craig A. Hobbs' -k email 'craigahobbs@gmail.com' -k github 'craigahobbs' -k noapp 1
~~~
