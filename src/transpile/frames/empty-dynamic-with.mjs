import { dropx__x } from "../../util/index.mjs";

import {
  makeConditionalExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
} from "../../ast/index.mjs";

import {
  makeGetExpression,
  makeBinaryExpression,
  makeDeleteSloppyExpression,
} from "../../intrinsic.mjs";

import {
  makeConditionalEffectArray,
  makeTypeofGetExpression,
  makeIncrementSetEffectArray,
  harvestEmptyFrameHeader,
  harvestEmptyFramePrelude,
  declareEmptyFrame,
  makeEmptyFrameInitializeStatementArray,
  lookupEmptyFrameAll,
} from "./__common__.mjs";

export const KINDS = [];

export const createFrame = ({ pure }) => ({
  dynamic: pure,
});

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = harvestEmptyFramePrelude;

export const declareFrame = declareEmptyFrame;

export const makeFrameInitializeStatementArray =
  makeEmptyFrameInitializeStatementArray;

export const lookupFrameAll = lookupEmptyFrameAll;

const compileMakeLookupNode =
  (makeConditionalNode, makePresentNode) =>
  (next, strict, { dynamic: pure }, scope, escaped, variable, options) =>
    makeConditionalNode(
      makeConditionalExpression(
        makeGetExpression(pure, makeIntrinsicExpression("Symbol.unscopables")),
        makeConditionalExpression(
          makeGetExpression(
            makeGetExpression(
              pure,
              makeIntrinsicExpression("Symbol.unscopables"),
            ),
            makeLiteralExpression(variable),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression("in", makeLiteralExpression(variable), pure),
        ),
        makeBinaryExpression("in", makeLiteralExpression(variable), pure),
      ),
      makePresentNode(strict, pure, makeLiteralExpression(variable), options),
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

export const makeFrameWriteEffectArray = compileMakeLookupNode(
  makeConditionalEffectArray,
  makeIncrementSetEffectArray,
);
