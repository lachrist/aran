
import {
  isReadRight,
  isTypeofRight,
  isDeleteRight,
  getRightExpression,
} from "../right.mjs";

const descriptor = {
  __proto__: null,
  value: false,
  writable: true,
  configurable: true,
  enumerable: true,
};

const {Reflect:ownKeys} = globalThis;

export const create = (prefix) => ({
  prefix,
  bindings: {},
});

export const harvest = ({bindings}) => ({
  header: ownKeys(bindings),
  prelude: [],
});

export const declare = ({prefix, bindings}, kind, variable, import_, exports_) => {
  variable = `${prefix}${variable}`;
  assert(import_ === null, "unexpected imported variable");
  assert(exports_.length === 0, "unexpected exported variable");
  assert(!hasOwnProperty(bindings, variable), "duplicate variable declaration");
  defineProperty(bindings, variable, descriptor);
  return [];
};

export const initialize = ({prefix, bindings}, kind, variable, expression) => {
  variable = `${prefix}${variable}`;
  assert(hasOwnProperty(bindings, variable), "missing variable declaration");
  assert(!bindings[variable], "duplicate variable initialization");
  bindings[variable] = true;
  return makeWriteEffect(append(prefix, variable), expression);
};

export const lookup = (next, {prefix, bindings}, _escaped, _strict, variable, right) => {
  variable = `${prefix}${variable}`;
  if (hasOwnProperty(bindings, variable)) {
    assert(bindings[variable], "missing variable initialization");
    if (isReadRight(right)) {
      return makeReadExpression(variable);
    } else if (isTypeofRight(right)) {
      return makeUnaryExpression("typeof", makeReadExpression(variable));
    } else if (isDeleteRight(right)) {
      return makeLiteralExpression(false);
    } else {
      return makeWriteEffect(variable, getRightExpression(right));
    }
  } else {
    return next();
  }
};
