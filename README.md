# schema-markdown.js

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
import {SchemaMarkdownParser} from './schema_markdown/parser.js';

const parser = new SchemaMarkdownParser(`\
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
[validate_type](https://craigahobbs.github.io/schema-markdown-js/module-schema.html)
function:

``` javascript
import {validateType} from './schema_markdown/schema.js';

const obj = validateType(parser.types, 'Operation', {
    'numbers': [1, 2, '3', 4]
});
console.assert(obj.numbers[2] === 3);
```

Notice that the numerical input '3' above is *type-massaged* to the integer 3 by validation.
Validation fails if the object does not match the schema:

``` javascript
try {
    schema_markdown.validate_type(parser.types, 'Operation', {
        'numbers': [1, 2, 'asdf', 4]
    });
} catch ({message}) {
    console.assert(message === "Invalid value 'asdf' (type 'str') for member 'numbers.2', expected type 'int'");
}
```

Validation also fails if a member contraint is violated:

``` javascript
try {
    validateType(parser.types, 'Operation', {
        'numbers': []
    });
} catch ({message}) {
    console.assert(message === "Invalid value [] (type 'list') for member 'numbers', expected type 'array' [len > 0]");
}
```


## Development

This project is developed using [JavaScript Build](https://github.com/craigahobbs/javascript-build#readme).
