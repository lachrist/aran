import { assertThrow, assertEqual, assertDeepEqual } from "../__fixture__.mjs";

import {
  SyntaxAranError,
  EnclaveLimitationAranError,
  InvalidOptionAranError,
  inspect,
  inspectDeep,
  format,
  expect0,
  expect1,
  expect2,
  expect3,
  expect4,
  expectSuccess,
  expectDeadcode,
} from "./report.mjs";

const {
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

assertEqual(inspect("foo"), '"foo"');
assertEqual(inspect(123), "123");
assertEqual(inspect({}), "<object>");
assertEqual(
  inspect(() => {}),
  "<function>",
);

assertEqual(inspectDeep([123, [456], 789], 1), "[123, <array>, 789]");
assertEqual(
  inspectDeep({ foo: 123, bar: [456], qux: 789 }, 1),
  "{ foo:123, bar:<array>, qux:789 }",
);

assertThrow(() => format("%x", [123]), /^Error: invalid format marker/u);
assertEqual(format("%%%", []), "%%");
assertEqual(format("%s", ["foo"]), "foo");
assertEqual(format("%o", [123]), "123");
assertEqual(format("%v", [123]), "");
assertEqual(format("%j", [[123]]), "[123]");
assertEqual(format("%o", [() => {}]), "<function>");
assertEqual(format("%O", [new Error("foo")]), "Error: foo");
assertEqual(format("%1", [[123, [456], 789]]), "[123, <array>, 789]");

///////////////////
// expectSuccess //
///////////////////

assertEqual(
  apply(
    expectSuccess(
      /* eslint-disable no-restricted-syntax */
      function (...args) {
        assertEqual(this, "ctx");
        assertDeepEqual(args, ["arg0", "arg1"]);
        return "result";
      },
      /* eslint-enable no-restricted-syntax */
      Error,
      "template",
    ),
    "ctx",
    ["arg0", "arg1"],
  ),
  "result",
);

assertThrow(
  () =>
    apply(
      expectSuccess(
        () => {
          throw new Error("foo");
        },
        Error,
        "%o %o %o %o %o %O",
        1,
        2,
      ),
      3,
      [4, 5],
    ),
  {
    name: "Error",
    message: "1 2 3 4 5 Error: foo",
  },
);

////////////////////
// expectDeadcode //
////////////////////

assertThrow(
  () => apply(expectDeadcode(Error, "%o %o %o %o %o", 1, 2), 3, [4, 5]),
  {
    name: "Error",
    message: "1 2 3 4 5",
  },
);

////////////
// expect //
////////////

assertThrow(() => expect0(false, Error, "template"), /^Error: template$/u);

assertThrow(
  () => expect1(false, Error, "template %s", "val1"),
  /^Error: template val1$/u,
);

assertThrow(
  () => expect2(false, Error, "template %s %s", "val1", "val2"),
  /^Error: template val1 val2$/u,
);

assertThrow(
  () => expect3(false, Error, "template %s %s %s", "val1", "val2", "val3"),
  /^Error: template val1 val2 val3$/u,
);

assertThrow(
  () =>
    expect4(
      false,
      Error,
      "template %s %s %s %s",
      "val1",
      "val2",
      "val3",
      "val4",
    ),
  /^Error: template val1 val2 val3 val4$/u,
);
