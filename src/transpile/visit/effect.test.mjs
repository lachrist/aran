import TestVisitor, { test } from "./__fixture__.mjs";
import PropertyVisitor from "./property.mjs";
import PatternVisitor from "./pattern.mjs";
import AssignmentVisitor from "./assignment.mjs";
import UpdateVisitor from "./update.mjs";
import EffectVisitor from "./effect.mjs";

const Visitor = {
  ...TestVisitor,
  ...PropertyVisitor,
  ...PatternVisitor,
  ...AssignmentVisitor,
  ...UpdateVisitor,
  ...EffectVisitor,
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
testEffect(
  `123 && (456, 789, 0);`,
  `{ 123 ? (void 456, (void 789, void 0)) : void undefined; }`,
);
testEffect(
  `123 || (456, 789, 0);`,
  `{ 123 ? void undefined : (void 456, (void 789, void 0)); }`,
);
testEffect(
  `123 ?? (456, 789, 0);`,
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
        (void 456, (void 789, void 0)) :
        void undefined
      );
    }
  `,
);

// ConditionalExpression //
testEffect(
  `1 ? (2,3,4) : (5,6,7);`,
  `{ 1 ? (void 2, (void 3, void 4)) : (void 5, (void 6, void 7)); }`,
);
