import {assertEqual} from "./__fixture__.mjs";

import {
  getVariableBody,
  makeBaseVariable,
  makeMetaVariable,
  isBaseVariable,
  isMetaVariable,
} from "./variable.mjs";

assertEqual(isBaseVariable(makeBaseVariable("variable")), true);
assertEqual(isMetaVariable(makeMetaVariable("variable")), true);
assertEqual(isBaseVariable(makeMetaVariable("variable")), false);
assertEqual(isMetaVariable(makeBaseVariable("variable")), false);

assertEqual(getVariableBody(makeBaseVariable("variable")), "variable");
assertEqual(getVariableBody(makeMetaVariable("variable")), "variable");

assertEqual(getVariableBody(makeBaseVariable("new.target")), "new.target");
