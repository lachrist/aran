import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import {
  locate,
  makeValueSyntaxError,
  expectSyntaxValue,
  makeTypeSyntaxError,
  expectSyntaxType,
} from "./report.mjs";

const { String, undefined } = globalThis;

////////////
// locate //
////////////

assertEqual(locate({}), "???");

assertEqual(locate({ loc: { start: { line: 123, column: 456 } } }), "123:456");

assertEqual(
  locate({ loc: { source: "source", start: { line: 123, column: 456 } } }),
  "source:123:456",
);

//////////
// type //
//////////

assertEqual(
  String(makeTypeSyntaxError({ type: "Type" })),
  "SyntaxAranError: illegal node at ???, got a Type",
);

assertEqual(expectSyntaxType({ type: "Type" }, "Type"), undefined);

assertThrow(
  () => expectSyntaxType({ type: "Actual" }, "Expect"),
  /^SyntaxAranError: illegal node at \?\?\?, it should be a Expect but got a Actual$/u,
);

///////////
// value //
///////////

assertEqual(
  String(makeValueSyntaxError({ type: "Type", property: "value" }, "property")),
  'SyntaxAranError: illegal Type.property at ???, got "value"',
);

assertEqual(
  expectSyntaxValue({ type: "Type", property: "value" }, "property", "value"),
  undefined,
);

assertThrow(
  () =>
    expectSyntaxValue(
      {
        type: "Type",
        property: "actual",
      },
      "property",
      "expect",
    ),
  /^SyntaxAranError: illegal Type.property at \?\?\?, it should be "expect" but got "actual"$/u,
);
