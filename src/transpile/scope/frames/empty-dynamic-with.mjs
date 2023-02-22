import { dropx__x } from "../../../util/index.mjs";

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

import {
  makeTypeofGetExpression,
  makeIncrementSetEffect,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  declareEmptyFrame,
  makeEmptyFrameInitializeStatementArray,
  lookupEmptyFrameAll,
} from "./helper.mjs";

export const KINDS = [];

export const createFrame = ({ macro }) => ({
  dynamic: macro,
});

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = declareEmptyFrame;

export const makeFrameInitializeStatementArray =
  makeEmptyFrameInitializeStatementArray;

export const lookupFrameAll = lookupEmptyFrameAll;

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
