import {assertSuccess} from "../../../__fixture__.mjs";

import {makeBlock, makeLiteralExpression} from "../../../ast/index.mjs";

import {
  allignBlock,
  allignEffect,
  allignExpression,
} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDelete, makeWrite} from "../right.mjs";

import {declare, initialize, create, lookup} from "./root-happy.mjs";

const {Error} = globalThis;

const next = () => {
  throw new Error("next should never be called");
};

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      declare(
        create(makeLiteralExpression("object")),
        "kind",
        "variable",
        null,
        [],
      ),
    ),
    "{}",
  ),
);

assertSuccess(
  allignEffect(
    initialize(
      create(makeLiteralExpression("object")),
      "kind",
      "variable",
      makeLiteralExpression("value"),
    ),
    `
      effect(
        intrinsic.aran.setStrict('object', 'variable', 'value'),
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
      makeDelete(),
    ),
    "false",
  ),
);

assertSuccess(
  allignEffect(
    lookup(
      next,
      create(makeLiteralExpression("object")),
      true,
      false,
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
