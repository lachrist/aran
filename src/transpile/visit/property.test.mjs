import { testExpression } from "./__fixture__.mjs";
import PropertyVisitor from "./property.mjs";

const testProperty = (input, output) =>
  testExpression(
    "property",
    input,
    "body/0/expression",
    { property: PropertyVisitor },
    {},
    null,
    output,
  );

testProperty(`"key";`, `"key"`);

testProperty(`key;`, `"key"`);
