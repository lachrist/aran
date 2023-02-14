import {
  incrementCounter,
  constant_,
  constant____,
  dropxxxxx_x,
  deadcode_____,
  constant_______,
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

export const createFrame = ({ macro }) => ({
  dynamic: macro,
});

export const conflictFrame = constant____(undefined);

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = deadcode_____("declare called on empty-void frame");

export const makeFrameInitializeStatementArray = deadcode_____(
  "makeInitializeStatementArray called on empty-void frame",
);

export const lookupFrameAll = constant___(undefined);

export const makeFrameReadExpression = dropxxxxx_x(makeThrowMissingExpression);

export const makeFrameTypeofExpression = constant_______(
  makeLiteralExpression("undefined"),
);

export const makeFrameDiscardExpression = constant_______(
  makeLiteralExpression(true),
);

export const makeFrameWriteEffect = (
  _next,
  strict,
  { dynamic: macro },
  _scope,
  _escaped,
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
