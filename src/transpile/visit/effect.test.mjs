import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import AssignmentEffectVisitor from "./assignment-effect.mjs";
import UpdateEffectVisitor from "./update-effect.mjs";
import EffectVisitor from "./effect.mjs";

const Visitor = {
  ...TestVisitor,
  Key: KeyVisitor,
  AssignmentEffect: AssignmentEffectVisitor,
  UpdateEffect: UpdateEffectVisitor,
  Effect: EffectVisitor,
};

const testEffect = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testEffect(`123;`, `{ void 123; }`);

// AssignemntExpression //
testEffect(`"use strict"; x = 123;`, `{ [x] = 123; }`);

// UpdateExpression //
testEffect(
  `"use strict"; x++;`,
  `{ [x] = intrinsic.aran.binary("+", [x], 1); }`,
);

// SequenceExpression //
testEffect(`(123, 456);`, `{ void 123; void 456; }`);
testEffect(`(123, 456);`, `{ void 123; void 456; }`);

// LogicalExpression //
testEffect(`123 && 456;`, `{ 123 ? void 456 : undefined; }`);
testEffect(`123 || 456;`, `{ 123 ? undefined : void 456; }`);
testEffect(
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
testEffect(`123 ? 456 : 789;`, `{ 123 ? void 456 : void 789; }`);
