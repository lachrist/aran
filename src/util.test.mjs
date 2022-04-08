import {slice} from "array-lite";

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
  dropFirst,
  throwError,
  switch0,
  switch1,
  switch2,
  hasOwnProperty,
  getLast,
  pop,
  push,
  getUUID,
  getLatestUUID,
  flip,
  partial,
  partial1,
  partial2,
  partial3,
  partial4,
  partial5,
} from "./util.mjs";

const {
  Error,
  undefined,
  Reflect: {defineProperty, apply},
} = globalThis;

const generateReturnArguments = (length) => {
  const f = (...xs) => xs;
  defineProperty(f, "length", {value: length});
  return f;
};

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
  switch0(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}]);
        return "result";
      },
    },
    {type: "type"},
    "arg1",
    "arg2",
  ),
  "result",
);

assertEqual(
  switch1(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}, "arg1"]);
        return "result";
      },
    },
    {type: "type"},
    "arg1",
    "arg2",
  ),
  "result",
);

assertEqual(
  switch2(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}, "arg1", "arg2"]);
        return "result";
      },
    },
    {type: "type"},
    "arg1",
    "arg2",
  ),
  "result",
);

/////////////
// Counter //
/////////////

assertEqual(incrementCounter(createCounter()), 1);

//////////////
// Function //
//////////////

assertDeepEqual(flip(generateReturnArguments(0))(0), []);
assertDeepEqual(flip(generateReturnArguments(1))(1), [undefined]);
assertDeepEqual(flip(generateReturnArguments(2))(1, 2), [2, 1]);
assertDeepEqual(flip(generateReturnArguments(3))(1, 2, 3), [2, 1, 3]);
assertDeepEqual(flip(generateReturnArguments(4))(1, 2, 3, 4), [2, 1, 3, 4]);
assertDeepEqual(
  flip(generateReturnArguments(5))(1, 2, 3, 4, 5),
  [2, 1, 3, 4, 5],
);
assertThrow(() => flip(generateReturnArguments(6)));

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

assertDeepEqual(dropFirst((...xs) => xs)(1, 2, 3), [2, 3]);

assertThrow(() => throwError("foo"));

////////////
// Object //
////////////

assertEqual(hasOwnProperty({key: "value"}, "key"), true);
assertEqual(hasOwnProperty({__proto__: {key: "value"}}, "key"), false);

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

/////////////
// Partial //
/////////////

assertDeepEqual(partial((...xs) => xs, 1, 2, 3)(4, 5, 6), [1, 2, 3, 4, 5, 6]);

{
  const partials = [partial1, partial2, partial3, partial4, partial5];
  for (let index1 = 1; index1 <= 5; index1 += 1) {
    const partialX = partials[index1 - 1];
    assertThrow(() => partialX(generateReturnArguments(0), 1, 2, 3, 4, 5));
    for (let index2 = index1; index2 <= 5; index2 += 1) {
      assertDeepEqual(
        apply(
          partialX(generateReturnArguments(index2), 1, 2, 3, 4, 5),
          undefined,
          slice([1, 2, 3, 4, 5], index1, 5),
        ),
        slice([1, 2, 3, 4, 5], 0, index2),
      );
    }
  }
}

//////////
// uuid //
//////////

assertEqual(getUUID(), getLatestUUID());

// ///////////
// // Curry //
// ///////////
//
// assertDeepEqual(
//   callCurry(
//     extendCurry(
//       makeCurry((...args) => args, 1, 2, 3),
//       4,
//       5,
//       6,
//     ),
//     7,
//     8,
//     9,
//   ),
//   [1, 2, 3, 4, 5, 6, 7, 8, 9],
// );
//
// assertEqual(
//   findCurry(
//     ["element"],
//     makeCurry((...args) => {
//       assertDeepEqual(args, ["curry", "element", 0, ["element"]]);
//       return true;
//     }, "curry"),
//   ),
//   "element",
// );
//
// assertEqual(
//   findCurry(
//     [],
//     makeCurry(generateAssertUnreachable("should not be called"), "curry"),
//   ),
//   null,
// );
//
// assertDeepEqual(
//   mapCurry(
//     ["element"],
//     makeCurry((...args) => args, "curry"),
//   ),
//   [["curry", "element", 0, ["element"]]],
// );
//
// assertDeepEqual(
//   filterOutCurry(
//     [1, 2, 3, 4],
//     makeCurry((curry, element, index, elements, ...rest) => {
//       assertEqual(curry, "curry");
//       assertEqual(element, index + 1);
//       assertDeepEqual(elements, [1, 2, 3, 4]);
//       assertDeepEqual(rest, []);
//       return element > 2;
//     }, "curry"),
//   ),
//   [1, 2],
// );
//
// {
//   let sum = 0;
//   assertEqual(
//     forEachCurry(
//       [1, 2, 3],
//       makeCurry((curry, element, index, elements, ...rest) => {
//         assertEqual(curry, "curry");
//         assertEqual(element, index + 1);
//         assertDeepEqual(elements, [1, 2, 3]);
//         assertDeepEqual(rest, []);
//         sum += element;
//       }, "curry"),
//     ),
//     undefined,
//   );
//   assertEqual(sum, 6);
// }
