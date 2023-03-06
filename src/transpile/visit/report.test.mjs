import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import {
  locate,
  stringifyKey,
  makeSyntaxError,
  expectSyntax,
  makeSyntaxPropertyError,
  expectSyntaxPropertyEqual,
  expectSyntaxPropertyNotEqual,
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

assertEqual(stringifyKey(123), "[123]");

assertEqual(stringifyKey("key"), ".key");

assertEqual(stringifyKey("complex key"), '["complex key"]');

/////////////
// Generic //
/////////////

assertEqual(
  String(makeSyntaxError({ type: "Type" })),
  "SyntaxAranError: illegal node Type at ???",
);

assertEqual(expectSyntax(true, { type: "Type" }), undefined);

assertThrow(
  () => expectSyntax(false, { type: "Type" }),
  /^SyntaxAranError: illegal node Type at \?\?\?$/u,
);

/////////
// Key //
/////////

assertEqual(
  String(
    makeSyntaxPropertyError({ type: "Type", key1: { key2: "value" } }, [
      "key1",
      "key2",
    ]),
  ),
  'SyntaxAranError: illegal Type.key1.key2 at ???, got "value"',
);

assertEqual(
  expectSyntaxPropertyEqual(
    { type: "Type", key1: { key2: "value" } },
    ["key1", "key2"],
    "value",
  ),
  undefined,
);

assertEqual(
  expectSyntaxPropertyNotEqual(
    { type: "Type", key1: { key2: "actual" } },
    ["key1", "key2"],
    "expect",
  ),
  undefined,
);
