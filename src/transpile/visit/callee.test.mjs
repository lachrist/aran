import { assertEqual } from "../../__fixture__.mjs";
import { makeApplyExpression } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import Callee from "./callee.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    ...Expression,
    CallExpression: (node, context, _site) => {
      assertEqual(node.arguments.length, 0);
      const { callee: expression1, this: expression2 } = visit(
        node.callee,
        context,
        {
          type: "Callee",
        },
      );
      return makeApplyExpression(expression1, expression2, []);
    },
  },
  Callee,
});

test(`(123)();`, `{ void (123)(); }`);

test(`super[123]();`, `{ void ("super.get")(123)(!"this"); }`);

test(
  `(123)[456]();`,
  `
    {
      let callee_this;
      void (
        callee_this = 123,
        intrinsic.aran.get(callee_this, 456)
      )(!callee_this);
    }
  `,
);

test(
  `((123)?.[456])();`,
  `
    {
      let callee_this;
      void (
        callee_this = 123,
        (
          (
            intrinsic.aran.binary("===", callee_this, null) ?
            true :
            intrinsic.aran.binary("===", callee_this, undefined)
          ) ?
          undefined :
          intrinsic.aran.get(callee_this, 456)
        )
      )(!callee_this);
    }
  `,
);

done();
