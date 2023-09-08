import { assertEqual } from "../../fixture.mjs";
import { parseScript } from "../../fixture-parse.mjs";
import { hasDirectEvalCall } from "../../../lib/estree/eval.mjs";

assertEqual(hasDirectEvalCall(parseScript("[eval(x)];")), true);

assertEqual(hasDirectEvalCall(parseScript("[eval(...xs)];")), false);

assertEqual(hasDirectEvalCall(parseScript("(() => eval(x));")), false);

assertEqual(hasDirectEvalCall(parseScript("/regexp/gu;")), false);
