import {concat} from "array-lite";

import {assertSuccess, assertEqual} from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeEffectStatement,
  makeBlock,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {allignBlock} from "../../../allign/index.mjs";

import {BASE, META} from "../variable.mjs";

import {
  CLOSURE_STATIC,
  create,
  harvest,
  conflict,
  declare,
  makeInitializeStatementArray,
  makeReadExpression,
} from "./index.mjs";

const {Error} = globalThis;

const STRICT = true;

const ESCAPED = true;

const frame = create(CLOSURE_STATIC, META, {});

assertEqual(conflict(STRICT, frame, "var", BASE, "variable"), false);

assertEqual(conflict(STRICT, frame, "var", META, "variable"), true);

assertEqual(
  declare(STRICT, frame, "var", BASE, "variable", {exports: []}),
  false,
);

assertEqual(
  makeInitializeStatementArray(
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
  declare(STRICT, frame, "var", META, "variable", {exports: []}),
  true,
);

const body = concat(
  makeInitializeStatementArray(
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
        makeReadExpression(
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
        makeReadExpression(
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

const {header, prelude} = harvest(frame);

assertSuccess(
  allignBlock(
    makeBlock([], header, concat(prelude, body)),
    `{
      let VARIABLE;
      VARIABLE = undefined;
      VARIABLE = 'right';
      effect('next');
      effect(VARIABLE);
    }`,
  ),
);
