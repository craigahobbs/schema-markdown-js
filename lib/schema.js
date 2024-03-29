// Licensed under the MIT License
// https://github.com/craigahobbs/schema-markdown-js/blob/main/LICENSE

/** @module lib/schema */

import {typeModel} from './typeModel.js';
import {validateTypeModelErrors} from './schemaUtil.js';


/**
 * Get a user type's referenced type model
 *
 * @param {Object} types - The [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 * @param {string} typeName - The type name
 * @param {Object} [referencedTypes=null] - Optional map of referenced user type name to user type model
 * @returns {Object} The referenced [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 */
export function getReferencedTypes(types, typeName, referencedTypes = {}) {
    return getReferencedTypesHelper(types, {'user': typeName}, referencedTypes);
}


function getReferencedTypesHelper(types, type, referencedTypes) {
    // Array?
    if ('array' in type) {
        const {array} = type;
        getReferencedTypesHelper(types, array.type, referencedTypes);

    // Dict?
    } else if ('dict' in type) {
        const {dict} = type;
        getReferencedTypesHelper(types, dict.type, referencedTypes);
        if ('keyType' in dict) {
            getReferencedTypesHelper(types, dict.keyType, referencedTypes);
        }

    // User type?
    } else if ('user' in type) {
        const typeName = type.user;

        // Already encountered?
        if (!(typeName in referencedTypes)) {
            const userType = types[typeName];
            referencedTypes[typeName] = userType;

            // Struct?
            if ('struct' in userType) {
                const {struct} = userType;
                if ('bases' in struct) {
                    for (const base of struct.bases) {
                        getReferencedTypesHelper(types, {'user': base}, referencedTypes);
                    }
                }
                for (const member of getStructMembers(types, struct)) {
                    getReferencedTypesHelper(types, member.type, referencedTypes);
                }

            // Enum?
            } else if ('enum' in userType) {
                const enum_ = userType.enum;
                if ('bases' in enum_) {
                    for (const base of enum_.bases) {
                        getReferencedTypesHelper(types, {'user': base}, referencedTypes);
                    }
                }

            // Typedef?
            } else if ('typedef' in userType) {
                const {typedef} = userType;
                getReferencedTypesHelper(types, typedef.type, referencedTypes);

            // Action?
            } else if ('action' in userType) {
                const {action} = userType;
                if ('path' in action) {
                    getReferencedTypesHelper(types, {'user': action.path}, referencedTypes);
                }
                if ('query' in action) {
                    getReferencedTypesHelper(types, {'user': action.query}, referencedTypes);
                }
                if ('input' in action) {
                    getReferencedTypesHelper(types, {'user': action.input}, referencedTypes);
                }
                if ('output' in action) {
                    getReferencedTypesHelper(types, {'user': action.output}, referencedTypes);
                }
                if ('errors' in action) {
                    getReferencedTypesHelper(types, {'user': action.errors}, referencedTypes);
                }
            }
        }
    }

    return referencedTypes;
}


/**
 * Schema Markdown type model validation error
 *
 * @extends {Error}
 * @property {?string} memberFqn - The fully qualified member name
 */
export class ValidationError extends Error {
    /**
     * Schema Markdown type model validation error constructor
     *
     * @param {string} message - The validation error message
     * @param {string} [memberFqn=null] - The fully-qualified member name
     */
    constructor(message, memberFqn = null) {
        super(message);
        this.name = this.constructor.name;
        this.memberFqn = memberFqn;
    }
}


/**
 * Type-validate a value using a user type model. Container values are duplicated since some member types are
 * transformed during validation.
 *
 * @param {Object} types - The [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 * @param {string} typeName - The type name
 * @param {Object} value - The value object to validate
 * @param {?string} [memberFqn=null] - The fully-qualified member name
 * @returns {Object} The validated, transformed value object
 * @throws [ValidationError]{@link module:lib/schema.ValidationError}
 */
export function validateType(types, typeName, value, memberFqn = null) {
    if (!(typeName in types)) {
        throw new ValidationError(`Unknown type '${typeName}'`);
    }
    return validateTypeHelper(types, {'user': typeName}, value, memberFqn);
}


// Regular expressions used by validateTypeHelper
const rDate = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/;
const rDatetime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;


function validateTypeHelper(types, type, value, memberFqn) {
    let valueNew = value;

    // Built-in type?
    if ('builtin' in type) {
        const {builtin} = type;

        // string or uuid?
        if (builtin === 'string' || builtin === 'uuid') {
            // Not a string?
            if (typeof value !== 'string') {
                throwMemberError(type, value, memberFqn);
            }

            // Not a valid UUID?
            if (builtin === 'uuid' && !value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
                throwMemberError(type, value, memberFqn);
            }

        // int or float?
        } else if (builtin === 'int' || builtin === 'float') {
            // Convert string?
            if (typeof value === 'string') {
                if (isNaN(value)) {
                    throwMemberError(type, value, memberFqn);
                }
                valueNew = parseFloat(value);

            // Not a number?
            } else if (typeof value !== 'number') {
                throwMemberError(type, value, memberFqn);
            }

            // Non-int number?
            if (builtin === 'int' && Math.trunc(valueNew) !== valueNew) {
                throwMemberError(type, value, memberFqn);
            }

        // bool?
        } else if (builtin === 'bool') {
            // Convert string?
            if (typeof value === 'string') {
                if (value === 'true') {
                    valueNew = true;
                } else if (value === 'false') {
                    valueNew = false;
                } else {
                    throwMemberError(type, value, memberFqn);
                }

            // Not a bool?
            } else if (typeof value !== 'boolean') {
                throwMemberError(type, value, memberFqn);
            }

        // date or datetime?
        } else if (builtin === 'date' || builtin === 'datetime') {
            // Convert string?
            if (typeof value === 'string') {
                // Valid date format?
                const mDate = value.match(rDate);
                if (mDate !== null) {
                    const year = Number.parseInt(mDate.groups.year, 10);
                    const month = Number.parseInt(mDate.groups.month, 10);
                    const day = Number.parseInt(mDate.groups.day, 10);
                    valueNew = new Date(year, month - 1, day);
                } else if (rDatetime.test(value)) {
                    valueNew = new Date(value);
                } else {
                    throwMemberError(type, value, memberFqn);
                }

            // Not a date?
            } else if (!(value instanceof Date)) {
                throwMemberError(type, value, memberFqn);
            }

            // For date type, clear hours, minutes, seconds, and milliseconds
            if (builtin === 'date') {
                valueNew = new Date(valueNew.getFullYear(), valueNew.getMonth(), valueNew.getDate());
            }
        }

    // array?
    } else if ('array' in type) {
        // Valid value type?
        const {array} = type;
        const arrayType = array.type;
        const arrayAttr = 'attr' in array ? array.attr : null;
        if (value === '') {
            valueNew = [];
        } else if (!Array.isArray(value)) {
            throwMemberError(type, value, memberFqn);
        }

        // Validate the list contents
        const valueCopy = [];
        const arrayValueNullable = arrayAttr !== null && 'nullable' in arrayAttr && arrayAttr.nullable;
        for (let ixArrayValue = 0; ixArrayValue < valueNew.length; ixArrayValue++) {
            const memberFqnValue = memberFqn !== null ? `${memberFqn}.${ixArrayValue}` : `${ixArrayValue}`;
            let arrayValue = valueNew[ixArrayValue];
            if (arrayValueNullable && (arrayValue === null || arrayValue === 'null')) {
                arrayValue = null;
            } else {
                arrayValue = validateTypeHelper(types, arrayType, arrayValue, memberFqnValue);
                validateAttr(arrayType, arrayAttr, arrayValue, memberFqnValue);
            }
            valueCopy.push(arrayValue);
        }

        // Return the validated, transformed copy
        valueNew = valueCopy;

    // dict?
    } else if ('dict' in type) {
        // Valid value type?
        const {dict} = type;
        const dictType = dict.type;
        const dictAttr = 'attr' in dict ? dict.attr : null;
        const dictKeyType = 'keyType' in dict ? dict.keyType : {'builtin': 'string'};
        const dictKeyAttr = 'keyAttr' in dict ? dict.keyAttr : null;
        if (value === '') {
            valueNew = {};
        } else if (value === null || typeof value !== 'object') {
            throwMemberError(type, value, memberFqn);
        }

        // Validate the dict key/value pairs
        const valueCopy = valueNew instanceof Map ? new Map() : {};
        const dictKeyNullable = dictKeyAttr !== null && 'nullable' in dictKeyAttr && dictKeyAttr.nullable;
        const dictValueNullable = dictAttr !== null && 'nullable' in dictAttr && dictAttr.nullable;
        for (let [dictKey, dictValue] of (valueNew instanceof Map ? valueNew.entries() : Object.entries(valueNew))) {
            const memberFqnKey = memberFqn !== null ? `${memberFqn}.${dictKey}` : `${dictKey}`;

            // Validate the key
            if (dictKeyNullable && (dictKey === null || dictKey === 'null')) {
                dictKey = null;
            } else {
                dictKey = validateTypeHelper(types, dictKeyType, dictKey, memberFqn);
                validateAttr(dictKeyType, dictKeyAttr, dictKey, memberFqn);
            }

            // Validate the value
            if (dictValueNullable && (dictValue === null || dictValue === 'null')) {
                dictValue = null;
            } else {
                dictValue = validateTypeHelper(types, dictType, dictValue, memberFqnKey);
                validateAttr(dictType, dictAttr, dictValue, memberFqnKey);
            }

            // Copy the key/value
            if (valueCopy instanceof Map) {
                valueCopy.set(dictKey, dictValue);
            } else {
                valueCopy[dictKey] = dictValue;
            }
        }

        // Return the validated, transformed copy
        valueNew = valueCopy;

    // User type?
    } else if ('user' in type) {
        const userType = types[type.user];

        // action?
        if ('action' in userType) {
            throwMemberError(type, value, memberFqn);
        }

        // typedef?
        if ('typedef' in userType) {
            const {typedef} = userType;
            const typedefAttr = 'attr' in typedef ? typedef.attr : null;

            // Validate the value
            const valueNullable = typedefAttr !== null && 'nullable' in typedefAttr && typedefAttr.nullable;
            if (valueNullable && (value === null || value === 'null')) {
                valueNew = null;
            } else {
                valueNew = validateTypeHelper(types, typedef.type, value, memberFqn);
                validateAttr(type, typedefAttr, valueNew, memberFqn);
            }

        // enum?
        } else if ('enum' in userType) {
            const enum_ = userType.enum;

            // Not a valid enum value?
            if (!getEnumValues(types, enum_).some((enumValue) => value === enumValue.name)) {
                throwMemberError(type, value, memberFqn);
            }

        // struct?
        } else if ('struct' in userType) {
            const {struct} = userType;

            // Valid value type?
            if (value === '') {
                valueNew = {};
            } else if (value === null || typeof value !== 'object') {
                throwMemberError({'user': struct.name}, value, memberFqn);
            }

            // Valid union?
            const isUnion = 'union' in struct ? struct.union : false;
            if (isUnion) {
                if (Object.keys(value).length !== 1) {
                    throwMemberError({'user': struct.name}, value, memberFqn);
                }
            }

            // Validate the struct members
            const valueCopy = valueNew instanceof Map ? new Map() : {};
            for (const member of getStructMembers(types, struct)) {
                const memberName = member.name;
                const memberFqnMember = memberFqn !== null ? `${memberFqn}.${memberName}` : `${memberName}`;
                const memberOptional = 'optional' in member && member.optional;
                const memberNullable = 'attr' in member && 'nullable' in member.attr && member.attr.nullable;

                // Missing non-optional member?
                if (!(valueNew instanceof Map ? valueNew.has(memberName) : memberName in valueNew)) {
                    if (!memberOptional && !isUnion) {
                        throw new ValidationError(`Required member '${memberFqnMember}' missing`);
                    }
                } else {
                    // Validate the member value
                    let memberValue = valueNew instanceof Map ? valueNew.get(memberName) : valueNew[memberName];
                    if (memberNullable && (memberValue === null || memberValue === 'null')) {
                        memberValue = null;
                    } else {
                        memberValue = validateTypeHelper(types, member.type, memberValue, memberFqnMember);
                        validateAttr(member.type, 'attr' in member ? member.attr : null, memberValue, memberFqnMember);
                    }

                    // Copy the validated member
                    if (valueCopy instanceof Map) {
                        valueCopy.set(memberName, memberValue);
                    } else {
                        valueCopy[memberName] = memberValue;
                    }
                }
            }

            // Any unknown members?
            const valueCopyKeys = valueCopy instanceof Map ? Array.from(valueCopy.keys()) : Object.keys(valueCopy);
            const valueNewKeys = valueNew instanceof Map ? Array.from(valueNew.keys()) : Object.keys(valueNew);
            if (valueCopyKeys.length !== valueNewKeys.length) {
                const memberSet = new Set(getStructMembers(types, struct).map((member) => member.name));
                const [unknownKey] = valueNewKeys.filter((key) => !memberSet.has(key));
                const unknownFqn = memberFqn !== null ? `${memberFqn}.${unknownKey}` : `${unknownKey}`;
                throw new ValidationError(`Unknown member '${unknownFqn.slice(0, 100)}'`);
            }

            // Return the validated, transformed copy
            valueNew = valueCopy;
        }
    }

    return valueNew;
}


function throwMemberError(type, value, memberFqn, attr = null) {
    const memberPart = memberFqn !== null ? ` for member '${memberFqn}'` : '';
    const typeName = 'builtin' in type ? type.builtin : ('array' in type ? 'array' : ('dict' in type ? 'dict' : type.user));
    const attrPart = attr !== null ? ` [${attr}]` : '';
    const valueStr = `${JSON.stringify(value)}`;
    const msg = `Invalid value ${valueStr.slice(0, 100)} (type '${typeof value}')${memberPart}, expected type '${typeName}'${attrPart}`;
    throw new ValidationError(msg, memberFqn);
}


function validateAttr(type, attr, value, memberFqn) {
    if (attr !== null) {
        const length = Array.isArray(value) || typeof value === 'string' ? value.length
            : (typeof value === 'object' ? Object.keys(value).length : null);

        if ('eq' in attr && !(value === attr.eq)) {
            throwMemberError(type, value, memberFqn, `== ${attr.eq}`);
        }
        if ('lt' in attr && !(value < attr.lt)) {
            throwMemberError(type, value, memberFqn, `< ${attr.lt}`);
        }
        if ('lte' in attr && !(value <= attr.lte)) {
            throwMemberError(type, value, memberFqn, `<= ${attr.lte}`);
        }
        if ('gt' in attr && !(value > attr.gt)) {
            throwMemberError(type, value, memberFqn, `> ${attr.gt}`);
        }
        if ('gte' in attr && !(value >= attr.gte)) {
            throwMemberError(type, value, memberFqn, `>= ${attr.gte}`);
        }
        if ('lenEq' in attr && !(length === attr.lenEq)) {
            throwMemberError(type, value, memberFqn, `len == ${attr.lenEq}`);
        }
        if ('lenLT' in attr && !(length < attr.lenLT)) {
            throwMemberError(type, value, memberFqn, `len < ${attr.lenLT}`);
        }
        if ('lenLTE' in attr && !(length <= attr.lenLTE)) {
            throwMemberError(type, value, memberFqn, `len <= ${attr.lenLTE}`);
        }
        if ('lenGT' in attr && !(length > attr.lenGT)) {
            throwMemberError(type, value, memberFqn, `len > ${attr.lenGT}`);
        }
        if ('lenGTE' in attr && !(length >= attr.lenGTE)) {
            throwMemberError(type, value, memberFqn, `len >= ${attr.lenGTE}`);
        }
    }
}


/**
 * Get the struct's members (inherited members first)
 *
 * @param {Object} types - The [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 * @param {Object} struct - The [struct model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Struct'}
 * @returns {Array<Object>} The array of
 *     [struct member models]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='StructMember'}
 */
export function getStructMembers(types, struct) {
    // No base structs?
    if (!('bases' in struct)) {
        return 'members' in struct ? struct.members : [];
    }

    // Get base struct members
    const members = [];
    for (const base of struct.bases) {
        let baseUserType = types[base];
        while ('typedef' in baseUserType) {
            baseUserType = types[baseUserType.typedef.type.user];
        }
        members.push(...getStructMembers(types, baseUserType.struct));
    }

    // Add struct members
    if ('members' in struct) {
        members.push(...struct.members);
    }

    return members;
}


/**
 * Get the enum's values (inherited values first)
 *
 * @param {Object} types - The [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 * @param {Object} enum_ - The [enum model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Enum'}
 * @returns {Array<Object>} The array of
 *     [enum value models]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='EnumValue'}
 */
export function getEnumValues(types, enum_) {
    // No base enums?
    if (!('bases' in enum_)) {
        return 'values' in enum_ ? enum_.values : [];
    }

    // Get base enum values
    const values = [];
    for (const base of enum_.bases) {
        let baseUserType = types[base];
        while ('typedef' in baseUserType) {
            baseUserType = types[baseUserType.typedef.type.user];
        }
        values.push(...getEnumValues(types, baseUserType.enum));
    }

    // Add enum values
    if ('values' in enum_) {
        values.push(...enum_.values);
    }

    return values;
}


/**
 * Validate a type model's types object
 *
 * @param {Object} types - The [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 * @returns {Object} The validated [type model]{@link https://craigahobbs.github.io/schema-markdown-doc/doc/#var.vName='Types'}
 * @throws [ValidationError]{@link module:lib/schema.ValidationError}
 */
export function validateTypeModel(types) {
    // Validate with the type model
    const validatedTypes = validateType(typeModel, 'Types', types);

    // Do additional type model validation
    const errors = validateTypeModelErrors(validatedTypes);
    if (errors.length) {
        throw new ValidationError(errors.map(([,, message]) => message).join('\n'));
    }

    return validatedTypes;
}
