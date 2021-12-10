import {assertEqual, assertDeepEqual} from "../../__fixture__.mjs";
import {
  getResultErrorMessage,
  makeEmptyResult,
  makeStructuralMismatchResult,
  makeSingleVariableResult,
  makeSingleLabelResult,
  combineResult,
  bindResultVariable,
  bindResultLabel,
} from "./result.mjs";

assertEqual(getResultErrorMessage(makeEmptyResult()), null);

assertEqual(
  typeof getResultErrorMessage(
    combineResult(
      "path",
      makeStructuralMismatchResult("path", "message"),
      makeEmptyResult(),
    ),
  ),
  "string",
);

assertDeepEqual(
  bindResultVariable(
    "path",
    "variable1",
    "variable2",
    makeSingleVariableResult("variable1", "variable2"),
  ),
  makeEmptyResult(),
);

assertDeepEqual(
  bindResultLabel(
    "path",
    "label1",
    "label2",
    makeSingleLabelResult("label1", "label2"),
  ),
  makeEmptyResult(),
);

assertEqual(
  typeof getResultErrorMessage(
    combineResult(
      "path",
      makeSingleVariableResult("variable11", "variable12"),
      makeSingleVariableResult("variable11", "variable22"),
    ),
  ),
  "string",
);

assertEqual(
  typeof getResultErrorMessage(
    combineResult(
      "path",
      makeSingleLabelResult("label11", "label12"),
      makeSingleLabelResult("label11", "label22"),
    ),
  ),
  "string",
);
