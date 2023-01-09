import { assertThrow, assertEqual, assertDeepEqual } from "../__fixture__.mjs";

import {
  inspect,
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

assertEqual(inspect("foo"), '"foo"');
assertEqual(inspect(123), "123");
assertEqual(inspect({}), "[object Object]");

assertThrow(() => format("%x", [123]), /^Error: invalid format marker/u);
assertEqual(format("%%%", []), "%%");
assertEqual(format("%s", ["foo"]), "foo");
assertEqual(format("%o", [123]), "123");
assertEqual(format("%v", [123]), "");
assertEqual(format("%j", [[123]]), "[123]");
assertEqual(format("%e", [new Error("foo")]), "foo");

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
        "%o %o %o %o %o %e",
        1,
        2,
      ),
      3,
      [4, 5],
    ),
  {
    name: "Error",
    message: "1 2 3 4 5 foo",
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
