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

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

import {declare, initialize, create, lookup} from "./root-happy.mjs";

const {Error} = globalThis;

const next = () => {
  throw new Error("next should never be called");
};

assertSuccess(
  allignProgram(
    makeScriptProgram(
      concat(
        declare(
          create(makeLiteralExpression("object")),
          "kind",
          "variable",
          null,
          [],
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      ),
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
          create(makeLiteralExpression("object")),
          "kind",
          "variable",
          makeLiteralExpression("value"),
        ),
        [makeReturnStatement(makeLiteralExpression("completion"))],
      ),
    ),
    `
      'script';
      effect(
        intrinsic.aran.setStrict('object', 'variable', 'value'),
      );
      return 'completion';
    `,
  ),
);

assertSuccess(
  allignExpression(
    lookup(
      next,
      create(makeLiteralExpression("object")),
      true,
      true,
      "variable",
      makeRead(),
    ),
    "intrinsic.aran.get('object', 'variable')",
  ),
);

assertSuccess(
  allignExpression(
    lookup(
      next,
      create(makeLiteralExpression("object")),
      true,
      true,
      "variable",
      makeTypeof(),
    ),
    `
      intrinsic.aran.unary(
        'typeof',
        intrinsic.aran.get('object', 'variable'),
      )
    `,
  ),
);

assertSuccess(
  allignExpression(
    lookup(
      next,
      create(makeLiteralExpression("object")),
      true,
      true,
      "variable",
      makeDiscard(),
    ),
    "false",
  ),
);

assertSuccess(
  allignEffect(
    lookup(
      next,
      create(makeLiteralExpression("object")),
      false,
      true,
      "variable",
      makeWrite(makeLiteralExpression("value")),
    ),
    `
      effect(
        intrinsic.aran.setStrict('object', 'variable', 'value'),
      )
    `,
  ),
);
