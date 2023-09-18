import { assertEqual } from "../test.fixture.mjs";

import {
  convertLabel,
  revertLabel,
  convertVariable,
  revertVariable,
} from "./identifier.mjs";

/** @type {(label: string) => void} */
const testLabel = (label) => {
  assertEqual(
    convertLabel(revertLabel(/** @type {revert.Label} */ (label))),
    label,
  );
};

/** @type {(variable: string) => void} */
const testVariable = (variable) => {
  assertEqual(
    convertVariable(revertVariable(/** @type {revert.Variable} */ (variable))),
    variable,
  );
};

testLabel("foo");
testLabel("foo.break");
testLabel("foo.continue");

testVariable("new.target");
testVariable("foo");
testVariable("aran.foo");
