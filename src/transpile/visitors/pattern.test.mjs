import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { EXPRESSION, PATTERN } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMacro,
  compileTest,
} from "./__fixture__.mjs";
import PatternElement from "./pattern-element.mjs";
import PatternProperty from "./pattern-property.mjs";
import Pattern from "./pattern.mjs";

const { test, done } = compileTest({
  Program,
  Statement: {
    ...Statement,
    VariableDeclaration: (node, context, _site) => {
      assertEqual(node.declarations.length, 1);
      assertNotEqual(node.declarations[0].init, null);
      return visit(node.declarations[0].id, context, {
        ...PATTERN,
        kind: node.kind,
        right: visit(node.declarations[0].init, context, EXPRESSION),
      });
    },
  },
  Effect: {
    ...Effect,
    AssignmentExpression: (node, context, _site) => {
      assertEqual(node.operator, "=");
      return visit(node.left, context, {
        ...PATTERN,
        right: visit(node.right, context, EXPRESSION),
      });
    },
  },
  Expression,
  ExpressionMacro,
  PatternElement,
  PatternProperty,
  Pattern,
});

test(
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

test(`"use strict"; x = 123;`, `{ [x] = 123; }`);

test(
  `(123)[456] = 789;`,
  `
    {
      let right;
      right = 789;
      void intrinsic.aran.setSloppy(123, 456, right);
    }
  `,
);

test(
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

test(
  `"use strict"; ({[123]:x, [456]:y} = 789);`,
  `
    {
      let right;
      right = 789;
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
      [x] = intrinsic.aran.get(right, 123);
      [y] = intrinsic.aran.get(right, 456);
    }
  `,
);

test(
  `"use strict"; ({[123]:x, [456]:y, ...rest} = 789);`,
  `
    {
      let right, key1, key2, rest;
      right = 789;
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
      [x] = intrinsic.aran.get(right, (key1 = 123, key1));
      [y] = intrinsic.aran.get(right, (key2 = 456, key2));
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

done();
