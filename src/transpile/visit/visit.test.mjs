import { assertDeepEqual } from "../../__fixture__.mjs";

import { makeLiteralExpression } from "../../ast/index.mjs";

import { createCounter } from "../../util/index.mjs";

import { createContext } from "./context.mjs";

import { applyVisitor, applyArrayVisitor } from "./visit.mjs";

const test = (lift, apply) => {
  const root = {
    evals: {},
    nodes: [],
    counter: createCounter(0),
  };
  assertDeepEqual(
    apply(
      {
        type: (node, context, specific) => {
          assertDeepEqual(node, { type: "type" });
          assertDeepEqual(context, createContext(root));
          assertDeepEqual(specific, { foo: "BAR", qux: "buz" });
          return lift(makeLiteralExpression(123));
        },
      },
      {
        foo: "bar",
        qux: "buz",
      },
      { type: "type" },
      createContext(root),
      { foo: "BAR" },
    ),
    lift(makeLiteralExpression(123, 0)),
  );
};

test((node) => node, applyVisitor);

test((node) => [node], applyArrayVisitor);
