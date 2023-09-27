import { assertEqual } from "../../__fixture__.mjs";
import { makeApplyExpression } from "../../ast/index.mjs";
import { CALLEE } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";
import Callee from "./callee.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  ExpressionMemo,
  Expression: {
    ...Expression,
    CallExpression: (node, context, _site) => {
      assertEqual(node.arguments.length, 0);
      const { callee: expression1, this: expression2 } = visit(
        node.callee,
        context,
        CALLEE,
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
      let _this;
      void (
        _this = 123,
        intrinsic.aran.get(_this, 456)
      )(!_this);
    }
  `,
);

test(
  `((123)?.[456])();`,
  `
    {
      let _this;
      void (
        (
          _this = 123,
          (
            (
              intrinsic.aran.binary("===", _this, null) ?
              true :
              intrinsic.aran.binary("===", _this, undefined)
            ) ?
            undefined :
            intrinsic.aran.get(_this, 456)
          )
        )(!_this)
      );
    }
  `,
);

done();
