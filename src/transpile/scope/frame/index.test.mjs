import {concat} from "array-lite";

import {assertSuccess, assertEqual} from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeEffectStatement,
  makeBlock,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {allignBlock} from "../../../allign/index.mjs";

import {makeRead} from "../right.mjs";

import {
  createMetaBodyDef,
  harvest,
  makeMetaDeclareStatements,
  makeBaseDeclareStatements,
  makeMetaInitializeStatements,
  makeBaseInitializeStatements,
  makeMetaLookupEffect,
  makeBaseLookupEffect,
} from "./index.mjs";

const {Error} = globalThis;

const STRICT = true;

const ESCAPED = true;

const frame = createMetaBodyDef({});

assertEqual(
  makeBaseDeclareStatements(STRICT, frame, "def", "variable", null, []),
  null,
);

assertEqual(
  makeBaseInitializeStatements(
    STRICT,
    frame,
    "def",
    "variable",
    makeLiteralExpression("right"),
  ),
  null,
);

const body = concat(
  makeMetaDeclareStatements(STRICT, frame, "def", "variable", null, []),
  makeMetaInitializeStatements(
    STRICT,
    frame,
    "def",
    "variable",
    makeLiteralExpression("right"),
  ),
  [
    makeEffectStatement(
      makeBaseLookupEffect(
        () => makeExpressionEffect(makeLiteralExpression("next")),
        STRICT,
        ESCAPED,
        frame,
        "variable",
        makeRead(),
      ),
    ),
    makeEffectStatement(
      makeMetaLookupEffect(
        () => {
          throw new Error("unexpected next");
        },
        STRICT,
        ESCAPED,
        frame,
        "variable",
        makeRead(),
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
      VARIABLE = 'right';
      effect('next');
      effect(VARIABLE);
    }`,
  ),
);
