import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import {
  locate,
  stringifyProperty,
  makeSyntaxTypeError,
  expectSyntaxType,
  makeSyntaxError,
  makeSyntaxErrorDeep,
  expectSyntaxEqual,
  expectSyntaxEqualDeep,
  expectSyntaxNotEqual,
  expectSyntaxNotEqualDeep,
} from "./report.mjs";

const { String, undefined } = globalThis;

////////////
// Helper //
////////////

assertEqual(locate({}), "???");

assertEqual(locate({ loc: { start: { line: 123, column: 456 } } }), "123:456");

assertEqual(
  locate({ loc: { source: "source", start: { line: 123, column: 456 } } }),
  "source:123:456",
);

assertEqual(stringifyProperty(123), "[123]");

assertEqual(stringifyProperty("foo"), ".foo");

assertEqual(stringifyProperty("foo bar"), '["foo bar"]');

//////////
// Type //
//////////

assertEqual(
  String(makeSyntaxTypeError({ type: "Type" })),
  "SyntaxAranError: illegal node at ???, got a Type",
);

assertEqual(expectSyntaxType({ type: "Type" }, "Type"), undefined);

assertThrow(
  () => expectSyntaxType({ type: "Actual" }, "Expect"),
  /^SyntaxAranError: illegal node at \?\?\?, it should be a Expect but got a Actual$/u,
);

///////////
// Value //
///////////

assertEqual(
  String(makeSyntaxError({ type: "Type", property: "value" }, "property")),
  'SyntaxAranError: illegal Type.property at ???, got "value"',
);

assertEqual(
  String(
    makeSyntaxErrorDeep(
      { type: "Type", property1: { property2: "value" } },
      "property1",
      "property2",
    ),
  ),
  'SyntaxAranError: illegal Type.property1.property2 at ???, got "value"',
);

assertEqual(
  expectSyntaxEqual({ type: "Type", property: "value" }, "property", "value"),
  undefined,
);

assertEqual(
  expectSyntaxEqualDeep(
    { type: "Type", property1: { property2: "value" } },
    "property1",
    "property2",
    "value",
  ),
  undefined,
);

assertEqual(
  expectSyntaxNotEqual(
    { type: "Type", property: "actual" },
    "property",
    "expect",
  ),
  undefined,
);

assertEqual(
  expectSyntaxNotEqualDeep(
    { type: "Type", property1: { property2: "actual" } },
    "property1",
    "property2",
    "expect",
  ),
  undefined,
);

// assertThrow(
//   () =>
//     expectSyntaxEqual(
//       {
//         type: "Type",
//         property: "actual",
//       },
//       "property",
//       "expect",
//     ),
//   /^SyntaxAranError: illegal Type.property at \?\?\?, it should be "expect" but got "actual"$/u,
// );
