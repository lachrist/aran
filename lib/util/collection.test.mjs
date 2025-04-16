import { strictEqual as assertEqual } from "node:assert";
import {
  createSafeMap,
  createSafeSet,
  createSafeWeakMap,
  createSafeWeakSet,
} from "./collection.mjs";

const { undefined } = globalThis;

/////////
// Set //
/////////
{
  const set = createSafeSet([123, 456]);
  assertEqual(set.$getSize(), 2);
  assertEqual(set.$add(789), set);
  assertEqual(set.$getSize(), 3);
  assertEqual(set.$has(456), true);
  assertEqual(set.$delete(456), true);
  assertEqual(set.$has(456), false);
  assertEqual(set.$delete(456), false);
  assertEqual(set.$clear(), undefined);
  assertEqual(set.$getSize(), 0);
}

/////////////
// WeakSet //
/////////////
{
  const key1 = { foo: 123 };
  const key2 = { foo: 456 };
  const key3 = { foo: 789 };
  const set = createSafeWeakSet([key1, key2]);
  assertEqual(set.$has(key1), true);
  assertEqual(set.$has(key3), false);
  assertEqual(set.$add(key3), set);
  assertEqual(set.$has(key3), true);
  assertEqual(set.$delete(key3), true);
  assertEqual(set.$has(key3), false);
  assertEqual(set.$delete(key3), false);
}

/////////
// Map //
/////////
{
  const map = createSafeMap([
    ["foo", 123],
    ["bar", 456],
  ]);
  assertEqual(map.$getSize(), 2);
  assertEqual(map.$set("qux", 789), map);
  assertEqual(map.$getSize(), 3);
  assertEqual(map.$get("foo"), 123);
  assertEqual(map.$get("qux"), 789);
  assertEqual(map.$has("bar"), true);
  assertEqual(map.$delete("bar"), true);
  assertEqual(map.$has("bar"), false);
  assertEqual(map.$delete("bar"), false);
  assertEqual(map.$clear(), undefined);
  assertEqual(map.$getSize(), 0);
}

/////////////
// WeakMap //
/////////////

{
  const key1 = { foo: 123 };
  const key2 = { foo: 456 };
  const key3 = { foo: 789 };
  const map = createSafeWeakMap([
    [key1, 123],
    [key2, 456],
  ]);
  assertEqual(map.$has(key1), true);
  assertEqual(map.$has(key3), false);
  assertEqual(map.$set(key3, 789), map);
  assertEqual(map.$has(key3), true);
  assertEqual(map.$get(key3), 789);
  assertEqual(map.$delete(key3), true);
  assertEqual(map.$get(key3), undefined);
  assertEqual(map.$has(key3), false);
  assertEqual(map.$delete(key3), false);
}
