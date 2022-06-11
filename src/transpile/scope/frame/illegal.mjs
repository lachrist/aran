import {
  assert,
  constant_,
  deadcode_____,
  hasOwnProperty,
  SyntaxAranError,
} from "../../../util/index.mjs";

const {
  undefined,
  Reflect: {defineProperty},
} = globalThis;

const descriptor = {
  __proto__: null,
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
};

export const KINDS = ["illegal"];

export const create = (_layer, _options) => ({bindings: {}});

export const conflict = constant_(undefined);

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  {bindings},
  _kind,
  variable,
  {name},
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {__proto__: descriptor, value: name});
  return [];
};

export const makeInitializeStatements = deadcode_____(
  "initialization on illegal frame",
);

const makeLookupNode = (
  next,
  _strict,
  _escaped,
  {bindings},
  variable,
  _right,
) => {
  if (hasOwnProperty(bindings, variable)) {
    throw new SyntaxAranError(`Illegal ${bindings[variable]}`);
  } else {
    return next();
  }
};

export const makeLookupEffect = makeLookupNode;

export const makeLookupExpression = makeLookupNode;
