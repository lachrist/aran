import { BINARY_OPERATOR_RECORD, UNARY_OPERATOR_RECORD } from "estree-sentry";
import { INTRINSIC_RECORD } from "../lang/syntax.mjs";
import { listKey } from "../util/index.mjs";
import { compileIntrinsicRecord } from "./index.mjs";
import {
  ok as assert,
  throws as assertThrow,
  deepStrictEqual as assertEqual,
} from "node:assert";

const {
  ReferenceError,
  undefined,
  Array: { from: toArray },
  SyntaxError,
  Error,
  parseInt,
  Number,
  Object: { hasOwn },
} = globalThis;

const intrinsics = compileIntrinsicRecord(globalThis);

for (const key of listKey(INTRINSIC_RECORD)) {
  assert(hasOwn(intrinsics, key));
  assert(key === "undefined" || !!intrinsics[key]);
}

// throwException //
assertThrow(() => {
  intrinsics["aran.throwException"](new Error("BOUM"));
}, "Error: BOUM");

// transpileEvalCode //
assertThrow(() => {
  intrinsics["aran.transpileEvalCode"]("123;", "situ", "hash");
}, SyntaxError);

// retropileEvalCode //
assertThrow(() => {
  intrinsics["aran.retropileEvalCode"]({
    type: "Program",
    kind: "module",
    situ: "global",
    head: [],
    body: {
      type: "RoutineBlock",
      bindings: [],
      head: null,
      body: [],
      tail: {
        type: "PrimitiveExpression",
        primitive: 123,
        tag: null,
      },
      tag: null,
    },
    tag: null,
  });
}, SyntaxError);

// listForInKey //
assertEqual(
  intrinsics["aran.listForInKey"]({
    foo: 123,
    __proto__: { bar: 456, qux: 789 },
  }),
  {
    __proto__: null,
    0: "foo",
    1: "bar",
    2: "qux",
    length: 3,
  },
);

// performUnaryOperation //
assertEqual(intrinsics["aran.performUnaryOperation"]("typeof", 123), "number");
for (const operator of listKey(UNARY_OPERATOR_RECORD)) {
  intrinsics["aran.performUnaryOperation"](operator, 0);
}

// performBinaryOperation //
assertEqual(intrinsics["aran.performBinaryOperation"]("+", 2, 3), 5);
assertEqual(
  intrinsics["aran.performBinaryOperation"]("in", "foo", {
    __proto__: { foo: 123 },
  }),
  true,
);
assertEqual(
  intrinsics["aran.performBinaryOperation"]("in", "foo", { __proto__: null }),
  false,
);
assertEqual(
  intrinsics["aran.performBinaryOperation"](
    "instanceof",
    new SyntaxError("foo"),
    Error,
  ),
  true,
);
assertEqual(
  intrinsics["aran.performBinaryOperation"](
    "instanceof",
    new Error("foo"),
    SyntaxError,
  ),
  false,
);
for (const operator of listKey(BINARY_OPERATOR_RECORD)) {
  if (operator !== "in" && operator !== "instanceof") {
    intrinsics["aran.performBinaryOperation"](operator, 0, 0);
  }
}

// getValueProperty //
assertEqual(intrinsics["aran.getValueProperty"]({ foo: 123 }, "foo"), 123);

// toPropertyKey //
assertEqual(intrinsics["aran.toPropertyKey"](true), "true");

// sliceObject //
assertEqual(
  intrinsics["aran.sliceObject"](
    { foo: 123, bar: 456, qux: 789 },
    { qux: null, QUX: null },
  ),
  {
    foo: 123,
    bar: 456,
  },
);

// isConstructor //
assertEqual(intrinsics["aran.isConstructor"](Number), true);
assertEqual(intrinsics["aran.isConstructor"](parseInt), false);

// toArgumentList //
assertEqual(
  toArray(intrinsics["aran.toArgumentList"]([123, 456], null)),
  [123, 456],
);
assertEqual(
  toArray(intrinsics["aran.toArgumentList"]([123, 456], () => {})),
  [123, 456],
);

// listIteratorRest //
{
  const iterator = [123, 456, 789].values();
  assertEqual(iterator.next(), { value: 123, done: false });
  assertEqual(
    intrinsics["aran.listIteratorRest"](iterator, iterator.next),
    [456, 789],
  );
}

// createObject //
{
  const prototype = { __proto__: null, foo: 123 };
  assertEqual(
    intrinsics["aran.createObject"](prototype, "bar", 456, "qux", 789),
    {
      __proto__: prototype,
      bar: 456,
      qux: 789,
    },
  );
}

// global variable access //
assertEqual(intrinsics["aran.discardGlobalVariable"]("foo"), true);
assertEqual(intrinsics["aran.typeofGlobalVariable"]("foo"), "undefined");
assertThrow(() => {
  intrinsics["aran.readGlobalVariable"]("foo");
}, ReferenceError);
assertThrow(() => {
  intrinsics["aran.writeGlobalVariableStrict"]("foo", 123);
}, ReferenceError);
assertEqual(intrinsics["aran.declareGlobalVariable"]("foo, bar"), undefined);
assertEqual(intrinsics["aran.readGlobalVariable"]("foo"), undefined);
assertEqual(
  intrinsics["aran.writeGlobalVariableStrict"]("foo", 123),
  undefined,
);
assertEqual(intrinsics["aran.readGlobalVariable"]("foo"), 123);
assertEqual(intrinsics["aran.typeofGlobalVariable"]("foo"), "number");
assertEqual(intrinsics["aran.discardGlobalVariable"]("foo"), true);
assertEqual(intrinsics["aran.typeofGlobalVariable"]("foo"), "undefined");
assertEqual(intrinsics["aran.discardGlobalVariable"]("bar"), true);

// global variable access >> optimization //
/** @type {any} */ (intrinsics["aran.readGlobalVariable"])(
  "qux",
  null,
  () => "read-qux",
);
assertEqual(intrinsics["aran.readGlobalVariable"]("qux"), "read-qux");
/** @type {any} */ (intrinsics["aran.typeofGlobalVariable"])(
  "qux",
  null,
  () => "typeof-qux",
);
assertEqual(intrinsics["aran.typeofGlobalVariable"]("qux"), "typeof-qux");
/** @type {any} */ (intrinsics["aran.discardGlobalVariable"])(
  "qux",
  null,
  () => "discard-qux",
);
assertEqual(intrinsics["aran.discardGlobalVariable"]("qux"), "discard-qux");
/** @type {any} */ (intrinsics["aran.writeGlobalVariableStrict"])(
  "qux",
  null,
  (/** @type {any} */ val) => `write-strict-qux-${val}`,
);
assertEqual(
  intrinsics["aran.writeGlobalVariableStrict"]("qux", 123),
  "write-strict-qux-123",
);
/** @type {any} */ (intrinsics["aran.writeGlobalVariableSloppy"])(
  "qux",
  null,
  (/** @type {any} */ val) => `write-sloppy-qux-${val}`,
);
assertEqual(
  intrinsics["aran.writeGlobalVariableSloppy"]("qux", 123),
  "write-sloppy-qux-123",
);

// Special VALUE case //
assertThrow(
  () => intrinsics["aran.writeGlobalVariableStrict"]("VALUE", 123),
  ReferenceError,
);
assertEqual(
  intrinsics["aran.writeGlobalVariableSloppy"]("VALUE", 123),
  undefined,
);
