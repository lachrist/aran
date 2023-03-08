import { assertEqual, assertSuccess } from "../../__fixture__.mjs";

import {
  returnx,
  constant_,
  constant__,
  constant______,
  constant_______,
} from "../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";

import { allignBlock } from "../../allign/index.mjs";

import { assertFrameLibrary, makeFrameBlock } from "./__fixture_new__.mjs";

const { undefined } = globalThis;

const Frame = {
  createFrame: returnx,
  harvestFrameHeader: constant_(["variable"]),
  harvestFramePrelude: constant_([
    makeEffectStatement(makeExpressionEffect(makeLiteralExpression("prelude"))),
  ]),
  declareFrame: constant______(undefined),
  makeFrameInitializeStatementArray: constant______([]),
  lookupFrameAll: constant__(undefined),
  makeFrameReadExpression: constant_______(makeLiteralExpression("read")),
  makeFrameTypeofExpression: constant_______(makeLiteralExpression("typeof")),
  makeFrameDiscardExpression: constant_______(makeLiteralExpression("discard")),
  makeFrameWriteEffectArray: constant_______([
    makeExpressionEffect(makeLiteralExpression("write")),
  ]),
};

assertFrameLibrary(Frame);

assertSuccess(
  allignBlock(
    makeFrameBlock(Frame, "options", (frame) => {
      assertEqual(frame, "options");
      return [
        makeEffectStatement(
          makeExpressionEffect(makeLiteralExpression("body")),
        ),
      ];
    }),
    `{ let variable; void "prelude"; void "body"; }`,
  ),
);
