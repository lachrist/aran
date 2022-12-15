import { assertThrow, assertEqual, assertDeepEqual } from "../__fixture__.mjs";

import {
  inspect,
  format,
  expect,
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

assertThrow(() => expect(false, Error, "%s", ["foo"]), /^Error: foo/u);

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

assertThrow(
  () => apply(expectDeadcode(Error, "%o %o %o %o %o", 1, 2), 3, [4, 5]),
  {
    name: "Error",
    message: "1 2 3 4 5",
  },
);
