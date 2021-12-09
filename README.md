# schema-markdown

[![npm](https://img.shields.io/npm/v/schema-markdown)](https://www.npmjs.com/package/schema-markdown)
[![GitHub](https://img.shields.io/github/license/craigahobbs/schema-markdown-js)](https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE)

**Schema Markdown** is a human-friendly schema definition language and schema validator. Here are
its features at a glance:

- Schema-validate JSON objects
- Human-friendly schema definition
- Validates member value and length contraints
- Validation *type-massages* string member values
- Pure JavaScript


## Links

- [Schema Markdown Language Reference](https://craigahobbs.github.io/schema-markdown/schema-markdown.html)
- [Documentation on GitHub Pages](https://craigahobbs.github.io/schema-markdown-js/)
- [Package on npm](https://www.npmjs.com/package/schema-markdown)
- [Source code on GitHub](https://github.com/craigahobbs/schema-markdown-js)


## Usage

To schema-validate an object, first parse its *Schema Markdown* using the
[SchemaMarkdownParser](https://craigahobbs.github.io/schema-markdown-js/module-lib_parser.SchemaMarkdownParser.html)
class:

``` javascript
import {SchemaMarkdownParser} from 'schema-markdown/parser.js';
import {validateType} from 'schema-markdown/schema.js';

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
[validateType](https://craigahobbs.github.io/schema-markdown-js/module-lib_schema.html#.validateType)
function:

``` javascript
const obj = validateType(parser.types, 'Operation', {
    'numbers': [1, 2, '3', 4]
});
console.assert(obj.numbers[2] === 3);
```

Notice that the numerical input '3' above is *type-massaged* to the integer 3 by validation.
Validation fails if the object does not match the schema:

``` javascript
try {
    validateType(parser.types, 'Operation', {
        'numbers': [1, 2, 'asdf', 4]
    });
} catch ({message}) {
    console.assert(message === "Invalid value \"asdf\" (type 'string') for member 'numbers.2', expected type 'int'", message);
}
```

Validation also fails if a member contraint is violated:

``` javascript
try {
    validateType(parser.types, 'Operation', {
        'numbers': []
    });
} catch ({message}) {
    console.assert(message === "Invalid value [] (type 'object') for member 'numbers', expected type 'array' [len > 0]", message);
}
```


## Development

schema-markdown is developed using [javascript-build](https://github.com/craigahobbs/javascript-build#readme)
and it was started using [javascript-template](https://github.com/craigahobbs/javascript-template#readme):

```
template-specialize javascript-template/template/ schema-markdown-js/ -k package schema-markdown -k name 'Craig A. Hobbs' -k email 'craigahobbs@gmail.com' -k github 'craigahobbs' -k noapp 1
```
