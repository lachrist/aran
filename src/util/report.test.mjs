import { map, join, forEach, concat, flatMap } from "array-lite";
import { assertThrow, assertEqual } from "../__fixture__.mjs";
import {
  SyntaxAranError,
  EnclaveLimitationAranError,
  InvalidOptionAranError,
  inspect,
  format,
  expect0,
  expect1,
  expect2,
  expect3,
  expect4,
  expect5,
  // expectSuccess,
  // expectDeadcode,
} from "./report.mjs";

const {
  Array,
  String,
  undefined,
  RegExp,
  Error,
  Reflect: { apply },
} = globalThis;

const testError = (Constructor) => {
  const error = new Constructor("message");
  assertEqual(error.name, Constructor.name);
  assertEqual(error.message, "message");
};

testError(SyntaxAranError);
testError(EnclaveLimitationAranError);
testError(InvalidOptionAranError);

/////////////
// Inspect //
/////////////

assertEqual(inspect("foo", 0), '"foo"');
assertEqual(inspect(123, 0), "123");
/* eslint-disable no-restricted-syntax */
assertEqual(
  inspect(function f() {}, 0),
  "<function>",
);
assertEqual(
  inspect(function () {}, 1),
  "<function>",
);
assertEqual(
  inspect(function f() {}, 1),
  "<function f>",
);
/* eslint-enable no-restricted-syntax */
assertEqual(inspect([123], 0), "<array>");
assertEqual(inspect([123, [456], 789], 1), "[123, <array>, 789]");
assertEqual(inspect({ foo: 123 }, 0), "<object>");
assertEqual(
  inspect({ foo: 123, bar: [456], qux: 789 }, 1),
  "{ foo:123, bar:<array>, qux:789 }",
);

////////////
// Format //
////////////

assertEqual(format("%xbar%x", ["foo", "qux"]), "foobarqux");
assertEqual(format("%x%x%x", ["foo", "bar", "qux"]), "foobarqux");
assertThrow(() => format("%x", []), /^AssertionError: missing format value$/u);
assertThrow(
  () => format("", ["foo"]),
  /^AssertionError: missing format marker$/u,
);

////////////
// expect //
////////////

{
  const toExpectEntry = (_element, index) => [
    (val) => `${val}-${String(index)}`,
    `val-${String(index)}`,
  ];
  const toExpectMarker = (_element, _index) => " %x";
  const toExpectResult = (_element, index) =>
    ` val-${String(index)}-${String(index)}`;
  forEach([expect0, expect1, expect2, expect3, expect4, expect5], (expect) => {
    const ruler = new Array((expect.length - 3) / 2);
    const template = `template${join(map(ruler, toExpectMarker), "")}`;
    assertThrow(
      () =>
        apply(
          expect,
          undefined,
          concat([false, Error, template], flatMap(ruler, toExpectEntry)),
        ),
      new RegExp(
        `^Error: template${join(map(ruler, toExpectResult), "")}$`,
        "u",
      ),
    );
    assertEqual(
      apply(
        expect,
        undefined,
        concat([true, Error, template], flatMap(ruler, toExpectEntry)),
      ),
      undefined,
    );
  });
}
