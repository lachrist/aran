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
testEffect(`"use strict"; x = 123;`, `{ [x] = 123; }`);
testEffect(
  `"use strict"; x++;`,
  `{ [x] = intrinsic.aran.binary("+", [x], 1); }`,
);
testEffect(`(123, 456);`, `{ void 123; void 456; }`);
