import {assertEqual} from "./__fixture__.mjs";

import {createCounter} from "./util/index.mjs";

import {
  getVariableBody,
  makeBaseVariable,
  makeMetaVariable,
  isBaseVariable,
  isMetaVariable,
  freshenVariable,
} from "./variable.mjs";

assertEqual(freshenVariable("variable", 0, createCounter(0)), "variable_0_1");

assertEqual(isBaseVariable(makeBaseVariable("variable")), true);
assertEqual(isMetaVariable(makeMetaVariable("variable")), true);
assertEqual(isBaseVariable(makeMetaVariable("variable")), false);
assertEqual(isMetaVariable(makeBaseVariable("variable")), false);

assertEqual(getVariableBody(makeBaseVariable("variable")), "variable");
assertEqual(getVariableBody(makeMetaVariable("variable")), "variable");

assertEqual(getVariableBody(makeBaseVariable("new.target")), "new.target");
