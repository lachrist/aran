import { map } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
} from "../../ast/index.mjs";
import { makeArrayExpression } from "../../intrinsic.mjs";
import { SPREAD } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";
import Spread from "./spread.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  ExpressionMemo,
  Expression: {
    ...Expression,
    ArrayExpression: (node, context, _site) =>
      makeApplyExpression(
        makeIntrinsicExpression("Array.prototype.flat"),
        makeArrayExpression(
          map(node.elements, partial_xx(visit, context, SPREAD)),
        ),
        [],
      ),
  },
  Spread,
});

test(
  `[123, ...456, 789];`,
  `
    {
      let _spread;
      void intrinsic.Array.prototype.flat(
        !intrinsic.Array.of(
          intrinsic.Array.of(123),
          (
            _spread = 456,
            (
              (
                intrinsic.aran.binary("===", _spread, null) ?
                true :
                intrinsic.aran.binary("===", _spread, undefined)
              ) ?
              false :
              intrinsic.aran.binary(
                "===",
                intrinsic.aran.unary(
                  "typeof",
                  insrinsic.aran.get(_spread, intrinsic.Symbol.iterator),
                ),
                "function",
              )
            ) ?
            intrinsic.Array.from(_spread) :
            intrinsic.aran.throw(
              new intrinsic.TypeError("value is not iterable"),
            )
          ),
          intrinsic.Array.of(789),
        ),
      );
    }
  `,
);

done();
