// Licensed under the MIT License
// https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE

import {decodeQueryString, encodeQueryString, jsonStringifySortKeys} from '../lib/encode.js';
import {strict as assert} from 'node:assert';
import test from 'node:test';


//
// decodeQueryString tests
//


test('decodeQueryString, complex dict', () => {
    assert.deepEqual(
        decodeQueryString('_a=7&a=7&b.c=%2Bx%20y%20%2B%20z&b.d.0=2&b.d.1=-4&b.d.2=6'),
        {'a': '7', '_a': '7', 'b': {'c': '+x y + z', 'd': ['2', '-4', '6']}}
    );
});


test('decodeQueryString, array of dicts', () => {
    assert.deepEqual(
        decodeQueryString('foo.0.bar=17&foo.0.thud=blue&foo.1.boo=bear'),
        {'foo': [{'bar': '17', 'thud': 'blue'}, {'boo': 'bear'}]}
    );
});


test('decodeQueryString, top-level array', () => {
    assert.deepEqual(
        decodeQueryString('0=1&1=2&2=3'),
        ['1', '2', '3']
    );
});


test('decodeQueryString, empty string', () => {
    assert.deepEqual(
        decodeQueryString(''),
        {}
    );
});


test('decodeQueryString, empty string value', () => {
    assert.deepEqual(
        decodeQueryString('b='),
        {'b': ''}
    );
});


test('decodeQueryString, empty string value at end', () => {
    assert.deepEqual(
        decodeQueryString('a=7&b='),
        {'a': '7', 'b': ''}
    );
});


test('decodeQueryString, empty string value at start', () => {
    assert.deepEqual(
        decodeQueryString('b=&a=7'),
        {'a': '7', 'b': ''}
    );
});


test('decodeQueryString, empty string value in middle', () => {
    assert.deepEqual(
        decodeQueryString('a=7&b=&c=9'),
        {'a': '7', 'b': '', 'c': '9'}
    );
});


test('decodeQueryString, decode keys and values', () => {
    assert.deepEqual(
        decodeQueryString('a%2eb.c=7%20+%207%20%3d%2014'),
        {'a.b': {'c': '7 + 7 = 14'}}
    );
});


test('decodeQueryString, decode unicode string', () => {
    assert.deepEqual(
        decodeQueryString('a=abc%EA%80%80&b.0=c&b.1=d'),
        {'a': 'abc\ua000', 'b': ['c', 'd']}
    );
});


test('decodeQueryString, keys and values with special characters', () => {
    assert.deepEqual(
        decodeQueryString('a%26b%3Dc%2ed=a%26b%3Dc.d'),
        {'a&b=c.d': 'a&b=c.d'}
    );
});


test('decodeQueryString, non-initial-zero array-looking index', () => {
    assert.deepEqual(
        decodeQueryString('a.1=0'),
        {'a': {'1': '0'}}
    );
});


test('decodeQueryString, dictionary first, then array-looking zero index', () => {
    assert.deepEqual(
        decodeQueryString('a.b=0&a.0=0'),
        {'a': {'b': '0', '0': '0'}}
    );
});


test('decodeQueryString, empty string key', () => {
    assert.deepEqual(
        decodeQueryString('a=7&=b'),
        {'a': '7', '': 'b'}
    );
});


test('decodeQueryString, empty string key and value', () => {
    assert.deepEqual(
        decodeQueryString('a=7&='),
        {'a': '7', '': ''}
    );
});


test('decodeQueryString, empty string key and value with space', () => {
    assert.deepEqual(
        decodeQueryString('a=7& = '),
        {'a': '7', ' ': ' '}
    );
});


test('decodeQueryString, empty string key with no equal', () => {
    assert.deepEqual(
        decodeQueryString('a=7&'),
        {'a': '7'}
    );
});


test('decodeQueryString, two empty string key/values', () => {
    assert.throws(
        () => {
            decodeQueryString('&');
        },
        {
            'name': 'Error',
            'message': "Invalid key/value pair ''"
        }
    );
});


test('decodeQueryString, multiple empty string key/values', () => {
    assert.throws(
        () => {
            decodeQueryString('&&');
        },
        {
            'name': 'Error',
            'message': "Invalid key/value pair ''"
        }
    );
});


test('decodeQueryString, empty string sub-key', () => {
    assert.deepEqual(
        decodeQueryString('a.=5'),
        {'a': {'': '5'}}
    );
});


test('decodeQueryString, anchor tag', () => {
    assert.deepEqual(
        decodeQueryString('a=7&b'),
        {'a': '7'}
    );
});


test('decodeQueryString, key with no equal', () => {
    assert.throws(
        () => {
            decodeQueryString('a=7&b&c=11');
        },
        {
            'name': 'Error',
            'message': "Invalid key/value pair 'b'"
        }
    );
});


test('decodeQueryString, key with no equal - long key/value', () => {
    assert.throws(
        () => {
            decodeQueryString(`a=7&${'b'.repeat(2000)}&c=11`);
        },
        {
            'name': 'Error',
            'message': `Invalid key/value pair '${'b'.repeat(100)}'`
        }
    );
});


test('decodeQueryString, two empty string keys with no equal', () => {
    assert.throws(
        () => {
            decodeQueryString('a&b');
        },
        {
            'name': 'Error',
            'message': "Invalid key/value pair 'a'"
        }
    );
});


test('decodeQueryString, multiple empty string keys with no equal', () => {
    assert.throws(
        () => {
            decodeQueryString('a&b&c');
        },
        {
            'name': 'Error',
            'message': "Invalid key/value pair 'a'"
        }
    );
});


test('decodeQueryString, duplicate keys', () => {
    assert.throws(
        () => {
            decodeQueryString('abc=21&ab=19&abc=17');
        },
        {
            'name': 'Error',
            'message': "Duplicate key 'abc'"
        }
    );
});


test('decodeQueryString, duplicate keys - long key/value', () => {
    assert.throws(
        () => {
            decodeQueryString(`${'a'.repeat(2000)}=21&ab=19&${'a'.repeat(2000)}=17`);
        },
        {
            'name': 'Error',
            'message': `Duplicate key '${'a'.repeat(100)}'`
        }
    );
});


test('decodeQueryString, duplicate index', () => {
    assert.throws(
        () => {
            decodeQueryString('a.0=0&a.1=1&a.0=2');
        },
        {
            'name': 'Error',
            'message': "Duplicate key 'a.0'"
        }
    );
});


test('decodeQueryString, index too large', () => {
    assert.throws(
        () => {
            decodeQueryString('a.0=0&a.1=1&a.3=3');
        },
        {
            'name': 'Error',
            'message': "Invalid array index '3' in key 'a.3'"
        }
    );
});


test('decodeQueryString, index too large - long key/value', () => {
    assert.throws(
        () => {
            decodeQueryString(`${'a'.repeat(2000)}.0=0&${'a'.repeat(2000)}.1=1&${'a'.repeat(2000)}.3=3`);
        },
        {
            'name': 'Error',
            'message': `Invalid array index '3' in key '${'a'.repeat(100)}'`
        }
    );
});


test('decodeQueryString, negative index', () => {
    assert.throws(
        () => {
            decodeQueryString('a.0=0&a.1=1&a.-3=3');
        },
        {
            'name': 'Error',
            'message': "Invalid array index '-3' in key 'a.-3'"
        }
    );
});


test('decodeQueryString, invalid index', () => {
    assert.throws(
        () => {
            decodeQueryString('a.0=0&a.1asdf=1');
        },
        {
            'name': 'Error',
            'message': "Invalid array index '1asdf' in key 'a.1asdf'"
        }
    );
});


test('decodeQueryString, first list, then dict', () => {
    assert.throws(
        () => {
            decodeQueryString('a.0=0&a.b=0');
        },
        {
            'name': 'Error',
            'message': "Invalid array index 'b' in key 'a.b'"
        }
    );
});


test('decodeQueryString, first list, then dict - long key/value', () => {
    assert.throws(
        () => {
            decodeQueryString(`${'a'.repeat(2000)}.0=0&${'a'.repeat(2000)}.b=0`);
        },
        {
            'name': 'Error',
            'message': `Invalid array index 'b' in key '${'a'.repeat(100)}'`
        }
    );
});


//
// encodeQueryString tests
//


test('encodeQueryString', () => {
    assert.equal(
        encodeQueryString({
            'foo': 17,
            'bar': 19.33,
            'bonk': 'abc',
            ' th&ud ': ' ou&ch ',
            'blue': new Date('2020-06-24'),
            'fever': null,
            'zap': [
                {'a': 5},
                {'b': 7}
            ]
        }),
        '%20th%26ud%20=%20ou%26ch%20&bar=19.33&blue=2020-06-24T00%3A00%3A00.000Z&bonk=abc&fever=null&foo=17&zap.0.a=5&zap.1.b=7'
    );
});


test('encodeQueryString, null', () => {
    assert.equal(encodeQueryString(null), 'null');
    assert.equal(encodeQueryString({'a': null, 'b': 'abc'}), 'a=null&b=abc');
});


test('encodeQueryString, bool', () => {
    assert.equal(encodeQueryString(true), 'true');
});


test('encodeQueryString, number', () => {
    assert.equal(encodeQueryString(5.1), '5.1');
});


test('encodeQueryString, date', () => {
    assert.equal(encodeQueryString(new Date('2020-06-24')), '2020-06-24T00%3A00%3A00.000Z');
});


test('encodeQueryString, array', () => {
    assert.equal(encodeQueryString([1, 2, []]), '0=1&1=2&2=');
});


test('encodeQueryString, empty array', () => {
    assert.equal(encodeQueryString([]), '');
});


test('encodeQueryString, empty array/array', () => {
    assert.equal(encodeQueryString([[]]), '0=');
});


test('encodeQueryString, object', () => {
    assert.equal(encodeQueryString({'a': 5, 'b': 'a&b', 'c': {}}), 'a=5&b=a%26b&c=');
});


test('encodeQueryString, empty object', () => {
    assert.equal(encodeQueryString({}), '');
});


test('encodeQueryString, empty object/object', () => {
    assert.equal(encodeQueryString({'a': {}}), 'a=');
});


//
// jsonStringifySortKeys tests
//


test('jsonStringifySortKeys', () => {
    assert.equal(
        jsonStringifySortKeys({
            'b': [
                {'a': 1, 'b': 2},
                {'b': 3, 'a': 4}
            ],
            'a': null,
            'c': 'hello!'
        }),
        '{"a":null,"b":[{"a":1,"b":2},{"a":4,"b":3}],"c":"hello!"}'
    );
});


test('jsonStringifySortKeys, non-object', () => {
    assert.equal(jsonStringifySortKeys(null), 'null');
    assert.equal(jsonStringifySortKeys(1), '1');
    assert.equal(jsonStringifySortKeys('hello'), '"hello"');
});
