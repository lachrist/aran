import {concat} from "array-lite";

const {
  Date: {now},
  Number: {
    prototype: {toString: toNumberString},
  },
  Math: {random, round},
  JSON: {stringify},
  Reflect: {apply, getOwnPropertyDescriptor},
  Object: {
    freeze,
    prototype: {toString: toObjectString},
  },
  Error,
  String,
  String: {
    prototype: {substring, replace},
  },
  undefined,
} = globalThis;

const EMPTY_ARRAY = [];

const ONE_ARRAY = [1];

export const assert = (check, message) => {
  if (!check) {
    throw new Error(message);
  }
};

export const generateSwitch0 = (clauses) => (discriminant) => {
  const clause = clauses[discriminant.type];
  return clause(discriminant);
};

export const generateSwitch1 = (clauses) => (discriminant, argument1) => {
  const clause = clauses[discriminant.type];
  return clause(discriminant, argument1);
};

export const generateSwitch2 =
  (clauses) => (discriminant, argument1, argument2) => {
    const clause = clauses[discriminant.type];
    return clause(discriminant, argument1, argument2);
  };

export const generateThrowError = (message) => () => {
  throw new Error(message);
};

export const inspect = (value) => {
  if (typeof value === "string") {
    return stringify(value);
  }
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    return apply(toObjectString, value, EMPTY_ARRAY);
  }
  return String(value);
};

export const format = (template, values) => {
  let index = 0;
  const message = apply(replace, template, [
    /(%+)($|[^%])/gu,
    (_match, escape, marker) => {
      if (escape.length >= 2) {
        return `${apply(substring, escape, ONE_ARRAY)}${marker}`;
      }
      assert(index < values.length, "missing format value");
      const value = values[index];
      index += 1;
      if (marker === "s") {
        assert(typeof value === "string", "expected a string for format");
        return value;
      }
      if (marker === "e") {
        assert(
          typeof value === "object" && value !== null,
          "expected an object",
        );
        const descriptor = getOwnPropertyDescriptor(value, "message");
        assert(descriptor !== undefined, "missing 'message' property");
        assert(
          getOwnPropertyDescriptor(descriptor, "value") !== undefined,
          "'message' property is an accessor",
        );
        const {value: error_message} = descriptor;
        assert(
          typeof error_message === "string",
          "expected 'message' property value to be a string",
        );
        return error_message;
      }
      if (marker === "j") {
        return stringify(value);
      }
      if (marker === "o") {
        return inspect(value);
      }
      return assert(false, "invalid format marker");
    },
  ]);
  assert(index === values.length, "missing format marker");
  return message;
};

/* eslint-disable no-restricted-syntax */

export class AranError extends Error {}

export class SyntaxAranError extends AranError {}

export class EnclaveLimitationAranError extends AranError {}

export class InvalidOptionsAranError extends AranError {}

/* eslint-enable no-restricted-syntax  */

export const expect = (check, Constructor, template, values) => {
  if (!check) {
    throw new Constructor(format(template, values));
  }
};

export const expectSuccess = (
  closure,
  context,
  values1,
  Constructor,
  template,
  values2,
) => {
  try {
    return apply(closure, context, values1);
  } catch (error) {
    throw new Constructor(format(template, concat(values2, [error])));
  }
};

/////////////
// Counter //
/////////////

export const createCounter = () => ({value: 0});
export const incrementCounter = (counter) => {
  counter.value += 1;
  return counter.value;
};

//////////////////////
// Function Utility //
//////////////////////

export const bind = (f, g) => (x) => f(g(x));

export const returnFirst = (x1) => x1;
export const returnSecond = (_x1, x2) => x2;
export const returnThird = (_x1, _x2, x3) => x3;
export const returnFourth = (_x1, _x2, _x3, x4) => x4;
export const returnFifth = (_x1, _x2, _x3, _x4, x5) => x5;

export const generateReturn = (value) => () => value;

export const dropFirst =
  (f) =>
  (_x, ...xs) =>
    apply(f, undefined, xs);

////////////
// Object //
////////////

export const hasOwnProperty = (object, key) =>
  getOwnPropertyDescriptor(object, key) !== undefined;

///////////
// Curry //
///////////

export const makeCurry = (f, ...xs) => ({f, xs});

export const extendCurry = ({f, xs: xs1}, ...xs2) => ({
  f,
  xs: concat(xs1, xs2),
});

export const callCurry = ({f, xs: xs1}, ...xs2) =>
  apply(f, undefined, concat(xs1, xs2));

///////////
// Array //
///////////

export const empty = freeze([]);

export const getLast = (array) => array[array.length - 1];

export const push = (array, element) => {
  array[array.length] = element;
};

export const pop = (array) => {
  const last = array[array.length - 1];
  array.length -= 1;
  return last;
};

export const forEachCurry = (array, curry) => {
  const {length} = array;
  for (let index = 0; index < length; index += 1) {
    callCurry(curry, array[index], index, array);
  }
};

export const findCurry = (array, curry) => {
  const {length} = array;
  for (let index = 0; index < length; index += 1) {
    if (callCurry(curry, array[index], index, array)) {
      return array[index];
    }
  }
  return null;
};

export const mapCurry = (array1, curry) => {
  const {length} = array1;
  const array2 = [];
  for (let index = 0; index < length; index += 1) {
    array2[index] = callCurry(curry, array1[index], index, array1);
  }
  return array2;
};

export const filterOutCurry = (array1, curry) => {
  const {length: length1} = array1;
  let length2 = 0;
  const array2 = [];
  for (let index = 0; index < length1; index += 1) {
    if (!callCurry(curry, array1[index], index, array1)) {
      array2[length2] = array1[index];
      length2 += 1;
    }
  }
  return array2;
};

//////////
// uuid //
//////////

const ENCODING = [36];
let uuid = null;
export const getUUID = () => {
  uuid = `${apply(toNumberString, now(), ENCODING)}_${apply(
    toNumberString,
    round(10e12 * random()),
    ENCODING,
  )}`;
  return uuid;
};
export const getLatestUUID = () => uuid;
