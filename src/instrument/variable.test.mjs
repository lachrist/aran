import { assertEqual } from "../__fixture__.mjs";
import { makeOldVariable, makeNewVariable, isNewVariable } from "./variable.mjs";

assertEqual(isNewVariable(makeNewVariable("x")), true);
assertEqual(isNewVariable(makeOldVariable("x")), false);
