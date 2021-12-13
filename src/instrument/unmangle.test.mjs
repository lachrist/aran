import {unmangleVariable, unmangleLabel} from "./unmangle.mjs";

import {makeMetaVariable, makeBaseVariable} from "../variable.mjs";

import {makeEmptyContinueLabel, makeFullBreakLabel} from "../label.mjs";

unmangleVariable(makeMetaVariable("variable"));
unmangleVariable(makeBaseVariable("variable"));
unmangleVariable(makeBaseVariable("new.target"));

unmangleLabel(makeEmptyContinueLabel("label"));
unmangleLabel(makeFullBreakLabel("label"));
