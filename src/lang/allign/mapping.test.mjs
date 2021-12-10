import {assertDeepEqual, assertEqual} from "../../__fixture__.mjs";
import {makeRootError} from "./error.mjs";
import {
  isMapping,
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

assertDeepEqual(
  combineMapping("path", makeRootError(), makeEmptyMapping()),
  makeRootError(),
);
assertDeepEqual(
  combineMapping("path", makeEmptyMapping(), makeRootError()),
  makeRootError(),
);
assertEqual(
  isMapping(
    combineMapping(
      "path",
      makeSingleMapping("key", "value1"),
      makeSingleMapping("key", "value2"),
    ),
  ),
  false,
);
assertEqual(
  isMapping(
    combineMapping(
      "path",
      makeSingleMapping("key1", "value"),
      makeSingleMapping("ke2", "value"),
    ),
  ),
  false,
);
assertEqual(
  isMapping(
    combineMapping(
      "path",
      makeSingleMapping("key1", "value1"),
      makeSingleMapping("ke2", "value2"),
    ),
  ),
  true,
);

/////////////////
// bindMapping //
/////////////////

assertDeepEqual(
  bindMapping("path", "key", "value", makeRootError()),
  makeRootError(),
);

assertDeepEqual(
  bindMapping("path", "key1", "value1", makeEmptyMapping()),
  makeEmptyMapping(),
);

assertEqual(
  isMapping(
    bindMapping("path", "key", "value2", makeSingleMapping("key", "value1")),
  ),
  false,
);

assertEqual(
  isMapping(
    bindMapping("path", "key1", "value", makeSingleMapping("key2", "value")),
  ),
  false,
);

assertDeepEqual(
  bindMapping("path", "key", "value", makeSingleMapping("key", "value")),
  makeEmptyMapping(),
);
