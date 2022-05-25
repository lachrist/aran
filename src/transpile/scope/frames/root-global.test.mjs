import {concat} from "array-lite";

import {assertSuccess} from "../../../__fixture__.mjs";

import {
  makeScriptProgram,
  makeLiteralExpression,
  makeReturnStatement,
} from "../../../ast/index.mjs";

import {
  allignProgram,
  allignEffect,
  allignExpression,
} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDelete, makeWrite} from "../right.mjs";

import {declare, initialize, create, lookup} from "./root-global.mjs";

const {Error} = globalThis;

const next = () => {
  throw new Error("next should never be called");
};

assertSuccess(
  allignProgram(
    makeScriptProgram(
      concat(declare(create(null), "const", "variable", null, []), [
        makeReturnStatement(makeLiteralExpression("completion")),
      ]),
    ),
    `
      'script';
      return 'completion';
    `,
  ),
);

assertSuccess(
  allignProgram(
    makeScriptProgram(
      concat(
        initialize(
          create(null),
          "const",
          "variable",
          makeLiteralExpression("value"),
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      ),
    ),
    `
      'script';
      const variable = 'value';
      return 'completion';
    `,
  ),
);

assertSuccess(
  allignExpression(
    lookup(next, create(null), true, true, "variable", makeRead()),
    "intrinsic.aran.getGlobal('variable')",
  ),
);

assertSuccess(
  allignExpression(
    lookup(next, create(null), true, true, "variable", makeTypeof()),
    "intrinsic.aran.typeofGlobal('variable')",
  ),
);

assertSuccess(
  allignExpression(
    lookup(next, create(null), false, true, "variable", makeDelete()),
    "intrinsic.aran.deleteGlobalSloppy('variable')",
  ),
);

assertSuccess(
  allignEffect(
    lookup(
      next,
      create(null),
      true,
      false,
      "variable",
      makeWrite(makeLiteralExpression("value")),
    ),
    `
      effect(
        intrinsic.aran.setGlobalStrict('variable', 'value'),
      )
    `,
  ),
);
