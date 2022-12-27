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
  conflictFrame,
  declareFrame,
  makeFrameInitializeStatementArray,
  makeFrameReadExpression,
} from "./index.mjs";

const { Error } = globalThis;

const META = "meta";

const STRICT = true;

const ESCAPED = true;

const frame = createFrame(CLOSURE_STATIC, META, {});

assertEqual(conflictFrame(STRICT, frame, "var", "base"), false);

assertEqual(
  conflictFrame(STRICT, frame, "var", makeMetaVariable("meta", 123)),
  true,
);

assertEqual(declareFrame(STRICT, frame, "var", "base", { exports: [] }), false);

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
          () => makeLiteralExpression("next"),
          STRICT,
          ESCAPED,
          frame,
          "base",
          null,
        ),
      ),
    ),
    makeEffectStatement(
      makeExpressionEffect(
        makeFrameReadExpression(
          () => {
            throw new Error("unexpected next");
          },
          STRICT,
          ESCAPED,
          frame,
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
