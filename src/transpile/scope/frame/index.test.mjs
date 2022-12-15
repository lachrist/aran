import { concat } from "array-lite";

import { assertSuccess, assertEqual } from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeEffectStatement,
  makeBlock,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import { allignBlock } from "../../../allign/index.mjs";

import { BASE, META } from "../variable.mjs";

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

const STRICT = true;

const ESCAPED = true;

const frame = createFrame(CLOSURE_STATIC, META, {});

assertEqual(conflictFrame(STRICT, frame, "var", BASE, "variable"), false);

assertEqual(conflictFrame(STRICT, frame, "var", META, "variable"), true);

assertEqual(
  declareFrame(STRICT, frame, "var", BASE, "variable", { exports: [] }),
  false,
);

assertEqual(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    "var",
    BASE,
    "variable",
    makeLiteralExpression("right"),
  ),
  null,
);

assertEqual(
  declareFrame(STRICT, frame, "var", META, "variable", { exports: [] }),
  true,
);

lookupFrameAll(STRICT, ESCAPED, frame);

const body = concat(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    "var",
    META,
    "variable",
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
          BASE,
          "variable",
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
          META,
          "variable",
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
      effect('next');
      effect(VARIABLE);
    }`,
  ),
);
