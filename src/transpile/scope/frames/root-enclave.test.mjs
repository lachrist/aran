import {forEach, map} from "array-lite";

import {assertSuccess} from "../../../__fixture__.mjs";

import {makeBlock, makeLiteralExpression} from "../../../ast/index.mjs";

import {
  allignBlock,
  allignEffect,
  allignExpression,
} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

import {declare, initialize, create, lookup} from "./root-enclave.mjs";

const {
  Error,
  Object: {fromEntries},
} = globalThis;

const next = () => {
  throw new Error("next should never be called");
};

const frame = create(
  "layer",
  fromEntries(
    map(["read", "typeof", "discard", "write"], (name) => [
      name,
      {
        strict: makeLiteralExpression(`${name}-strict`),
        sloppy: makeLiteralExpression(`${name}-sloppy`),
      },
    ]),
  ),
);

assertSuccess(
  allignBlock(
    makeBlock([], [], declare(frame, "var", "variable", null, [])),
    "{}",
  ),
);

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      initialize(frame, "var", "variable", makeLiteralExpression("value")),
    ),
    "{ var variable = 'value'; }",
  ),
);

forEach(
  [
    [makeRead(), "read"],
    [makeTypeof(), "typeof"],
    [makeDiscard(), "discard"],
  ],
  ([right, name]) => {
    forEach([true, false], (strict) => {
      assertSuccess(
        allignExpression(
          lookup(next, frame, strict, true, "variable", right),
          `('${name}-${strict ? "strict" : "sloppy"}')('variable')`,
        ),
      );
    });
  },
);

forEach([true, false], (strict) => {
  assertSuccess(
    allignEffect(
      lookup(
        next,
        frame,
        strict,
        true,
        "variable",
        makeWrite(makeLiteralExpression("value")),
      ),
      `
        effect(
          ('write-${strict ? "strict" : "sloppy"}')('variable', 'value'),
        )
      `,
    ),
  );
});
