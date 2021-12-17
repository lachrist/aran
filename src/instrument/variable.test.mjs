import {assertEqual} from "../__fixture__.mjs";

import {
  makeNewVariable,
  isNewVariable,
  isOldVariable,
  getVariableBody,
} from "./variable.mjs";

assertEqual(isNewVariable(makeNewVariable("body")), true);

assertEqual(isOldVariable(makeNewVariable("body")), false);

assertEqual(getVariableBody(makeNewVariable("body")), "body");
