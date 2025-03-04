/** @type {import("linvail").Library} */
const { dir, is } = /** @type {any} */ (globalThis).Linvail;

/** @type {(value: unknown) => void} */
const log = /** @type {any} */ (globalThis).log;

const assert = (/** @type {boolean} */ check) => {
  if (!check) throw new Error("Assertion failed");
};

const same = (/** @type {unknown} */ val1, /** @type {unknown} */ val2) =>
  assert(is(val1, val2));

const diff = (/** @type {unknown} */ val1, /** @type {unknown} */ val2) =>
  assert(!is(val1, val2));

const num = 123;

// Provenancial Equality //
same(num, num);
diff(num, 123);

// Inspection //
log(num); // 123
dir(num); // { __inner: 123, __index: <id> }

// Provenance Preservation >> Function //
const identity = (/** @type {unknown} */ x) => x;
same(identity(num), num);
diff(identity(num), 123);

// Provenance Preservation >> Plain Object //
const object = { num };
same(object.num, num);
diff(object.num, 123);

// Provenance Preservation >> Array //
const array = [num];
same(array[0], num);
diff(array[0], 123);

// Provenance Preservation >> Builtin //
const copy = array.map(identity);
same(copy[0], num);
diff(copy[0], 123);

// Provenance Loss >> Promise //
const promise = Promise.resolve(num);
promise.then((res) => diff(res, num));

// Provenance Loss >> ES6 Collections //
const collection = new Map([["num", num]]);
diff(collection.get("num"), num);

log("done");
