import { assertEqual } from "../test.fixture.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "./literal.mjs";

assertEqual(
  isRegExpLiteral({ type: "Literal", regex: { pattern: "", flags: "" } }),
  true,
);
assertEqual(isRegExpLiteral({ type: "Literal", value: 123 }), false);

assertEqual(isBigIntLiteral({ type: "Literal", bigint: "123" }), true);
assertEqual(isBigIntLiteral({ type: "Literal", value: 123 }), false);
