# schema-markdown

**Schema Markdown** is a human-friendly schema definition language and schema validator. Here are
its features at a glance:

- Schema-validate JSON objects
- Human-friendly schema definition
- Validates member value and length contraints
- Validation *type-massages* string member values
- Pure JavaScript


## Links

- [Documentation on GitHub Pages](https://craigahobbs.github.io/schema-markdown-js/)
- [Package on npm](https://www.npmjs.com/package/schema-markdown)
- [Source code on GitHub](https://github.com/craigahobbs/schema-markdown-js)


## Usage

To schema-validate an object, first parse its *Schema Markdown* using the
[SchemaMarkdownParser](https://craigahobbs.github.io/schema-markdown-js/module-parser.SchemaMarkdownParser.html)
class:

``` javascript
import * as smd from 'schema_markdown/index.js';

const parser = new smd.SchemaMarkdownParser(`\
# An aggregation function
enum Aggregation
    Average
    Sum

# An aggregate numerical operation
struct Operation
    # The aggregation function - default is "Sum"
    optional Aggregation aggregation

    # The numbers to operate on
    int[len > 0] numbers
`);
```

Then, validate an object using the
[validate_type](https://craigahobbs.github.io/schema-markdown-js/module-schema.html#.validateType)
function:

``` javascript
const obj = smd.validateType(parser.types, 'Operation', {
    'numbers': [1, 2, '3', 4]
});
console.assert(obj.numbers[2] === 3);
```

Notice that the numerical input '3' above is *type-massaged* to the integer 3 by validation.
Validation fails if the object does not match the schema:

``` javascript
try {
    smd.validateType(parser.types, 'Operation', {
        'numbers': [1, 2, 'asdf', 4]
    });
} catch ({message}) {
    console.assert(message === "Invalid value \"asdf\" (type 'string') for member 'numbers.2', expected type 'int'", message);
}
```

Validation also fails if a member contraint is violated:

``` javascript
try {
    smd.validateType(parser.types, 'Operation', {
        'numbers': []
    });
} catch ({message}) {
    console.assert(message === "Invalid value [] (type 'object') for member 'numbers', expected type 'array' [len > 0]", message);
}
```


## Development

This project is developed using [JavaScript Build](https://github.com/craigahobbs/javascript-build#readme).
