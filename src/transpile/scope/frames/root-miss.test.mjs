import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {allignEffect, allignExpression} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

import {create, lookup} from "./root-miss.mjs";

const {Error} = globalThis;

const next = () => {
  throw new Error("next should never be called");
};

const frame = create("layer", {dynamic: makeLiteralExpression("object")});

assertSuccess(
  allignExpression(
    lookup(next, frame, true, true, "variable", makeRead()),
    `
      intrinsic.aran.throw(
        new intrinsic.ReferenceError('variable is not defined'),
      )
    `,
  ),
);

assertSuccess(
  allignExpression(
    lookup(next, frame, true, true, "variable", makeTypeof()),
    "'undefined'",
  ),
);

assertSuccess(
  allignExpression(
    lookup(next, frame, true, true, "variable", makeDiscard()),
    "true",
  ),
);

assertSuccess(
  allignEffect(
    lookup(
      next,
      frame,
      true,
      true,
      "variable",
      makeWrite(makeLiteralExpression("right")),
    ),
    `
      effect(
        intrinsic.aran.throw(
          new intrinsic.ReferenceError('variable is not defined'),
        ),
      )
    `,
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
        intrinsic.aran.setSloppy('object', 'variable', 'value'),
      )
    `,
  ),
);
