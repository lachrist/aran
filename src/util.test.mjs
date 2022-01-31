import {assertThrow, assertEqual, assertDeepEqual} from "./__fixture__.mjs";

import {
  assert,
  inspect,
  format,
  expect,
  expectSuccess,
  incrementCounter,
  createCounter,
  bind,
  returnFirst,
  returnSecond,
  returnThird,
  returnFourth,
  returnFifth,
  generateReturn,
  dropFirst,
  generateThrowError,
  mapContext,
} from "./util.mjs";

const {Error} = globalThis;

///////////////
// Assertion //
///////////////

assertThrow(() => assert(false, "foo"), /^Error: foo/u);

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

/////////////
// Counter //
/////////////

assertEqual(incrementCounter(createCounter()), 1);

//////////////
// Function //
//////////////

assertEqual(
  bind(
    (x) => 2 * x,
    (x) => x + 1,
  )(2),
  6,
);

assertEqual(returnFirst(1), 1);
assertEqual(returnSecond(1, 2), 2);
assertEqual(returnThird(1, 2, 3), 3);
assertEqual(returnFourth(1, 2, 3, 4), 4);
assertEqual(returnFifth(1, 2, 3, 4, 5), 5);

assertEqual(generateReturn(123)(), 123);

assertDeepEqual(dropFirst((...xs) => xs)(1, 2, 3), [2, 3]);

assertThrow(generateThrowError("foo"));

///////////
// Array //
///////////

assertDeepEqual(
  mapContext(["element"], (...args) => args, "context"),
  [["context", "element", 0, ["element"]]],
);
