import { concat } from "array-lite";

import { assertSuccess, assertEqual } from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeEffectStatement,
  makeBlock,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import { allignBlock } from "../../../allign/index.mjs";

import { makeMetaVariable } from "../variable.mjs";

import {
  CLOSURE_STATIC,
  createFrame,
  harvestFrameHeader,
  harvestFramePrelude,
  lookupFrameAll,
  declareFrame,
  makeFrameInitializeStatementArray,
  makeFrameReadExpression,
} from "./index.mjs";

const { Error } = globalThis;

const STRICT = true;

const ESCAPED = true;

const frame = createFrame(CLOSURE_STATIC, "meta", {});

// Declare on other layer //
assertEqual(declareFrame(STRICT, frame, "var", "base", { exports: [] }), false);

// Declare on same layer but other kind //
assertEqual(
  declareFrame(STRICT, frame, "const", makeMetaVariable("meta", 123), {
    exports: [],
  }),
  false,
);

// Initialize on other layer //
assertEqual(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    "var",
    "base",
    makeLiteralExpression("right"),
  ),
  null,
);

// Initialize on same layer but other kind //
assertEqual(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    "const",
    makeMetaVariable("meta", 123),
    makeLiteralExpression("right"),
  ),
  null,
);

assertEqual(
  declareFrame(STRICT, frame, "var", makeMetaVariable("meta", 123), {
    exports: [],
  }),
  true,
);

lookupFrameAll(STRICT, ESCAPED, frame);

const body = concat(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    "var",
    makeMetaVariable("meta", 123),
    makeLiteralExpression("right"),
  ),
  [
    makeEffectStatement(
      makeExpressionEffect(
        makeFrameReadExpression(
          (_strict, _scope, _escaped, _variable, _options) =>
            makeLiteralExpression("next"),
          STRICT,
          frame,
          "scope",
          ESCAPED,
          "base",
          null,
        ),
      ),
    ),
    makeEffectStatement(
      makeExpressionEffect(
        makeFrameReadExpression(
          (_strict, _scope, _escaped, _variable, _options) => {
            throw new Error("unexpected next");
          },
          STRICT,
          frame,
          "scope",
          ESCAPED,
          makeMetaVariable("meta", 123),
          null,
        ),
      ),
    ),
  ],
);

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      harvestFrameHeader(frame),
      concat(harvestFramePrelude(frame), body),
    ),
    `{
      let VARIABLE;
      VARIABLE = undefined;
      VARIABLE = 'right';
      void 'next';
      void VARIABLE;
    }`,
  ),
);
