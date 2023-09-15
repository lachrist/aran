import { assertEqual } from "../test.fixture.mjs";

import {
  convertLabel,
  revertLabel,
  convertVariable,
  revertVariable,
} from "./identifier.mjs";

/** @type {(label: string)} */
const testLabel = (label) => {
  assertEqual(
    convertLabel(revertLabel(/** @type {aran.Label} */ (label))),
    label,
  );
};

/** @type {(variable: string)} */
const testVariable = (variable) => {
  assertEqual(
    convertVariable(revertVariable(/** @type {aran.Variable} */ (variable))),
    variable,
  );
};

testLabel("foo");
testLabel("foo.break");
testLabel("foo.continue");

testVariable("new.target");
testVariable("foo");
testVariable("aran.foo");
