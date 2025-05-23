// Target //

const { log } = globalThis;
const { is, dir, Map: LinvailMap } = globalThis.Linvail;

const num = 123;

log("\nProvenancial Equality");
log(is(num, num)); // ✅ true
log(is(num, 123)); // ✅ false

log("\nInspection");
log(num); // 👀 123
dir(num); // 👀 { inner: 123, index: ... }

log("\nProvenance Preservation >> Function");
const identity = (/** @type {unknown} */ x) => x;
log(is(identity(num), num)); // ✅ true
log(is(identity(num), 123)); // ✅ false

log("\nProvenance Preservation >> Plain Object");
const object = { num };
log(is(object.num, num)); // ✅ true
log(is(object.num, 123)); // ✅ false

log("\nProvenance Preservation >> Array");
const array = [num];
log(is(array[0], num)); // ✅ true
log(is(array[0], 123)); // ✅ false

log("\nProvenance Preservation >> Builtin");
const copy = array.map(identity);
log(is(copy[0], num)); // ✅ true
log(is(copy[0], 123)); // ✅ false

Promise.resolve(num).then((res) => {
  log("\nProvenance Loss >> Promise");
  log(is(res, num)); // ❌ false
});

log("\nProvenance Loss >> ES6 Collection");
const map1 = new Map([[num, num]]);
map1.forEach((val, key) => {
  log(is(key, num)); // ❌ false
  log(is(val, num)); // ❌ false
});

log("\nProvenance Preservation >> Linvail Collection");
const map2 = new LinvailMap([[num, num]]);
log(map2.has(num)); // ✅ true
log(map2.has(123)); // ✅ false
map2.forEach((val, key) => {
  log(is(key, num)); // ✅ true
  log(is(key, 123)); // ✅ false
  log(is(val, num)); // ✅ true
  log(is(val, 123)); // ✅ false
});

log("\nProvenance Loss >> Partial Instrumentation");
globalThis.eval(`(({ num, object, is, log, dir }) => {
  log(is(object.num, num)); // ❌ false
  log(object.num); // 👀 123
  dir(object.num); // 👀 123
});`)({ num, object, is, log, dir });
