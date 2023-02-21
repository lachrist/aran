import {
  dropx__x,
  constant_,
  constant___,
  return__x___,
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

export const createFrame = ({ macro }) => ({
  dynamic: macro,
});

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = constant_([]);

export const declareFrame = return__x___;

export const makeFrameInitializeStatementArray = return__x___;

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makeConditionalNode, makePresentNode) =>
  (next, strict, { dynamic: macro }, scope, escaped, variable, options) =>
    makeConditionalNode(
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

export const makeFrameReadExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeGetExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeTypeofGetExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  dropx__x(makeDeleteSloppyExpression),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  makeIncrementSetEffect,
);
