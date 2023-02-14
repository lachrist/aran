import {
  noop_,
  dropx__x,
  constant_,
  constant____,
  deadcode_____,
  constant___,
  incrementCounter,
} from "../../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeSymbolUnscopablesExpression,
  makeDeleteSloppyExpression,
} from "../../../intrinsic.mjs";

import { makeTypeofGetExpression, makeIncrementSetEffect } from "./helper.mjs";

const { undefined } = globalThis;

export const KINDS = [];

export const create = ({ macro, observable }) => ({
  dynamic: macro,
  observable,
});

export const conflict = constant____(undefined);

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = deadcode_____("declare called on empty-dynamic frame");

export const makeInitializeStatementArray = deadcode_____(
  "makeInitializeStatements called on empty-dynamic frame",
);

export const lookupAll = constant___(undefined);

const compileMakeLookupNode =
  (makeConditionalNode, makePresentNode, observe) =>
  (
    next,
    strict,
    { dynamic: macro, observable },
    scope,
    escaped,
    variable,
    options,
  ) => {
    if (observable) {
      observe(options);
    }
    return makeConditionalNode(
      makeConditionalExpression(
        makeGetExpression(macro, makeSymbolUnscopablesExpression()),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(macro, makeSymbolUnscopablesExpression()),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), macro),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), macro),
      ),
      makePresentNode(strict, macro, makeLiteralExpression(variable), options),
      next(strict, scope, escaped, variable, options),
    );
  };

export const makeReadExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeGetExpression),
  noop_,
);

export const makeTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeTypeofGetExpression),
  noop_,
);

export const makeDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeDeleteSloppyExpression),
  noop_,
);

export const makeWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  makeIncrementSetEffect,
  ({ counter }) => {
    incrementCounter(counter);
    incrementCounter(counter);
  },
);
