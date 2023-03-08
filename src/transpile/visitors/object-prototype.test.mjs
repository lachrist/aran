import { makeExpressionEffect } from "../../ast/index.mjs";
import { OBJECT_PROTOTYPE } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Expression,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";
import ObjectPrototype from "./object-prototype.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect: {
    __ANNOTATE__: (node, _serial) => node,
    __DEFAULT__: (node, context, _site) => [
      makeExpressionEffect(visit(node, context, OBJECT_PROTOTYPE)),
    ],
  },
  ExpressionMemo,
  ObjectPrototype,
  Expression,
});

test(`null;`, `{ void null }`);

test(`123;`, `{ void intrinsic.Object.prototype; }`);

test(
  `this;`,
  `
    {
      let prototype;
      void (
        prototype = "ThisExpression",
        (
          (
            intrinsic.aran.binary(
              "===",
              intrinsic.aran.unary("typeof", prototype),
              "object",
            ) ?
            true :
            intrinsic.aran.binary(
              "===",
              intrinsic.aran.unary("typeof", prototype),
              "function",
            )
          ) ?
          prototype :
          intrinsic.Object.prototype
        )
      );
    }
  `,
);

done();
