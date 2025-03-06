// Target //

/** @type {(value: unknown) => void} */
const log = /** @type {any} */ (globalThis).log;

/** @type {import("linvail").Library} */
const Linvail = /** @type {any} */ (globalThis).Linvail;

const { is, dir, Map: LinvailMap } = Linvail;

const assert = (/** @type {boolean} */ check) => {
  if (!check) throw new Error("Assertion failure");
};

/** @type {(val1: unknown, val2: unknown) => void} */
const same = (val1, val2) => assert(is(val1, val2));

/** @type {(val1: unknown, val2: unknown) => void} */
const diff = (val1, val2) => assert(!is(val1, val2));

const num = 123;

// Provenancial Equality //
same(num, num);
diff(num, 123);

// Inspection //
log(num); // 123 (transparency preservation)
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

// Provenance Loss >> ES6 Collection //
const map1 = new Map([[num, num]]);
assert(map1.has(123));
map1.forEach((val, key) => {
  diff(key, num);
  diff(val, num);
});

// Provenance Preservation >> Linvail Collection //
const map2 = new LinvailMap([[num, num]]);
assert(map2.has(num));
assert(!map2.has(123));
map2.forEach((val, key) => {
  same(key, num);
  diff(key, 123);
  same(val, num);
  diff(val, 123);
});

// Provenance Loss >> Partial Instrumentation //
globalThis.eval(`(({ num, object, is, log }) => {
  if (is(object.num, num))
    throw new Error("expect provenance loss");
  log(object.num); // 123 (transparency preservation)
});`)({ num, object, is, log });

log("done");
