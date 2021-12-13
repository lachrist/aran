import {assertEqual} from "../__fixture__.mjs";

import {makeNewVariable, isNewVariable, isOldVariable} from "./variable.mjs";

assertEqual(isNewVariable(makeNewVariable("variable")), true);

assertEqual(isOldVariable(makeNewVariable("variable")), false);
