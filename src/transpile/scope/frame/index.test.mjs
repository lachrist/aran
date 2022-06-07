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

import {makeRead} from "../right.mjs";

import {
  DEFINE_STATIC,
  create,
  conflict,
  harvest,
  makeDeclareStatements,
  makeInitializeStatements,
  makeLookupEffect,
} from "./index.mjs";

const {Error} = globalThis;

const STRICT = true;

const ESCAPED = true;

const frame = create(DEFINE_STATIC, META, {});

assertEqual(conflict(STRICT, frame, "def", BASE, "variable"), false);

assertEqual(conflict(STRICT, frame, "def", META, "variable"), true);

assertEqual(
  makeDeclareStatements(STRICT, frame, "def", BASE, "variable", null, []),
  null,
);

assertEqual(
  makeInitializeStatements(
    STRICT,
    frame,
    "def",
    BASE,
    "variable",
    makeLiteralExpression("right"),
  ),
  null,
);

const body = concat(
  makeDeclareStatements(STRICT, frame, "def", META, "variable", null, []),
  makeInitializeStatements(
    STRICT,
    frame,
    "def",
    META,
    "variable",
    makeLiteralExpression("right"),
  ),
  [
    makeEffectStatement(
      makeLookupEffect(
        () => makeExpressionEffect(makeLiteralExpression("next")),
        STRICT,
        ESCAPED,
        frame,
        BASE,
        "variable",
        makeRead(),
      ),
    ),
    makeEffectStatement(
      makeLookupEffect(
        () => {
          throw new Error("unexpected next");
        },
        STRICT,
        ESCAPED,
        frame,
        META,
        "variable",
        makeRead(),
      ),
    ),
  ],
);

const {header, prelude} = harvest(DEFINE_STATIC, frame);

assertSuccess(
  allignBlock(
    makeBlock([], header, concat(prelude, body)),
    `{
      let VARIABLE;
      VARIABLE = 'right';
      effect('next');
      effect(VARIABLE);
    }`,
  ),
);
