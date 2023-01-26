import {
  incrementCounter,
  constant_,
  constant____,
  dropxxxx_x,
  deadcode_____,
  constant______,
  constant___,
} from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import { makeSetExpression } from "../../../intrinsic.mjs";

import { makeThrowMissingExpression } from "./helper.mjs";

const { undefined } = globalThis;

export const KINDS = [];

export const create = ({ macro }) => ({
  dynamic: macro,
});

export const conflict = constant____(undefined);

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = deadcode_____("declare called on empty-void frame");

export const makeInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on empty-void frame",
);

export const lookupAll = constant___(undefined);

export const makeReadExpression = dropxxxx_x(makeThrowMissingExpression);

export const makeTypeofExpression = constant______(
  makeLiteralExpression("undefined"),
);

export const makeDiscardExpression = constant______(
  makeLiteralExpression(true),
);

export const makeWriteEffect = (
  _next,
  strict,
  _escaped,
  { dynamic: macro },
  variable,
  { counter, expression },
) => {
  if (strict) {
    return makeExpressionEffect(makeThrowMissingExpression(variable));
  } else {
    incrementCounter(counter);
    return makeExpressionEffect(
      makeSetExpression(
        strict,
        macro,
        makeLiteralExpression(variable),
        expression,
      ),
    );
  }
};
