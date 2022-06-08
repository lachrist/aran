import {
  constant_,
  deadcode_____,
  deadcode______,
} from "../../../util/index.mjs";

import {
  makeConditionalExpression,
  makeLiteralExpression,
  makeConditionalEffect,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeSymbolUnscopablesExpression,
} from "../../../intrinsic.mjs";

import {
  makeDynamicLookupExpression,
  makeDynamicLookupEffect,
} from "./helper.mjs";

const {undefined} = globalThis;

export const KINDS = [];

export const create = (_layer, {dynamic, observable}) => ({
  dynamic,
  observable,
});

export const conflict = constant_(undefined);

export const harvest = constant_({prelude: [], header: []});

export const makeDeclareStatements = deadcode______(
  "declaration on body-with frame",
);

export const makeInitializeStatements = deadcode_____(
  "initialization on body-with frame",
);

const generateMakeLookupNode =
  (makeConditionalNode, makeDynamicLookupNode) =>
  (next, strict, _escaped, {dynamic, observable}, variable, right) =>
    makeConditionalNode(
      makeConditionalExpression(
        makeGetExpression(dynamic, makeSymbolUnscopablesExpression()),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(dynamic, makeSymbolUnscopablesExpression()),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
      ),
      makeDynamicLookupNode(strict, dynamic, variable, right, observable),
      next(),
    );

export const makeLookupEffect = generateMakeLookupNode(
  makeConditionalEffect,
  makeDynamicLookupEffect,
);

export const makeLookupExpression = generateMakeLookupNode(
  makeConditionalExpression,
  makeDynamicLookupExpression,
);
