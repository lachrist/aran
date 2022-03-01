import {assertEqual} from "../../__fixture__.mjs";
import {makeRootScope, declareBaseVariable} from "./split.mjs";

assertEqual(declareBaseVariable(makeRootScope()), false);
