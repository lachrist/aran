import {assertEqual} from "../../__fixture__.mjs";
import {
  makeBaseVariable,
  isBaseVariable,
  getVariableBody,
} from "./variable.mjs";

assertEqual(isBaseVariable(makeBaseVariable("foo")), true);

assertEqual(getVariableBody(makeBaseVariable("foo")), "foo");
