import {
  assertThrow,
  assertEqual,
  assertDeepEqual,
  generateAssertUnreachable,
} from "./__fixture__.mjs";

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
  generateSwitch0,
  generateSwitch1,
  generateSwitch2,
  hasOwnProperty,
  pop,
  push,
  makeCurry,
  callCurry,
  extendCurry,
  getLast,
  mapCurry,
  findCurry,
  forEachCurry,
  filterOutCurry,
  getUUID,
  getLatestUUID,
} from "./util.mjs";

const {Error, undefined} = globalThis;

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

////////////////////
// generateSwitch //
////////////////////

assertEqual(
  generateSwitch0({
    type: (...args) => {
      assertDeepEqual(args, [{type: "type"}]);
      return "result";
    },
  })({type: "type"}, "arg1", "arg2"),
  "result",
);

assertEqual(
  generateSwitch1({
    type: (...args) => {
      assertDeepEqual(args, [{type: "type"}, "arg1"]);
      return "result";
    },
  })({type: "type"}, "arg1", "arg2"),
  "result",
);

assertEqual(
  generateSwitch2({
    type: (...args) => {
      assertDeepEqual(args, [{type: "type"}, "arg1", "arg2"]);
      return "result";
    },
  })({type: "type"}, "arg1", "arg2"),
  "result",
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

////////////
// Object //
////////////

assertEqual(hasOwnProperty({key: "value"}, "key"), true);
assertEqual(hasOwnProperty({__proto__: {key: "value"}}, "key"), false);

///////////
// Curry //
///////////

assertDeepEqual(
  callCurry(
    extendCurry(
      makeCurry((...args) => args, 1, 2, 3),
      4,
      5,
      6,
    ),
    7,
    8,
    9,
  ),
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
);

///////////
// Array //
///////////

assertEqual(getLast(["element1", "element2"]), "element2");

{
  const array = ["element1", "element2"];
  assertEqual(pop(array), "element2");
  assertDeepEqual(array, ["element1"]);
}

{
  const array = ["element1"];
  assertEqual(push(array, "element2"), undefined);
  assertDeepEqual(array, ["element1", "element2"]);
}

assertEqual(
  findCurry(
    ["element"],
    makeCurry((...args) => {
      assertDeepEqual(args, ["curry", "element", 0, ["element"]]);
      return true;
    }, "curry"),
  ),
  "element",
);

assertEqual(
  findCurry(
    [],
    makeCurry(generateAssertUnreachable("should not be called"), "curry"),
  ),
  null,
);

assertDeepEqual(
  mapCurry(
    ["element"],
    makeCurry((...args) => args, "curry"),
  ),
  [["curry", "element", 0, ["element"]]],
);

assertDeepEqual(
  filterOutCurry(
    [1, 2, 3, 4],
    makeCurry((curry, element, index, elements, ...rest) => {
      assertEqual(curry, "curry");
      assertEqual(element, index + 1);
      assertDeepEqual(elements, [1, 2, 3, 4]);
      assertDeepEqual(rest, []);
      return element > 2;
    }, "curry"),
  ),
  [1, 2],
);

{
  let sum = 0;
  assertEqual(
    forEachCurry(
      [1, 2, 3],
      makeCurry((curry, element, index, elements, ...rest) => {
        assertEqual(curry, "curry");
        assertEqual(element, index + 1);
        assertDeepEqual(elements, [1, 2, 3]);
        assertDeepEqual(rest, []);
        sum += element;
      }, "curry"),
    ),
    undefined,
  );
  assertEqual(sum, 6);
}

//////////
// uuid //
//////////

assertEqual(getUUID(), getLatestUUID());
