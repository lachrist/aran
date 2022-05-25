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

const frame = create("layer", {dynamic: makeLiteralExpression("object")});

assertSuccess(
  allignProgram(
    makeScriptProgram(
      concat(declare(frame, "kind", "variable", null, []), [
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
        initialize(frame, "kind", "variable", makeLiteralExpression("value")),
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
    lookup(next, frame, true, true, "variable", makeRead()),
    "intrinsic.aran.get('object', 'variable')",
  ),
);

assertSuccess(
  allignExpression(
    lookup(next, frame, true, true, "variable", makeTypeof()),
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
    lookup(next, frame, true, true, "variable", makeDiscard()),
    "false",
  ),
);

assertSuccess(
  allignEffect(
    lookup(
      next,
      frame,
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
