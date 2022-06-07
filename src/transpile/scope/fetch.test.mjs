import {assertEqual, assertSuccess} from "../../__fixture__.mjs";

import {concat} from "array-lite";

import {
  makeBlock,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {BASE, META} from "./variable.mjs";

import {makeRead, makeWrite} from "./right.mjs";

import {createRoot} from "./property.mjs";

import {DEFINE_STATIC, CLOSURE_STATIC} from "./frame/index.mjs";

import {
  extend,
  conflict,
  harvest,
  makeDeclareStatements,
  makeInitializeStatements,
  makeLookupExpression,
  makeLookupEffect,
} from "./fetch.mjs";

const {undefined} = globalThis;

const scope = extend(
  extend(createRoot(123), DEFINE_STATIC, BASE, {}),
  CLOSURE_STATIC,
  META,
  {},
);

assertEqual(conflict(scope, "def", BASE, "variable"), undefined);

const body = concat(
  makeDeclareStatements(scope, "def", BASE, "variable", null, []),
  makeInitializeStatements(
    scope,
    "def",
    BASE,
    "variable",
    makeLiteralExpression("init"),
  ),
  [
    makeEffectStatement(
      makeExpressionEffect(
        makeLookupExpression(scope, BASE, "variable", makeRead()),
      ),
    ),
    makeEffectStatement(
      makeLookupEffect(
        scope,
        BASE,
        "variable",
        makeWrite(makeLiteralExpression("right")),
      ),
    ),
  ],
);

const {header, prelude} = harvest([CLOSURE_STATIC, DEFINE_STATIC], scope);

assertSuccess(
  allignBlock(
    makeBlock([], header, concat(prelude, body)),
    `{
      let VARIABLE;
      VARIABLE = 'init';
      effect(VARIABLE);
      VARIABLE = 'right';
    }`,
  ),
);
