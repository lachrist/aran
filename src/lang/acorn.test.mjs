import {assertThrow} from "../__fixture__.mjs";
import {parseAcornLoose} from "./acorn.mjs";

parseAcornLoose("break foo;");
parseAcornLoose("export {foo};");
assertThrow(() => parseAcornLoose("'"));
