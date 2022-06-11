import {includes, map} from "array-lite";

import {
  push,
  constant_,
  partialx_,
  assert,
  deadcode_____,
} from "../../../util/index.mjs";

import {makeVariable} from "../variable.mjs";

import {makeStaticLookupExpression, makeStaticLookupEffect} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = ["def"];

export const create = (layer, _options) => ({
  layer,
  bindings: [],
});

export const conflict = constant_(undefined);

export const harvest = ({layer, bindings}) => ({
  header: map(bindings, partialx_(makeVariable, layer)),
  prelude: [],
});

export const makeDeclareStatements = (
  _strict,
  {bindings},
  _kind,
  variable,
  _options,
) => {
  assert(!includes(bindings, variable), "duplicate variable");
  push(bindings, variable);
  return [];
};

export const makeInitializeStatements = deadcode_____(
  "defined variable should not be initialized",
);

const generateMakeLookupNode =
  (makeStaticLookupNode) =>
  (next, _escaped, strict, {layer, bindings}, variable, right) => {
    if (includes(bindings, variable)) {
      return makeStaticLookupNode(strict, layer, variable, right, []);
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeStaticLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeStaticLookupEffect);
