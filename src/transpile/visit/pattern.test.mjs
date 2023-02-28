import { map, flatMap } from "array-lite";
import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { partialx_xx } from "../../util/index.mjs";
import {
  makeEffectStatement,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";
import { testBlock } from "./__fixture__.mjs";
import PatternVisitor from "./pattern.mjs";

const test = (input, output) => {
  testBlock(
    "Block",
    input,
    "body/0",
    {
      visitors: {
        Block: {
          BlockStatement: (node, context1, _site) =>
            makeScopeTestBlock({ ...context1, strict: true }, (context2) =>
              flatMap(
                node.body,
                partialx_xx(visitMany, "Statement", context2, null),
              ),
            ),
        },
        Statement: {
          VariableDeclaration: (node, context, _site) => {
            assertEqual(node.declarations.length, 1);
            assertNotEqual(node.declarations[0].init, null);
            return visitMany("Pattern", node.declarations[0].id, context, {
              kind: node.kind,
              right: visit(
                "Expression",
                node.declarations[0].init,
                context,
                null,
              ),
            });
          },
          ExpressionStatement: (node, context, _site) => {
            assertEqual(node.expression.type, "AssignmentExpression");
            return map(
              visitMany("Pattern", node.expression.left, context, {
                kind: null,
                right: visit(
                  "Expression",
                  node.expression.right,
                  context,
                  null,
                ),
              }),
              makeEffectStatement,
            );
          },
        },
        Property: {
          Identifier: (node, _context, { computed }) => {
            assertEqual(computed, false);
            return makeLiteralExpression(node.name);
          },
        },
        Expression: {
          Literal: (node, _context, _site) => makeLiteralExpression(node.value),
        },
        ...PatternVisitor,
      },
    },
    null,
    output,
  );
};

test(
  `{ var [x = 123] = 456; }`,
  `
    {
      let right1, iterator, right2;
      right1 = 456;
      iterator = intrinsic.aran.get(right1, intrinsic.Symbol.iterator)(!right1);
      right2 = intrinsic.aran.get(iterator, "next")(!iterator);
      var [x] = (
        intrinsic.aran.binary("===", right2, undefined) ?
        123 :
        right2
      );
    }
  `,
);

test(`{ x = 123; }`, `{ [x] = 123; }`);

test(
  `{ (123).foo = 789; }`,
  `
    {
      let right;
      right = 789;
      void intrinsic.aran.setStrict(123, "foo", right);
    }
  `,
);

test(
  `{ [x1, x2, ...xs] = 123; }`,
  `
    {
      let right, iterator;
      right = 123;
      iterator = intrinsic.aran.get(right, intrinsic.Symbol.iterator)(!right);
      [x1] = intrinsic.aran.get(iterator, "next")(!iterator);
      [x2] = intrinsic.aran.get(iterator, "next")(!iterator);
      [xs] = intrinsic.Array.from(iterator);
    }
  `,
);

test(
  `{ ({foo:x, bar:y} = 123); }`,
  `
    {
      let right;
      right = 123;
      void (
        (
          intrinsic.aran.binary("===", right, null) ?
          true :
          intrinsic.aran.binary("===", right, undefined)
        ) ?
        intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot destructure 'undefined' or 'null'",
          ),
        ) :
        undefined
      );
      [x] = intrinsic.aran.get(right, "foo");
      [y] = intrinsic.aran.get(right, "bar");
    }
  `,
);

test(
  `{ ({foo:x, bar:y, ...rest} = 123); }`,
  `
    {
      let right, key1, key2, rest;
      right = 123;
      void (
        (
          intrinsic.aran.binary("===", right, null) ?
          true :
          intrinsic.aran.binary("===", right, undefined)
        ) ?
        intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot destructure 'undefined' or 'null'",
          ),
        ) :
        undefined
      );
      [x] = intrinsic.aran.get(
        right,
        (key1 = "foo", key1),
      );
      [y] = intrinsic.aran.get(
        right,
        (key2 = "bar", key2),
      );
      rest = intrinsic.Object.assign(
        intrinsic.aran.createObject(intrinsic.Object.prototype),
        right,
      );
      void intrinsic.aran.deleteStrict(rest, key1);
      void intrinsic.aran.deleteStrict(rest, key2);
      [rest] = rest;
    }
  `,
);
