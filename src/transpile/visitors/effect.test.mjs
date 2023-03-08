import {
  Program,
  Statement,
  Expression,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";
import AssignmentEffect from "./assignment-effect.mjs";
import UpdateEffect from "./update-effect.mjs";
import Effect from "./effect.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMemo,
  AssignmentEffect,
  UpdateEffect,
});

// __Default__ //
test(`123;`, `{ void 123; }`);

// AssignmentExpression //
test(`"use strict"; x = 123;`, `{ [x] = 123; }`);

// UpdateExpression //
test(`"use strict"; x++;`, `{ [x] = intrinsic.aran.binary("+", [x], 1); }`);

// SequenceExpression //
test(`(123, 456);`, `{ void 123; void 456; }`);
test(`(123, 456);`, `{ void 123; void 456; }`);

// LogicalExpression //
test(`123 && 456;`, `{ 123 ? void 456 : undefined; }`);
test(`123 || 456;`, `{ 123 ? undefined : void 456; }`);
test(
  `123 ?? 456;`,
  `
    {
      let left;
      left = 123;
      (
        (
          intrinsic.aran.binary("===", left, null) ?
          true :
          intrinsic.aran.binary("===", left, undefined)
        ) ?
        void 456 :
        undefined
      );
    }
  `,
);

// ConditionalExpression //
test(`123 ? 456 : 789;`, `{ 123 ? void 456 : void 789; }`);

done();
