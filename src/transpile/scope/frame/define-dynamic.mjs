import {constant_, deadcode_____} from "../../../util/index.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = ["def"];

export const create = (_layer, {dynamic}) => ({dynamic});

export const conflict = constant_(undefined);

export const harvest = constant_({prelude: [], header: []});

export const makeDeclareStatements = (
  _strict,
  _frame,
  _kind,
  _variable,
  _options,
) => [];

export const makeInitializeStatements = deadcode_____(
  "defined variable should not be initialized",
);

export const generateMakeLookupNode =
  (makeDynamicLookupNode) =>
  (_next, strict, _escaped, {dynamic}, variable, right) =>
    makeDynamicLookupNode(strict, dynamic, variable, right, false);

export const makeLookupExpression = generateMakeLookupNode(
  makeDynamicLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeDynamicLookupEffect);
