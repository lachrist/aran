import { assertEqual } from "../__fixture__.mjs";
import { getKeySite, getKeyMemoSite } from "./site.mjs";

////////////////
// getKeySite //
////////////////

assertEqual(getKeySite(true).type, "Expression");
assertEqual(getKeySite(false).type, "Key");

////////////////////
// getKeyMemoSite //
////////////////////

assertEqual(getKeyMemoSite(true).type, "ExpressionMemo");
assertEqual(getKeyMemoSite(false).type, "KeyMemo");
