import {
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
} from "../__fixture__.mjs";
import { makeRootError } from "./error.mjs";
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
      makeEmptyResult(makeRootError()),
      makeEmptyResult(null),
      makeRootError(),
    ),
  ),
  null,
);

assertDeepEqual(
  bindResultVariable(
    makeSingleVariableResult("variable1", "variable2"),
    "variable1",
    "variable2",
    makeRootError(),
  ),
  makeEmptyResult(null),
);

assertDeepEqual(
  bindResultLabel(
    makeSingleLabelResult("label1", "label2"),
    "label1",
    "label2",
    makeRootError(),
  ),
  makeEmptyResult(null),
);

assertNotEqual(
  getResultError(
    combineResult(
      makeSingleVariableResult("variable11", "variable12"),
      makeSingleVariableResult("variable11", "variable22"),
      makeRootError(),
    ),
  ),
  null,
);

assertNotEqual(
  getResultError(
    combineResult(
      makeSingleLabelResult("label11", "label12"),
      makeSingleLabelResult("label11", "label22"),
      makeRootError(),
    ),
  ),
  null,
);
