import { assertEqual } from "../__fixture__.mjs";
import { getKeySite, getKeyMacroSite } from "./site.mjs";

////////////////
// getKeySite //
////////////////

assertEqual(getKeySite(true).type, "Expression");
assertEqual(getKeySite(false).type, "Key");

/////////////////////
// getKeyMacroSite //
/////////////////////

assertEqual(getKeyMacroSite(true).type, "ExpressionMacro");
assertEqual(getKeyMacroSite(false).type, "KeyMacro");
