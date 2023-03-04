import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import PatternVisitor from "./pattern.mjs";

const Visitor = {
  ...TestVisitor,
  ...KeyVisitor,
  ...PatternVisitor,
  Statement: {
    ...TestVisitor.Statement,
    VariableDeclaration: (node, context, _site) => {
      assertEqual(node.declarations.length, 1);
      assertNotEqual(node.declarations[0].init, null);
      return visit(node.declarations[0].id, context, {
        type: "Pattern",
        kind: node.kind,
        right: visit(node.declarations[0].init, context, {
          type: "Expression",
          name: "",
        }),
      });
    },
  },
  Effect: {
    ...TestVisitor.Effect,
    AssignmentExpression: (node, context, _site) => {
      assertEqual(node.operator, "=");
      return visit(node.left, context, {
        type: "Pattern",
        kind: null,
        right: visit(node.right, context, { type: "Expression", name: "" }),
      });
    },
  },
};

const testPattern = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testPattern(
  `"use strict"; var [x = 123] = 456;`,
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

testPattern(`"use strict"; x = 123;`, `{ [x] = 123; }`);

testPattern(
  `(123)[456] = 789;`,
  `
    {
      let right;
      right = 789;
      void intrinsic.aran.setSloppy(123, 456, right);
    }
  `,
);

testPattern(
  `"use strict"; [x1, x2, ...xs] = 123;`,
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

testPattern(
  `"use strict"; ({foo:x, bar:y} = 123);`,
  `
    {
      let right;
      right = 123;
      (
        (
          intrinsic.aran.binary("===", right, null) ?
          true :
          intrinsic.aran.binary("===", right, undefined)
        ) ?
        void intrinsic.aran.throw(
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

testPattern(
  `"use strict"; ({foo:x, bar:y, ...rest} = 123);`,
  `
    {
      let right, key1, key2, rest;
      right = 123;
      (
        (
          intrinsic.aran.binary("===", right, null) ?
          true :
          intrinsic.aran.binary("===", right, undefined)
        ) ?
        void intrinsic.aran.throw(
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
