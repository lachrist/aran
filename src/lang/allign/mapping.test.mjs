import {assertDeepEqual, assertEqual} from "../../__fixture__.mjs";
import {
  makeEmptyMapping,
  makeSingleMapping,
  combineMapping,
  bindMapping,
} from "./mapping.mjs";

///////////////////////////////////////////
// makeEmptyMapping && makeSingleMapping //
///////////////////////////////////////////

assertDeepEqual(
  combineMapping("path", makeEmptyMapping(), makeSingleMapping("key", "value")),
  makeSingleMapping("key", "value"),
);

////////////////////
// combineMapping //
////////////////////

assertEqual(combineMapping("path", "mapping", makeEmptyMapping()), "mapping");
assertEqual(combineMapping("path", makeEmptyMapping(), "mapping"), "mapping");
assertEqual(
  typeof combineMapping(
    "path",
    makeSingleMapping("key", "value1"),
    makeSingleMapping("key", "value2"),
  ),
  "string",
);
assertEqual(
  typeof combineMapping(
    "path",
    makeSingleMapping("key1", "value"),
    makeSingleMapping("ke2", "value"),
  ),
  "string",
);
assertEqual(
  typeof combineMapping(
    "path",
    makeSingleMapping("key1", "value1"),
    makeSingleMapping("ke2", "value2"),
  ),
  "object",
);

/////////////////
// bindMapping //
/////////////////

assertEqual(bindMapping("path", "key", "value", "mapping"), "mapping");

assertDeepEqual(
  bindMapping("path", "key1", "value1", makeEmptyMapping()),
  makeEmptyMapping(),
);

assertEqual(
  typeof bindMapping(
    "path",
    "key",
    "value2",
    makeSingleMapping("key", "value1"),
  ),
  "string",
);

assertEqual(
  typeof bindMapping(
    "path",
    "key1",
    "value",
    makeSingleMapping("key2", "value"),
  ),
  "string",
);

assertDeepEqual(
  bindMapping("path", "key", "value", makeSingleMapping("key", "value")),
  makeEmptyMapping(),
);
