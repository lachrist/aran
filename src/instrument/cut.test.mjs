import {assertEqual, assertDeepEqual, assertThrow} from "../__fixture__.mjs";
import {cut} from "./cut.mjs";

const {undefined, Set, Map} = globalThis;

assertEqual(cut(true, "name", []), true);
assertEqual(cut(false, "name", []), false);

assertEqual(cut(["name"], "name", []), true);
assertEqual(cut(["name1"], "name2", []), false);

assertEqual(cut(new Set(["name"]), "name", []), true);
assertEqual(cut(new Set("name1"), "name2", []), false);

assertEqual(cut(new Map([["name1", true]]), "name2", []), false);
assertEqual(cut(new Map([["name", true]]), "name", []), true);
assertEqual(cut(new Map([["name", false]]), "name", []), false);
assertEqual(
  cut(
    new Map([
      [
        "name",
        /* eslint-disable no-restricted-syntax */
        function (...args) {
          assertEqual(this instanceof Map, true);
          assertDeepEqual(args, ["value"]);
          return "result";
        },
        /* eslint-enable no-restricted-syntax */
      ],
    ]),
    "name",
    ["value"],
  ),
  "result",
);

assertEqual(cut({__proto__: null, name: true}, "name", []), true);
assertEqual(cut({__proto__: null, name: false}, "name", []), false);
assertEqual(cut({__proto__: null, name1: false}, "name2", []), false);
assertEqual(
  cut(
    {
      __proto__: null,
      /* eslint-disable no-restricted-syntax */
      name: function self(...args) {
        assertEqual(this.name, self);
        assertDeepEqual(args, ["value"]);
        return "result";
      },
      /* eslint-enable no-restricted-syntax */
    },
    "name",
    ["value"],
  ),
  "result",
);

assertEqual(
  cut(
    /* eslint-disable no-restricted-syntax */
    function (...args) {
      assertEqual(this, undefined);
      assertDeepEqual(args, ["name", "value"]);
      return "result";
    },
    /* eslint-enable no-restricted-syntax */
    "name",
    ["value"],
  ),
  "result",
);

assertThrow(() => cut(123, "name", ["value"]));
assertThrow(() => cut({name: 123}, "name", ["value"]));
