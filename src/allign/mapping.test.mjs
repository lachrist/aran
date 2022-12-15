import { assertDeepEqual, assertEqual } from "../__fixture__.mjs";
import { makeLeft } from "../util/index.mjs";
import { makeRootError } from "./error.mjs";
import {
  hasMappingError,
  makeEmptyMapping,
  makeSingleMapping,
  combineMapping,
  bindMapping,
} from "./mapping.mjs";

const makeErrorMapping = makeLeft;

///////////////////////////////////////////
// makeEmptyMapping && makeSingleMapping //
///////////////////////////////////////////

assertDeepEqual(
  combineMapping(
    makeEmptyMapping(),
    makeSingleMapping("key", "value"),
    makeRootError(),
  ),
  makeSingleMapping("key", "value"),
);

////////////////////
// combineMapping //
////////////////////

assertEqual(
  hasMappingError(
    combineMapping(
      makeErrorMapping(makeRootError()),
      makeEmptyMapping(),
      makeRootError(),
    ),
  ),
  true,
);

assertDeepEqual(
  hasMappingError(
    combineMapping(
      makeEmptyMapping(),
      makeErrorMapping(makeRootError()),
      makeRootError(),
    ),
  ),
  true,
);

assertEqual(
  hasMappingError(
    combineMapping(
      makeSingleMapping("key1", "value1"),
      makeSingleMapping("key2", "value2"),
      makeRootError(),
    ),
  ),
  false,
);

assertEqual(
  hasMappingError(
    combineMapping(
      makeSingleMapping("key", "value1"),
      makeSingleMapping("key", "value2"),
      makeRootError(),
    ),
  ),
  true,
);

/////////////////
// bindMapping //
/////////////////

assertDeepEqual(
  hasMappingError(
    bindMapping(
      makeErrorMapping(makeRootError()),
      "key",
      "value",
      makeRootError(),
    ),
  ),
  true,
);

assertDeepEqual(
  bindMapping(
    makeSingleMapping("key", "value"),
    "key",
    "value",
    makeRootError(),
  ),
  makeEmptyMapping(),
);

assertEqual(
  hasMappingError(
    bindMapping(
      makeSingleMapping("key", "value1"),
      "key",
      "value2",
      makeRootError(),
    ),
  ),
  true,
);

assertEqual(
  hasMappingError(
    bindMapping(
      makeSingleMapping("key1", "value"),
      "key2",
      "value",
      makeRootError(),
    ),
  ),
  true,
);

assertDeepEqual(
  bindMapping(
    makeSingleMapping("key1", "value1"),
    "key2",
    "value2",
    makeRootError(),
  ),
  makeSingleMapping("key1", "value1"),
);
