import {assertThrow, assertEqual, assertDeepEqual} from "./__fixture__.mjs";

import {
  assert,
  generateDeadClosure,
  inspect,
  format,
  expect,
  expectSuccess,
} from "./util.mjs";

const {Error} = globalThis;

assertThrow(() => assert(false, "foo"), /^Error: foo/u);

assertThrow(generateDeadClosure("foo"));

assertEqual(inspect("foo"), '"foo"');
assertEqual(inspect(123), "123");
assertEqual(inspect({}), "[object Object]");

assertThrow(() => format("%x", [123]), /^Error: invalid format marker/u);
assertEqual(format("%%%", []), "%%");
assertEqual(format("%s", ["foo"]), "foo");
assertEqual(format("%o", [123]), "123");
assertEqual(format("%j", [[123]]), "[123]");
assertEqual(format("%e", [new Error("foo")]), "foo");

assertThrow(() => expect(false, Error, "%s", ["foo"]), /^Error: foo/u);

assertEqual(
  expectSuccess(
    /* eslint-disable no-restricted-syntax */
    function (...args) {
      assertEqual(this, "ctx");
      assertDeepEqual(args, ["arg0", "arg1"]);
      return "result";
    },
    /* eslint-enable no-restricted-syntax */
    "ctx",
    ["arg0", "arg1"],
    Error,
    "%e",
    [],
  ),
  "result",
);
assertThrow(
  () =>
    expectSuccess(
      () => {
        throw new Error("foo");
      },
      null,
      [],
      Error,
      "%e",
      [],
    ),
  /Error: foo/u,
);
