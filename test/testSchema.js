// Licensed under the MIT License
// https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE

import {getEnumValues, getReferencedTypes, getStructMembers, validateType, validateTypeModel} from '../lib/schema.js';
import {strict as assert} from 'node:assert';
import test from 'node:test';
import {typeModel} from '../lib/typeModel.js';


//
// getReferencedTypes tests
//


test('getReferencedTypes', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'path': 'MyAction_path',
                'query': 'MyAction_query',
                'input': 'MyAction_input',
                'output': 'MyAction_output',
                'errors': 'MyAction_errors'
            }
        },
        'MyAction_path': {
            'struct': {
                'name': 'MyAction_path',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'string'}}
                ]
            }
        },
        'MyAction_query': {
            'struct': {
                'name': 'MyAction_query',
                'members': [
                    {'name': 'b', 'type': {'array': {'type': {'user': 'MyEnum'}}}}
                ]
            }
        },
        'MyAction_input': {
            'struct': {
                'name': 'MyAction_input',
                'members': [
                    {'name': 'c', 'type': {'dict': {'type': {'user': 'MyStruct'}}}}
                ]
            }
        },
        'MyAction_output': {
            'struct': {
                'name': 'MyAction_output',
                'members': [
                    {'name': 'd', 'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'user': 'MyEnum2'}}}}
                ]
            }
        },
        'MyAction_errors': {
            'enum': {
                'name': 'MyAction_errors',
                'values': [
                    {'name': 'A'}
                ]
            }
        },
        'MyEnum': {'enum': {'name': 'MyEnum'}},
        'MyEnum2': {'enum': {'name': 'MyEnum2'}},
        'MyEnumNoref': {'enum': {'name': 'MyEnumNoref'}},
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'MyTypedef'}},
                    {'name': 'b', 'type': {'user': 'MyStructEmpty'}}
                ]
            }
        },
        'MyStructEmpty': {'struct': {'name': 'MyStructEmpty'}},
        'MyStructNoref': {'struct': {'name': 'MyStructNoref'}},
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyTypedef2'}
            }
        },
        'MyTypedef2': {
            'typedef': {
                'name': 'MyTypedef2',
                'type': {'builtin': 'int'}
            }
        },
        'MyTypedefNoref': {
            'typedef': {
                'name': 'MyTypedefNoref',
                'type': {'builtin': 'int'}
            }
        }
    };

    const expectedTypes = validateTypeModel(types);
    delete expectedTypes.MyEnumNoref;
    delete expectedTypes.MyStructNoref;
    delete expectedTypes.MyTypedefNoref;

    const referencedTypes = getReferencedTypes(types, 'MyAction');
    validateTypeModel(referencedTypes);
    assert.deepEqual(referencedTypes, expectedTypes);
});


test('getReferencedTypes, empty action', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction'
            }
        },
        'MyTypedefNoref': {
            'typedef': {
                'name': 'MyTypedefNoref',
                'type': {'builtin': 'int'}
            }
        }
    };

    const expectedTypes = validateTypeModel(types);
    delete expectedTypes.MyTypedefNoref;

    const referencedTypes = getReferencedTypes(types, 'MyAction');
    validateTypeModel(referencedTypes);
    assert.deepEqual(referencedTypes, expectedTypes);
});


test('getReferencedTypes, circular', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'MyStruct2'}}
                ]
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'members': [
                    {'name': 'a', 'type': {'user': 'MyStruct'}}
                ]
            }
        },
        'MyTypedefNoref': {
            'typedef': {
                'name': 'MyTypedefNoref',
                'type': {'builtin': 'int'}
            }
        }
    };

    const expectedTypes = validateTypeModel(types);
    delete expectedTypes.MyTypedefNoref;

    const referencedTypes = getReferencedTypes(types, 'MyStruct');
    validateTypeModel(referencedTypes);
    assert.deepEqual(referencedTypes, expectedTypes);
});


test('getReferencedTypes, struct base', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyStruct2'],
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'members': [
                    {'name': 'b', 'type': {'user': 'MyTypedef'}}
                ]
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'}
            }
        },
        'MyTypedefNoref': {
            'typedef': {
                'name': 'MyTypedefNoref',
                'type': {'builtin': 'int'}
            }
        }
    };

    const expectedTypes = validateTypeModel(types);
    delete expectedTypes.MyTypedefNoref;

    const referencedTypes = getReferencedTypes(types, 'MyStruct');
    validateTypeModel(referencedTypes);
    assert.deepEqual(referencedTypes, expectedTypes);
});


test('getReferencedTypes, enum base', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyEnum2'],
                'values': [
                    {'name': 'a'}
                ]
            }
        },
        'MyEnum2': {
            'enum': {
                'name': 'MyEnum2',
                'values': [
                    {'name': 'b'}
                ]
            }
        },
        'MyTypedefNoref': {
            'typedef': {
                'name': 'MyTypedefNoref',
                'type': {'builtin': 'int'}
            }
        }
    };

    const expectedTypes = validateTypeModel(types);
    delete expectedTypes.MyTypedefNoref;

    const referencedTypes = getReferencedTypes(types, 'MyEnum');
    validateTypeModel(referencedTypes);
    assert.deepEqual(referencedTypes, expectedTypes);
});


test('getReferencedTypes, object property names', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'constructor'}}
                ]
            }
        },
        'constructor': {
            'struct': {
                'name': 'constructor',
                'members': [
                    {'name': 'b', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const referencedTypes = getReferencedTypes(types, 'MyStruct');
    assert.deepEqual(referencedTypes, types);
});


test('getReferencedTypes, proto type', () => {
    // JSON.parse builds an own "__proto__" key - an object literal would set the prototype instead
    const types = JSON.parse(
        '{"MyStruct": {"struct": {"name": "MyStruct", "members": [{"name": "a", "type": {"user": "__proto__"}}]}},' +
        ' "__proto__": {"struct": {"name": "__proto__", "members": [{"name": "b", "type": {"builtin": "int"}}]}}}'
    );
    const referencedTypes = getReferencedTypes(types, 'MyStruct');
    assert.deepEqual(Object.keys(referencedTypes).sort(), ['MyStruct', '__proto__']);
    assert.equal(Object.getPrototypeOf(referencedTypes), Object.prototype);
    assert.deepEqual(
        Object.getOwnPropertyDescriptor(referencedTypes, '__proto__').value,
        Object.getOwnPropertyDescriptor(types, '__proto__').value
    );
});


test('getReferencedTypes, proto type recursive', () => {
    const types = JSON.parse(
        '{"__proto__": {"struct": {"name": "__proto__", "members": [{"name": "a", "type": {"user": "__proto__"}}]}}}'
    );
    const referencedTypes = getReferencedTypes(types, '__proto__');
    assert.deepEqual(Object.keys(referencedTypes), ['__proto__']);
});


test('getReferencedTypes, unknown type', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'Unknown'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            getReferencedTypes(types, 'MyStruct');
        },
        {
            'name': 'ValidationError',
            'message': 'Unknown type "Unknown"'
        }
    );
});


//
// getStructMembers tests
//


test('getStructMembers, no bases', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    // The returned array is the type model's live members array (not a copy) - mutating it mutates the model
    assert.equal(getStructMembers(types, types.MyStruct.struct), types.MyStruct.struct.members);
});


test('getStructMembers, unknown base', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['constructor'],
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            getStructMembers(types, types.MyStruct.struct);
        },
        {
            'name': 'ValidationError',
            'message': 'Unknown type "constructor"'
        }
    );
});


//
// getEnumValues tests
//


test('getEnumValues, no bases', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': 'A'}
                ]
            }
        }
    };
    // The returned array is the type model's live values array (not a copy) - mutating it mutates the model
    assert.equal(getEnumValues(types, types.MyEnum.enum), types.MyEnum.enum.values);
});


test('getEnumValues, unknown base', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['constructor'],
                'values': [
                    {'name': 'A'}
                ]
            }
        }
    };
    assert.throws(
        () => {
            getEnumValues(types, types.MyEnum.enum);
        },
        {
            'name': 'ValidationError',
            'message': 'Unknown type "constructor"'
        }
    );
});


//
// validateType tests
//


function validateTypeHelper(type, obj) {
    const types = {
        'MyTypedef': {
            'typedef': {
                'type': type
            }
        }
    };
    return validateType(types, 'MyTypedef', obj);
}


test('validateType, unknown', () => {
    assert.throws(
        () => {
            validateType({}, 'Unknown', null);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "Unknown"'
        }
    );
});


test('validateType, unknown object property name', () => {
    assert.throws(
        () => {
            validateType({}, 'constructor', null);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "constructor"'
        }
    );
});


test('validateType, unknown member type', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'constructor'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateType(types, 'MyStruct', {'a': 5});
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "constructor"'
        }
    );
});


test('validateType, member fqn', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'array': {'type': {'builtin': 'int'}}}}
                ]
            }
        }
    };
    const obj = {'a': [1, 'abc']};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj, 'request');
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'request.a.1',
            'message': 'Invalid value "abc" (type "string") for member "request.a.1", expected type "int"'
        }
    );
});


test('validateType, member fqn non-string', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'array': {'type': {'builtin': 'int'}}}}
                ]
            }
        }
    };
    const obj = {'a': [1, 'abc']};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj, 5);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '5.a.1',
            'message': 'Invalid value "abc" (type "string") for member "5.a.1", expected type "int"'
        }
    );
});


test('validateType, member fqn empty string', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'}
            }
        }
    };
    // The member part is omitted for an empty-string FQN
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 'abc', '');
        },
        {
            'name': 'ValidationError',
            'memberFqn': '',
            'message': 'Invalid value "abc" (type "string"), expected type "int"'
        }
    );
});


test('validateType, string', () => {
    const obj = 'abc';
    assert.equal(validateTypeHelper({'builtin': 'string'}, obj), obj);
});


test('validateType, string error', () => {
    const obj = 7;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'string'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 7 (type "number"), expected type "string"'
        }
    );
});


test('validateType, string error undefined', () => {
    const obj = undefined;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'string'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value undefined (type "undefined"), expected type "string"'
        }
    );
});


test('validateType, int', () => {
    const obj = 7;
    assert.equal(validateTypeHelper({'builtin': 'int'}, obj), obj);
});


test('validateType, int string', () => {
    const obj = '7';
    assert.equal(validateTypeHelper({'builtin': 'int'}, obj), 7);
});


test('validateType, int string exp', () => {
    const obj = '1e3';
    assert.equal(validateTypeHelper({'builtin': 'int'}, obj), 1000);
});


test('validateType, int string exp float', () => {
    const obj = '1.5e1';
    assert.equal(validateTypeHelper({'builtin': 'int'}, obj), 15);
});


test('validateType, int string exp error', () => {
    const obj = '1e400';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'int'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "1e400" (type "string"), expected type "int"'
        }
    );
});


test('validateType, int float', () => {
    const obj = 7.1;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'int'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 7.1 (type "number"), expected type "int"'
        }
    );
});


test('validateType, int float string', () => {
    const obj = '7.1';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'int'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "7.1" (type "string"), expected type "int"'
        }
    );
});


test('validateType, int error', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'int'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "int"'
        }
    );
});


test('validateType, int error float', () => {
    const obj = 7.5;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'int'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 7.5 (type "number"), expected type "int"'
        }
    );
});


test('validateType, int error bool', () => {
    const obj = true;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'int'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value true (type "boolean"), expected type "int"'
        }
    );
});


test('validateType, float', () => {
    const obj = 7.5;
    assert.equal(validateTypeHelper({'builtin': 'float'}, obj), obj);
});


test('validateType, float int', () => {
    const obj = 7;
    assert.equal(validateTypeHelper({'builtin': 'float'}, obj), 7.0);
});


test('validateType, float string', () => {
    const obj = '7.5';
    assert.equal(validateTypeHelper({'builtin': 'float'}, obj), 7.5);
});


test('validateType, float error', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'float'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "float"'
        }
    );
});


test('validateType, float error nan', () => {
    const obj = 'nan';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'float'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "nan" (type "string"), expected type "float"'
        }
    );
});


test('validateType, float error infinity', () => {
    const obj = 'Infinity';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'float'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "Infinity" (type "string"), expected type "float"'
        }
    );
});


test('validateType, float error inf', () => {
    const obj = 'inf';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'float'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "inf" (type "string"), expected type "float"'
        }
    );
});


test('validateType, float error bool', () => {
    const obj = true;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'float'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value true (type "boolean"), expected type "float"'
        }
    );
});


test('validateType, bool', () => {
    const obj = false;
    assert.equal(validateTypeHelper({'builtin': 'bool'}, obj), obj);
});


test('validateType, bool true', () => {
    const obj = 'true';
    assert.equal(validateTypeHelper({'builtin': 'bool'}, obj), true);
});


test('validateType, bool false', () => {
    const obj = 'false';
    assert.equal(validateTypeHelper({'builtin': 'bool'}, obj), false);
});


test('validateType, bool error', () => {
    const obj = 0;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'bool'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 0 (type "number"), expected type "bool"'
        }
    );
});


test('validateType, bool error string', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'bool'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "bool"'
        }
    );
});


test('validateType, date', () => {
    const obj = new Date(2020, 5, 26);
    assert.deepEqual(validateTypeHelper({'builtin': 'date'}, obj), new Date(2020, 5, 26));
});


test('validateType, date datetime', () => {
    const obj = new Date(Date.UTC(2020, 5, 26, 18, 8));
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-06-26T18:08:00.000Z" (type "object"), expected type "date"'
        }
    );
});


test('validateType, date string', () => {
    const obj = '2020-06-26';
    assert.deepEqual(validateTypeHelper({'builtin': 'date'}, obj), new Date(2020, 5, 26));
});


test('validateType, date string datetime', () => {
    const obj = '2013-05-26T13:11:00-07:00';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2013-05-26T13:11:00-07:00" (type "string"), expected type "date"'
        }
    );
});


test('validateType, date string error', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "date"'
        }
    );
});


test('validateType, date string invalid date', () => {
    const obj = '2020-13-01';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-13-01" (type "string"), expected type "date"'
        }
    );
});


test('validateType, date string invalid day', () => {
    const obj = '2020-02-30';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-02-30" (type "string"), expected type "date"'
        }
    );
});


test('validateType, date error', () => {
    const obj = 0;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 0 (type "number"), expected type "date"'
        }
    );
});


test('validateType, date error excluded', () => {
    const obj = 'December 17, 1995 03:24:00';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "December 17, 1995 03:24:00" (type "string"), expected type "date"'
        }
    );
});


test('validateType, datetime', () => {
    const obj = new Date(2020, 5, 26, 18, 8);
    assert.deepEqual(validateTypeHelper({'builtin': 'datetime'}, obj), obj);
});


test('validateType, datetime date', () => {
    const obj = new Date(2020, 5, 26);
    assert.deepEqual(validateTypeHelper({'builtin': 'datetime'}, obj), obj);
});


test('validateType, datetime string', () => {
    const obj = '2020-06-26T13:11:00-07:00';
    assert.deepEqual(validateTypeHelper({'builtin': 'datetime'}, obj), new Date(Date.UTC(2020, 5, 26, 20, 11)));
});


test('validateType, datetime string date', () => {
    const obj = '2013-05-26';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2013-05-26" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime string error', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime string invalid date', () => {
    // Matches the datetime pattern but is not a real date/time
    const obj = '2020-01-01T99:99:99Z';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-01-01T99:99:99Z" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime string invalid day', () => {
    const obj = '2020-02-30T00:00:00Z';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-02-30T00:00:00Z" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime string timezone z', () => {
    const obj = '2020-01-01T12:00:00Z';
    assert.deepEqual(validateTypeHelper({'builtin': 'datetime'}, obj), new Date(Date.UTC(2020, 0, 1, 12, 0, 0)));
});


test('validateType, datetime string timezone no colon', () => {
    const obj = '2020-06-13T13:25:00-0700';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-06-13T13:25:00-0700" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime string no seconds', () => {
    const obj = '2020-01-01T12:00Z';
    assert.deepEqual(validateTypeHelper({'builtin': 'datetime'}, obj), new Date(Date.UTC(2020, 0, 1, 12, 0)));
});


test('validateType, datetime string fraction', () => {
    const obj = '2020-01-01T12:00:00.123456789Z';
    assert.deepEqual(validateTypeHelper({'builtin': 'datetime'}, obj), new Date(Date.UTC(2020, 0, 1, 12, 0, 0, 123)));
});


test('validateType, datetime string fraction comma', () => {
    const obj = '2020-01-01T12:00:00,5';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-01-01T12:00:00,5" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime error', () => {
    const obj = 0;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 0 (type "number"), expected type "datetime"'
        }
    );
});


test('validateType, datetime error excluded', () => {
    const obj = 'December 17, 1995 03:24:00';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "December 17, 1995 03:24:00" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, uuid', () => {
    const obj = 'AED91C7B-DCFD-49B3-A483-DBC9EA2031A3';
    assert.deepEqual(validateTypeHelper({'builtin': 'uuid'}, obj), obj);
});


test('validateType, uuid lowercase', () => {
    const obj = 'aed91c7b-dcfd-49b3-a483-dbc9ea2031a3';
    assert.deepEqual(validateTypeHelper({'builtin': 'uuid'}, obj), obj);
});


test('validateType, uuid version nibble', () => {
    // Accept any hex version/variant nibbles
    const obj = '00000000-0000-6000-8000-000000000000';
    assert.deepEqual(validateTypeHelper({'builtin': 'uuid'}, obj), obj);
});


test('validateType, datetime string space separator', () => {
    const obj = '2020-01-01 12:00:00';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-01-01 12:00:00" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, datetime string no timezone', () => {
    const obj = '2020-01-01T12:00:00';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'datetime'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-01-01T12:00:00" (type "string"), expected type "datetime"'
        }
    );
});


test('validateType, date string datetime no timezone', () => {
    const obj = '2020-01-01T12:00:00';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'date'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "2020-01-01T12:00:00" (type "string"), expected type "date"'
        }
    );
});


test('validateType, uuid error', () => {
    const obj = 0;
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'uuid'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 0 (type "number"), expected type "uuid"'
        }
    );
});


test('validateType, uuid error string', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'uuid'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "uuid"'
        }
    );
});


test('validateType, uuid error string non-canonical', () => {
    const obj = 'aed91c7bdcfd49b3a483dbc9ea2031a3';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'uuid'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "aed91c7bdcfd49b3a483dbc9ea2031a3" (type "string"), expected type "uuid"'
        }
    );
});


test('validateType, uuid error string non-ascii', () => {
    const obj = 'aed91c7b-dcfd-49b3-a483-dbc9ea2031aé';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'uuid'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "aed91c7b-dcfd-49b3-a483-dbc9ea2031aé" (type "string"), expected type "uuid"'
        }
    );
});


test('validateType, uuid error string escape', () => {
    const obj = 'a"b\\c';
    assert.throws(
        () => {
            validateTypeHelper({'builtin': 'uuid'}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "a\\"b\\\\c" (type "string"), expected type "uuid"'
        }
    );
});


test('validateType, any', () => {
    const obj = {};
    assert.deepEqual(validateTypeHelper({'builtin': 'any'}, obj), obj);
});


test('validateType, any string', () => {
    const obj = 'abc';
    assert.deepEqual(validateTypeHelper({'builtin': 'any'}, obj), obj);
});


test('validateType, any int', () => {
    const obj = 7;
    assert.deepEqual(validateTypeHelper({'builtin': 'any'}, obj), obj);
});


test('validateType, any bool', () => {
    const obj = true;
    assert.deepEqual(validateTypeHelper({'builtin': 'any'}, obj), obj);
});


test('validateType, array', () => {
    const obj = [1, 2, 3];
    assert.deepEqual(validateTypeHelper({'array': {'type': {'builtin': 'int'}}}, obj), obj);
});


test('validateType, array nullable', () => {
    const obj = [1, null, 3];
    assert.deepEqual(validateTypeHelper({'array': {'type': {'builtin': 'int'}, 'attr': {'nullable': true}}}, obj), obj);

    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '1',
            'message': 'Invalid value null (type "object") for member "1", expected type "int"'
        }
    );
});


test('validateType, array nullable as string', () => {
    const obj = ['1', 'null', '3'];
    assert.deepEqual(
        validateTypeHelper({'array': {'type': {'builtin': 'int'}, 'attr': {'nullable': true}}}, obj),
        [1, null, 3]
    );

    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '1',
            'message': 'Invalid value "null" (type "string") for member "1", expected type "int"'
        }
    );
});


test('validateType, array empty string', () => {
    const obj = '';
    assert.deepEqual(validateTypeHelper({'array': {'type': {'builtin': 'int'}}}, obj), []);
});


test('validateType, array attributes', () => {
    const obj = [1, 2, 3];
    assert.deepEqual(validateTypeHelper({'array': {'type': {'builtin': 'int'}, 'attr': {'lt': 5}}}, obj), obj);
});


test('validateType, array error', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "array"'
        }
    );
});


test('validateType, array error value', () => {
    const obj = [1, 'abc', 3];
    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '1',
            'message': 'Invalid value "abc" (type "string") for member "1", expected type "int"'
        }
    );
});


test('validateType, array error value nested', () => {
    const obj = [[1, 2], [1, 'abc', 3]];
    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'array': {'type': {'builtin': 'int'}}}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '1.1',
            'message': 'Invalid value "abc" (type "string") for member "1.1", expected type "int"'
        }
    );
});


test('validateType, array attribute error', () => {
    const obj = [1, 2, 5];
    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'builtin': 'int'}, 'attr': {'lt': 5}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '2',
            'message': 'Invalid value 5 (type "number") for member "2", expected type "int" [< 5]'
        }
    );
});


test('validateType, dict', () => {
    const obj = {'a': 1, 'b': 2, 'c': 3};
    assert.deepEqual(validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj), obj);
});


test('validateType, dict proto key', () => {
    const obj = JSON.parse('{"__proto__": {"a": 1}, "b": {"c": 2}}');
    const obj2 = validateTypeHelper({'dict': {'type': {'dict': {'type': {'builtin': 'int'}}}}}, obj);
    assert.deepEqual(Object.keys(obj2), ['__proto__', 'b']);
    assert.deepEqual(Object.getOwnPropertyDescriptor(obj2, '__proto__').value, {'a': 1});
    assert.deepEqual(obj2.b, {'c': 2});
    assert.equal(Object.getPrototypeOf(obj2), Object.prototype);
});


test('validateType, dict null', () => {
    const obj = null;
    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value null (type "object"), expected type "dict"'
        }
    );
});


test('validateType, dict nullable', () => {
    const obj = {'a': 1, 'b': null, 'c': 3};
    assert.deepEqual(validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'attr': {'nullable': true}}}, obj), obj);

    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'b',
            'message': 'Invalid value null (type "object") for member "b", expected type "int"'
        }
    );
});


test('validateType, dict nullable as string', () => {
    const obj = {'a': '1', 'b': 'null', 'c': '3'};
    assert.deepEqual(
        validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'attr': {'nullable': true}}}, obj),
        {'a': 1, 'b': null, 'c': 3}
    );

    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'b',
            'message': 'Invalid value "null" (type "string") for member "b", expected type "int"'
        }
    );
});


test('validateType, dict key nullable', () => {
    const obj = new Map();
    obj.set('a', 1);
    obj.set(null, 2);
    obj.set('c', 3);
    const obj2 = validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'keyAttr': {'nullable': true}}}, obj);
    assert.equal(Array.from(obj2.keys()).length, 3);
    assert.equal(obj2.get('a'), 1);
    assert.equal(obj2.get(null), 2);
    assert.equal(obj2.get('c'), 3);

    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value null (type "object"), expected type "string"'
        }
    );
});


test('validateType, dict key nullable value error', () => {
    const obj = new Map();
    obj.set(null, 'bad');
    // The null key is stringified host-natively in the FQN ("null" here, "None" in the Python port)
    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'keyAttr': {'nullable': true}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'null',
            'message': 'Invalid value "bad" (type "string") for member "null", expected type "int"'
        }
    );
});


test('validateType, dict key nullable as string', () => {
    const obj = new Map();
    obj.set('a', 1);
    obj.set(null, 2);
    obj.set('c', 3);
    const obj2 = validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'keyAttr': {'nullable': true}}}, obj);
    assert.equal(Array.from(obj2.keys()).length, 3);
    assert.equal(obj2.get('a'), 1);
    assert.equal(obj2.get(null), 2);
    assert.equal(obj2.get('c'), 3);

    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value null (type "object"), expected type "string"'
        }
    );
});


test('validateType, dict empty string', () => {
    const obj = '';
    assert.deepEqual(validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj), {});
});


test('validateType, dict attributes', () => {
    const obj = {'a': 1, 'b': 2, 'c': 3};
    assert.deepEqual(validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'attr': {'lt': 5}}}, obj), obj);
});


test('validateType, dict error', () => {
    const obj = 'abc';
    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "dict"'
        }
    );
});


test('validateType, dict error array', () => {
    const obj = [1, 2, 3];
    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [1,2,3] (type "object"), expected type "dict"'
        }
    );
});


test('validateType, dict error value', () => {
    const obj = {'a': 1, 'b': 'abc', 'c': 3};
    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'b',
            'message': 'Invalid value "abc" (type "string") for member "b", expected type "int"'
        }
    );
});


test('validateType, dict error value nested', () => {
    const obj = [{'a': 1}, {'a': 1, 'b': 'abc', 'c': 3}];
    assert.throws(
        () => {
            validateTypeHelper({'array': {'type': {'dict': {'type': {'builtin': 'int'}}}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': '1.b',
            'message': 'Invalid value "abc" (type "string") for member "1.b", expected type "int"'
        }
    );
});


test('validateType, dict attribute error', () => {
    const obj = {'a': 1, 'b': 2, 'c': 5};
    assert.throws(
        () => {
            validateTypeHelper({'dict': {'type': {'builtin': 'int'}, 'attr': {'lt': 5}}}, obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'c',
            'message': 'Invalid value 5 (type "number") for member "c", expected type "int" [< 5]'
        }
    );
});


test('validateType, dict key type', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': 'A'},
                    {'name': 'B'}
                ]
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'user': 'MyEnum'}}}
            }
        }
    };

    let obj = {'A': 1, 'B': 2};
    assert.deepEqual(validateType(types, 'MyTypedef', obj), obj);

    obj = {'A': 1, 'C': 2};
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "C" (type "string"), expected type "MyEnum"'
        }
    );
});


test('validateType, dict key attr', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'builtin': 'string'}, 'keyAttr': {'lenLT': 10}}}
            }
        }
    };

    let obj = {'abc': 1, 'abcdefghi': 2};
    assert.deepEqual(validateType(types, 'MyTypedef', obj), obj);

    obj = {'abc': 1, 'abcdefghij': 2};
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abcdefghij" (type "string"), expected type "string" [len < 10]'
        }
    );
});


test('validateType, enum', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': 'a'},
                    {'name': 'b'}
                ]
            }
        }
    };

    let obj = 'a';
    assert.equal(validateType(types, 'MyEnum', obj), obj);

    obj = 'c';
    assert.throws(
        () => {
            validateType(types, 'MyEnum', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "c" (type "string"), expected type "MyEnum"'
        }
    );
});


test('validateType, enum empty', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum'
            }
        }
    };

    const obj = 'a';
    assert.throws(
        () => {
            validateType(types, 'MyEnum', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "a" (type "string"), expected type "MyEnum"'
        }
    );
});


test('validateType, enum base', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyEnum2'],
                'values': [
                    {'name': 'a'}
                ]
            }
        },
        'MyEnum2': {
            'enum': {
                'name': 'MyEnum2',
                'bases': ['MyTypedef']
            }
        },
        'MyEnum3': {
            'enum': {
                'name': 'MyEnum3',
                'values': [
                    {'name': 'b'}
                ]
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyEnum3'}
            }
        }
    };

    let obj = 'a';
    assert.equal(validateType(types, 'MyEnum', obj), obj);

    obj = 'b';
    assert.equal(validateType(types, 'MyEnum', obj), obj);

    obj = 'c';
    assert.throws(
        () => {
            validateType(types, 'MyEnum', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "c" (type "string"), expected type "MyEnum"'
        }
    );
});


test('validateType, typedef', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'gte': 5}
            }
        }
    };

    let obj = 5;
    assert.equal(validateType(types, 'MyTypedef', obj), obj);

    obj = 4;
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 4 (type "number"), expected type "MyTypedef" [>= 5]'
        }
    );

    obj = null;
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value null (type "object"), expected type "int"'
        }
    );

    obj = 'null';
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "null" (type "string"), expected type "int"'
        }
    );
});


test('validateType, typedef no attr', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'}
            }
        }
    };
    const obj = 5;
    assert.equal(validateType(types, 'MyTypedef', obj), obj);
});


test('validateType, typedef type error', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'}
            }
        }
    };
    const obj = 'abc';
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "int"'
        }
    );
});


test('validateType, typedef attr eq', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'eq': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', 5);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 7);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 7 (type "number"), expected type "MyTypedef" [== 5]'
        }
    );
});


test('validateType, typedef attr nullable', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'nullable': true}
            }
        }
    };
    assert.equal(validateType(types, 'MyTypedef', 5), 5);
    assert.equal(validateType(types, 'MyTypedef', null), null);
    assert.equal(validateType(types, 'MyTypedef', 'null'), null);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 'abc');
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "int"'
        }
    );
});


test('validateType, typedef attr lt', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'lt': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', 3);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 5);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 5 (type "number"), expected type "MyTypedef" [< 5]'
        }
    );

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 7);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 7 (type "number"), expected type "MyTypedef" [< 5]'
        }
    );
});


test('validateType, typedef attr lte', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'lte': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', 5);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 7);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 7 (type "number"), expected type "MyTypedef" [<= 5]'
        }
    );
});


test('validateType, typedef attr gt', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'gt': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', 7);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 3);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 3 (type "number"), expected type "MyTypedef" [> 5]'
        }
    );

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 5);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 5 (type "number"), expected type "MyTypedef" [> 5]'
        }
    );
});


test('validateType, typedef attr gte', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'gte': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', 5);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 3);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 3 (type "number"), expected type "MyTypedef" [>= 5]'
        }
    );
});


test('validateType, typedef attr lenEq', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}}},
                'attr': {'lenEq': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', [1, 2, 3, 4, 5]);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', [1, 2, 3]);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [1,2,3] (type "object"), expected type "MyTypedef" [len == 5]'
        }
    );
});


test('validateType, typedef attr lenEq object', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}}},
                'attr': {'lenEq': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5});

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', {'a': 1, 'b': 2, 'c': 3});
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value {"a":1,"b":2,"c":3} (type "object"), expected type "MyTypedef" [len == 5]'
        }
    );
});


test('validateType, typedef attr lenEq non-container', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'lenEq': 5}
            }
        }
    };
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', 5);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value 5 (type "number"), expected type "MyTypedef" [len == 5]'
        }
    );
});


test('validateType, typedef attr lenLT', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}}},
                'attr': {'lenLT': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', [1, 2, 3]);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', [1, 2, 3, 4, 5]);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [1,2,3,4,5] (type "object"), expected type "MyTypedef" [len < 5]'
        }
    );
});


test('validateType, typedef attr lenLTE', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}}},
                'attr': {'lenLTE': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', [1, 2, 3, 4, 5]);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', [1, 2, 3, 4, 5, 6, 7]);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [1,2,3,4,5,6,7] (type "object"), expected type "MyTypedef" [len <= 5]'
        }
    );
});


test('validateType, typedef attr lenGT', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}}},
                'attr': {'lenGT': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', [1, 2, 3, 4, 5, 6, 7]);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', [1, 2, 3, 4, 5]);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [1,2,3,4,5] (type "object"), expected type "MyTypedef" [len > 5]'
        }
    );
});


test('validateType, typedef attr lenGTE', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}}},
                'attr': {'lenGTE': 5}
            }
        }
    };
    validateType(types, 'MyTypedef', [1, 2, 3, 4, 5]);

    assert.throws(
        () => {
            validateType(types, 'MyTypedef', [1, 2, 3]);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [1,2,3] (type "object"), expected type "MyTypedef" [len >= 5]'
        }
    );
});


test('validateType, struct', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'string'}},
                    {'name': 'b', 'type': {'builtin': 'int'}},
                    {'name': 'c', 'type': {'builtin': 'float'}},
                    {'name': 'd', 'type': {'builtin': 'bool'}},
                    {'name': 'e', 'type': {'builtin': 'date'}},
                    {'name': 'f', 'type': {'builtin': 'datetime'}},
                    {'name': 'g', 'type': {'builtin': 'uuid'}},
                    {'name': 'h', 'type': {'builtin': 'any'}},
                    {'name': 'i', 'type': {'user': 'MyStruct2'}},
                    {'name': 'j', 'type': {'user': 'MyEnum'}},
                    {'name': 'k', 'type': {'user': 'MyTypedef'}}
                ]
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'string'}},
                    {'name': 'b', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': 'A'},
                    {'name': 'B'}
                ]
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'builtin': 'int'},
                'attr': {'gt': 0}
            }
        }
    };

    let obj = {
        'a': 'abc',
        'b': 7,
        'c': 7.1,
        'd': true,
        'e': new Date(2020, 5, 13),
        'f': new Date('2020-06-13T13:25:00-07:00'),
        'g': 'a3597528-a253-4c76-bc2d-8da0026cc838',
        'h': {'foo': 'bar'},
        'i': {
            'a': 'abc',
            'b': 7
        },
        'j': 'A',
        'k': 1
    };
    const objValidated = {
        ...obj,
        'e': new Date(2020, 5, 13)
    };
    assert.deepEqual(validateType(types, 'MyStruct', obj), objValidated);

    obj = {
        'a': 'abc',
        'b': '7',
        'c': '7.1',
        'd': 'true',
        'e': '2020-06-13',
        'f': '2020-06-13T13:25:00-07:00',
        'g': 'a3597528-a253-4c76-bc2d-8da0026cc838',
        'h': {'foo': 'bar'},
        'i': {
            'a': 'abc',
            'b': '7'
        },
        'j': 'A',
        'k': '1'
    };
    assert.deepEqual(validateType(types, 'MyStruct', obj), objValidated);
});


test('validateType, struct map', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'b', 'type': {'user': 'MyStruct2'}}
                ]
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'c', 'type': {'builtin': 'string'}}
                ]
            }
        }
    };
    const obj = new Map();
    const objB = new Map();
    obj.set('a', 5);
    obj.set('b', objB);
    objB.set('c', 'abc');
    const obj2 = validateType(types, 'MyStruct', obj);
    assert.equal(obj2 instanceof Map, true);
    assert.equal(Array.from(obj2.keys()).length, 2);
    assert.equal(obj2.get('a'), 5);
    assert.equal(Array.from(obj2.get('b').keys()).length, 1);
    assert.equal(obj2.get('b') instanceof Map, true);
    assert.equal(obj2.get('b').get('c'), 'abc');
});


test('validateType, struct map unknown member', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = new Map();
    obj.set('a', 5);
    obj.set('c', 7);
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown member "c"'
        }
    );
});


test('validateType, union map', () => {
    const types = {
        'MyUnion': {
            'struct': {
                'name': 'MyUnion',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'b', 'type': {'builtin': 'string'}}
                ],
                'union': true
            }
        }
    };
    const obj = new Map();
    obj.set('b', 'abc');
    const obj2 = validateType(types, 'MyUnion', obj);
    assert.equal(obj2 instanceof Map, true);
    assert.equal(obj2.get('b'), 'abc');

    assert.throws(
        () => {
            validateType(types, 'MyUnion', new Map());
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value {} (type "object"), expected type "MyUnion"'
        }
    );
});


test('validateType, typedef map len attr', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}}},
                'attr': {'lenEq': 2}
            }
        }
    };
    const obj = new Map();
    obj.set('a', 1);
    obj.set('b', 2);
    const obj2 = validateType(types, 'MyTypedef', obj);
    assert.equal(obj2 instanceof Map, true);
    assert.equal(obj2.size, 2);

    obj.set('c', 3);
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value {} (type "object"), expected type "MyTypedef" [len == 2]'
        }
    );
});


test('validateType, struct null', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    assert.throws(
        () => {
            validateType(types, 'MyStruct', null);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value null (type "object"), expected type "MyStruct"'
        }
    );
});


test('validateType, struct empty string', () => {
    const types = {
        'Empty': {
            'struct': {
                'name': 'Empty'
            }
        }
    };
    const obj = '';
    assert.deepEqual(validateType(types, 'Empty', obj), {});
});


test('validateType, struct string error', () => {
    const types = {
        'Empty': {
            'struct': {
                'name': 'Empty'
            }
        }
    };
    const obj = 'abc';
    assert.throws(
        () => {
            validateType(types, 'Empty', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "Empty"'
        }
    );
});


test('validateType, struct array error', () => {
    const types = {
        'Empty': {
            'struct': {
                'name': 'Empty'
            }
        }
    };
    const obj = [];
    assert.throws(
        () => {
            validateType(types, 'Empty', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value [] (type "object"), expected type "Empty"'
        }
    );
});


test('validateType, struct union', () => {
    const types = {
        'MyUnion': {
            'struct': {
                'name': 'MyUnion',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'b', 'type': {'builtin': 'string'}}
                ],
                'union': true
            }
        }
    };

    let obj = {'a': 7};
    assert.deepEqual(validateType(types, 'MyUnion', obj), obj);

    obj = {'b': 'abc'};
    assert.deepEqual(validateType(types, 'MyUnion', obj), obj);

    obj = {};
    assert.throws(
        () => {
            validateType(types, 'MyUnion', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value {} (type "object"), expected type "MyUnion"'
        }
    );

    obj = {'c': 7};
    assert.throws(
        () => {
            validateType(types, 'MyUnion', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown member "c"'
        }
    );
});


test('validateType, struct base', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyStruct2'],
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'bases': ['MyTypedef']
            }
        },
        'MyStruct3': {
            'struct': {
                'name': 'MyStruct3',
                'members': [
                    {'name': 'b', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyStruct3'}
            }
        }
    };

    let obj = {'a': 7, 'b': 11};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);

    obj = {'a': 7};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Required member "b" missing'
        }
    );
});


test('validateType, struct optional', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'b', 'type': {'builtin': 'string'}, 'optional': true},
                    {'name': 'c', 'type': {'builtin': 'float'}, 'optional': false}
                ]
            }
        }
    };

    let obj = {'a': 7, 'b': 'abc', 'c': 7.1};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);

    obj = {'a': 7, 'c': 7.1};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);

    obj = {'a': 7};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Required member "c" missing'
        }
    );
});


test('validateType, struct member inherited name', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'constructor', 'type': {'builtin': 'string'}, 'optional': true}
                ]
            }
        }
    };
    assert.deepEqual(validateType(types, 'MyStruct', {}), {});
});


test('validateType, struct member proto', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': '__proto__', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = validateType(types, 'MyStruct', JSON.parse('{"__proto__": 5}'));
    assert.deepEqual(Object.keys(obj), ['__proto__']);
    assert.equal(Object.getOwnPropertyDescriptor(obj, '__proto__').value, 5);
    assert.equal(Object.getPrototypeOf(obj), Object.prototype);
});


test('validateType, struct nullable', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'b', 'type': {'builtin': 'int'}, 'attr': {'nullable': true}},
                    {'name': 'c', 'type': {'builtin': 'string'}, 'attr': {'nullable': true}},
                    {'name': 'd', 'type': {'builtin': 'float'}, 'attr': {'nullable': false}}
                ]
            }
        }
    };

    let obj = {'a': 7, 'b': 8, 'c': 'abc', 'd': 7.1};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);

    obj = {'a': 7, 'b': null, 'c': null, 'd': 7.1};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);

    obj = {'a': 7, 'b': null, 'c': 'null', 'd': 7.1};
    assert.deepEqual(validateType(types, 'MyStruct', obj), {'a': 7, 'b': null, 'c': null, 'd': 7.1});

    obj = {'a': 7, 'b': 'null', 'c': null, 'd': 7.1};
    assert.deepEqual(validateType(types, 'MyStruct', obj), {'a': 7, 'b': null, 'c': null, 'd': 7.1});

    obj = {'a': null, 'b': null, 'c': null, 'd': 7.1};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'a',
            'message': 'Invalid value null (type "object") for member "a", expected type "int"'
        }
    );

    obj = {'a': 7, 'b': null, 'c': null, 'd': null};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'd',
            'message': 'Invalid value null (type "object") for member "d", expected type "float"'
        }
    );

    obj = {'a': 7, 'c': null, 'd': 7.1};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Required member "b" missing'
        }
    );
});


test('validateType, struct nullable attr', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'b', 'type': {'builtin': 'int'}, 'attr': {'nullable': true, 'lt': 5}}
                ]
            }
        }
    };

    let obj = {'a': 7, 'b': 4};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);

    obj = {'a': 7, 'b': 5};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'b',
            'message': 'Invalid value 5 (type "number") for member "b", expected type "int" [< 5]'
        }
    );

    obj = {'a': 7, 'b': null};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);
});


test('validateType, struct member attr', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}, 'attr': {'lt': 5}}
                ]
            }
        }
    };
    const obj = {'a': 4};
    assert.deepEqual(validateType(types, 'MyStruct', obj), obj);
});


test('validateType, struct member attr invalid', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}, 'attr': {'lt': 5}}
                ]
            }
        }
    };
    const obj = {'a': 7};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'a',
            'message': 'Invalid value 7 (type "number") for member "a", expected type "int" [< 5]'
        }
    );
});


test('validateType, struct error invalid value', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = 'abc';
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value "abc" (type "string"), expected type "MyStruct"'
        }
    );
});


test('validateType, struct error optional null value', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}, 'optional': true}
                ]
            }
        }
    };
    const obj = {'a': null};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'a',
            'message': 'Invalid value null (type "object") for member "a", expected type "int"'
        }
    );
});


test('validateType, struct error member validation', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = {'a': 'abc'};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'a',
            'message': 'Invalid value "abc" (type "string") for member "a", expected type "int"'
        }
    );
});


test('validateType, struct error nested member validation', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'MyStruct2'}}
                ]
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'members': [
                    {'name': 'b', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = {'a': {'b': 'abc'}};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': 'a.b',
            'message': 'Invalid value "abc" (type "string") for member "a.b", expected type "int"'
        }
    );
});


test('validateType, struct error unknown member', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = {'a': 7, 'b': 8};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown member "b"'
        }
    );
});


test('validateType, struct error unknown member nested', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'user': 'MyStruct'}}}
            }
        }
    };
    const obj = [{'a': 5}, {'a': 7, 'b': 'abc'}];
    assert.throws(
        () => {
            validateType(types, 'MyTypedef', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown member "1.b"'
        }
    );
});


test('validateType, struct error unknown member empty', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    const obj = {'b': 8};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown member "b"'
        }
    );
});


test('validateType, struct error unknown member long', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = {'a': 7};
    obj['b'.repeat(2000)] = 8;
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `Unknown member "${'b'.repeat(100)}"`
        }
    );
});


test('validateType, struct error missing member', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    const obj = {};
    assert.throws(
        () => {
            validateType(types, 'MyStruct', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Required member "a" missing'
        }
    );
});


test('validateType, action', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction'
            }
        }
    };
    const obj = {};
    assert.throws(
        () => {
            validateType(types, 'MyAction', obj);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid value {} (type "object"), expected type "MyAction"'
        }
    );
});


test('validateType, invalid model', () => {
    const types = {
        'MyBadBuiltin': {
            'typedef': {
                'name': 'MyBadBuiltin',
                'type': {'builtin': 'foobar'}
            }
        },
        'MyBadType': {
            'typedef': {
                'name': 'MyBadType',
                'type': {'bad_type_key': 'foobar'}
            }
        },
        'MyBadUser': {
            'typedef': {
                'name': 'MyBadUser',
                'type': {'user': 'MyBadUserKey'}
            }
        },
        'MyBadUserKey': {
            'bad_user_key': {}
        }
    };
    assert.equal(validateType(types, 'MyBadBuiltin', 'abc'), 'abc');
    assert.equal(validateType(types, 'MyBadType', 'abc'), 'abc');
    assert.equal(validateType(types, 'MyBadUser', 'abc'), 'abc');
});


//
// validateTypeModel tests
//


test('validateTypeModel', () => {
    const validatedTypeModel = validateTypeModel(typeModel);
    assert.deepEqual(typeModel, validatedTypeModel);
    assert.notEqual(typeModel, validatedTypeModel);
});


test('validateTypeModel, type validation error', () => {
    const types = {
        'MyStruct': {
            'struct': {}
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Required member "MyStruct.struct.name" missing'
        }
    );
});


test('validateTypeModel, struct empty', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, struct inconsistent type name', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct2'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Inconsistent type name "MyStruct2" for "MyStruct"'
        }
    );
});


test('validateTypeModel, struct inconsistent type name and duplicate member', () => {
    // Type-level (null memberName) and member-level errors for the same type
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStructWrong',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'a', 'type': {'builtin': 'string'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Inconsistent type name "MyStructWrong" for "MyStruct"
Redefinition of "MyStruct" member "a"`
        }
    );
});


test('validateTypeModel, struct unknown member type', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'user': 'UnknownType'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "UnknownType" from "MyStruct" member "a"'
        }
    );
});


test('validateTypeModel, struct duplicate member name', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'string'}},
                    {'name': 'b', 'type': {'builtin': 'int'}},
                    {'name': 'a', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Redefinition of "MyStruct" member "a"'
        }
    );
});


test('validateTypeModel, struct duplicate member name proto', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': '__proto__', 'type': {'builtin': 'string'}},
                    {'name': '__proto__', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Redefinition of "MyStruct" member "__proto__"'
        }
    );
});


test('validateTypeModel, struct member attributes', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}, 'attr': {'gt': 0, 'lte': 10}}
                ]
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, struct member attributes invalid', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}, 'attr': {'gt': 0, 'lte': 10, 'lenGT': 0, 'lenLTE': 10}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Invalid attribute "len <= 10" from "MyStruct" member "a"
Invalid attribute "len > 0" from "MyStruct" member "a"`
        }
    );
});


test('validateTypeModel, struct base', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyStruct2']
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'bases': ['MyTypedef']
            }
        },
        'MyStruct3': {
            'struct': {
                'name': 'MyStruct3'
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyStruct3'}
            }
        }
    };
    assert.deepEqual(validateTypeModel(types), types);
});


test('validateTypeModel, struct base unknown', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyStruct2']
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'bases': ['Unknown']
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid struct base type "Unknown"'
        }
    );
});


test('validateTypeModel, struct base typedef unknown', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyTypedef']
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'Unknown'}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Invalid struct base type "MyTypedef"
Unknown type "Unknown" from "MyTypedef"`
        }
    );
});


test('validateTypeModel, struct base non-user', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyInt']
            }
        },
        'MyInt': {
            'typedef': {
                'name': 'MyInt',
                'type': {'builtin': 'int'}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid struct base type "MyInt"'
        }
    );
});


test('validateTypeModel, struct base enum', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyEnum']
            }
        },
        'MyEnum': {
            'enum': {
                'name': 'MyEnum'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid struct base type "MyEnum"'
        }
    );
});


test('validateTypeModel, struct base circular', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyStruct2']
            }
        },
        'MyStruct2': {
            'struct': {
                'name': 'MyStruct2',
                'bases': ['MyStruct']
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Circular base type detected for type "MyStruct"
Circular base type detected for type "MyStruct2"`
        }
    );
});


test('validateTypeModel, struct base union', () => {
    const types = {
        'MyStruct': {
            'struct': {
                'name': 'MyStruct',
                'bases': ['MyUnion']
            }
        },
        'MyUnion': {
            'struct': {
                'name': 'MyUnion',
                'union': true
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid struct base type "MyUnion"'
        }
    );
});


test('validateTypeModel, struct base union struct', () => {
    const types = {
        'MyUnion': {
            'struct': {
                'name': 'MyUnion',
                'bases': ['MyStruct'],
                'union': true
            }
        },
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid struct base type "MyStruct"'
        }
    );
});


test('validateTypeModel, enum empty', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum'
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, enum inconsistent type name', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum2'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Inconsistent type name "MyEnum2" for "MyEnum"'
        }
    );
});


test('validateTypeModel,  enum duplicate value', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': 'A'},
                    {'name': 'B'},
                    {'name': 'A'}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Redefinition of "MyEnum" value "A"'
        }
    );
});


test('validateTypeModel, enum duplicate value proto', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': '__proto__'},
                    {'name': '__proto__'}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Redefinition of "MyEnum" value "__proto__"'
        }
    );
});


test('validateTypeModel, enum base', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyEnum2']
            }
        },
        'MyEnum2': {
            'enum': {
                'name': 'MyEnum2',
                'bases': ['MyTypedef']
            }
        },
        'MyEnum3': {
            'enum': {
                'name': 'MyEnum3'
            }
        },
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyEnum3'}
            }
        }
    };
    assert.deepEqual(validateTypeModel(types), types);
});


test('validateTypeModel, enum base unknown', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyEnum2']
            }
        },
        'MyEnum2': {
            'enum': {
                'name': 'MyEnum2',
                'bases': ['Unknown']
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid enum base type "Unknown"'
        }
    );
});


test('validateTypeModel, enum base non-user', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyInt']
            }
        },
        'MyInt': {
            'typedef': {
                'name': 'MyInt',
                'type': {'builtin': 'int'}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid enum base type "MyInt"'
        }
    );
});


test('validateTypeModel, enum base struct', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyStruct']
            }
        },
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid enum base type "MyStruct"'
        }
    );
});


test('validateTypeModel, enum base circular', () => {
    const types = {
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'bases': ['MyEnum2']
            }
        },
        'MyEnum2': {
            'enum': {
                'name': 'MyEnum2',
                'bases': ['MyEnum']
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Circular base type detected for type "MyEnum"
Circular base type detected for type "MyEnum2"`
        }
    );
});


test('validateTypeModel, array', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}}}
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, array attributes', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}, 'attr': {'gt': 0}}}
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, array invalid attribute', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'builtin': 'int'}, 'attr': {'lenGT': 0}}}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid attribute "len > 0" from "MyTypedef"'
        }
    );
});


test('validateTypeModel, array unknown type', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'array': {'type': {'user': 'Unknown'}}}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "Unknown" from "MyTypedef"'
        }
    );
});


test('validateTypeModel, dict', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}}}
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, dict key type', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'user': 'MyEnum'}}}
            }
        },
        'MyEnum': {
            'enum': {
                'name': 'MyEnum',
                'values': [
                    {'name': 'A'},
                    {'name': 'B'}
                ]
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, dict attributes', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'attr': {'gt': 0}}}
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, dict key attributes', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'builtin': 'string'}, 'keyAttr': {'lenGT': 0}}}
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, dict invalid attribute', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'attr': {'lenGT': 0}}}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid attribute "len > 0" from "MyTypedef"'
        }
    );
});


test('validateTypeModel, dict invalid key attribute', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'builtin': 'string'}, 'keyAttr': {'gt': 0}}}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid attribute "> 0" from "MyTypedef"'
        }
    );
});


test('validateTypeModel, dict unknown type', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'user': 'Unknown'}}}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "Unknown" from "MyTypedef"'
        }
    );
});


test('validateTypeModel, dict unknown key type', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'dict': {'type': {'builtin': 'int'}, 'keyType': {'user': 'Unknown'}}}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Invalid dictionary key type from "MyTypedef"
Unknown type "Unknown" from "MyTypedef"`
        }
    );
});


test('validateTypeModel, typedef invalid attribute', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyStruct'},
                'attr': {'lt': 0}
            }
        },
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid attribute "< 0" from "MyTypedef"'
        }
    );
});


test('validateTypeModel, typedef nullable', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyStruct'},
                'attr': {'nullable': true}
            }
        },
        'MyStruct': {
            'struct': {
                'name': 'MyStruct'
            }
        }
    };
    assert.deepEqual(validateTypeModel(types), types);
});


test('validateTypeModel, typedef attributes', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyTypedef2'},
                'attr': {'gt': 0}
            }
        },
        'MyTypedef2': {
            'typedef': {
                'name': 'MyTypedef2',
                'type': {'builtin': 'int'}
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, typedef inconsistent type name', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef2',
                'type': {'builtin': 'int'}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Inconsistent type name "MyTypedef2" for "MyTypedef"'
        }
    );
});


test('validateTypeModel, typedef unknown type', () => {
    const types = {
        'MyTypedef': {
            'typedef': {
                'name': 'MyTypedef',
                'type': {'user': 'MyTypedef2'}
            }
        },
        'MyTypedef2': {
            'typedef': {
                'name': 'MyTypedef2',
                'type': {'user': 'MyTypedef3'}
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "MyTypedef3" from "MyTypedef2"'
        }
    );
});


test('validateTypeModel, action empty struct', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'MyAction_query'
            }
        },
        'MyAction_query': {
            'struct': {
                'name': 'MyAction_query'
            }
        }
    };
    assert.deepEqual(types, validateTypeModel(types));
});


test('validateTypeModel, action inconsistent type name', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction2'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Inconsistent type name "MyAction2" for "MyAction"'
        }
    );
});


test('validateTypeModel, action unknown type', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'Unknown'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Unknown type "Unknown" from "MyAction"'
        }
    );
});


test('validateTypeModel, action action', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'MyAction2'
            }
        },
        'MyAction2': {
            'action': {
                'name': 'MyAction2'
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': 'Invalid reference to action "MyAction2" from "MyAction"'
        }
    );
});


test('validateTypeModel, action duplicate member', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'MyAction_query',
                'input': 'MyAction_input'
            }
        },
        'MyAction_query': {
            'struct': {
                'name': 'MyAction_query',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'c', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyAction_input': {
            'struct': {
                'name': 'MyAction_input',
                'members': [
                    {'name': 'b', 'type': {'builtin': 'int'}},
                    {'name': 'c', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Redefinition of "MyAction_input" member "c"
Redefinition of "MyAction_query" member "c"`
        }
    );
});


test('validateTypeModel, action duplicate member proto', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'MyAction_query',
                'input': 'MyAction_input'
            }
        },
        'MyAction_query': {
            'struct': {
                'name': 'MyAction_query',
                'members': [
                    {'name': '__proto__', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyAction_input': {
            'struct': {
                'name': 'MyAction_input',
                'members': [
                    {'name': '__proto__', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Redefinition of "MyAction_input" member "__proto__"
Redefinition of "MyAction_query" member "__proto__"`
        }
    );
});


test('validateTypeModel, action duplicate member inherited', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'MyAction_query',
                'input': 'MyAction_input'
            }
        },
        'MyAction_query': {
            'struct': {
                'name': 'MyAction_query',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'c', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyAction_input': {
            'struct': {
                'name': 'MyAction_input',
                'bases': ['MyBase'],
                'members': [
                    {'name': 'b', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyBase': {
            'struct': {
                'name': 'MyBase',
                'members': [
                    {'name': 'c', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Redefinition of "MyAction_input" member "c"
Redefinition of "MyAction_query" member "c"`
        }
    );
});


test('validateTypeModel, action duplicate member circular', () => {
    const types = {
        'MyAction': {
            'action': {
                'name': 'MyAction',
                'query': 'MyAction_query',
                'input': 'MyAction_input'
            }
        },
        'MyAction_query': {
            'struct': {
                'name': 'MyAction_query',
                'members': [
                    {'name': 'a', 'type': {'builtin': 'int'}},
                    {'name': 'c', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyAction_input': {
            'struct': {
                'name': 'MyAction_input',
                'bases': ['MyBase'],
                'members': [
                    {'name': 'b', 'type': {'builtin': 'int'}}
                ]
            }
        },
        'MyBase': {
            'struct': {
                'name': 'MyBase',
                'bases': ['MyAction_input'],
                'members': [
                    {'name': 'c', 'type': {'builtin': 'int'}}
                ]
            }
        }
    };
    assert.throws(
        () => {
            validateTypeModel(types);
        },
        {
            'name': 'ValidationError',
            'memberFqn': null,
            'message': `\
Circular base type detected for type "MyAction_input"
Circular base type detected for type "MyBase"`
        }
    );
});
