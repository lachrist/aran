import {assertEqual, assertNotEqual, assertDeepEqual} from "../__fixture__.mjs";
import {makeRootError} from "./error.mjs";
import {
  getResultError,
  makeEmptyResult,
  makeSingleVariableResult,
  makeSingleLabelResult,
  combineResult,
  bindResultVariable,
  bindResultLabel,
} from "./result.mjs";

assertEqual(getResultError(makeEmptyResult(null)), null);

assertNotEqual(
  getResultError(
    combineResult(
      "path",
      makeEmptyResult(makeRootError()),
      makeEmptyResult(null),
    ),
  ),
  null,
);

assertDeepEqual(
  bindResultVariable(
    "path",
    "variable1",
    "variable2",
    makeSingleVariableResult("variable1", "variable2"),
  ),
  makeEmptyResult(null),
);

assertDeepEqual(
  bindResultLabel(
    "path",
    "label1",
    "label2",
    makeSingleLabelResult("label1", "label2"),
  ),
  makeEmptyResult(null),
);

assertNotEqual(
  getResultError(
    combineResult(
      "path",
      makeSingleVariableResult("variable11", "variable12"),
      makeSingleVariableResult("variable11", "variable22"),
    ),
  ),
  null,
);

assertNotEqual(
  getResultError(
    combineResult(
      "path",
      makeSingleLabelResult("label11", "label12"),
      makeSingleLabelResult("label11", "label22"),
    ),
  ),
  null,
);
