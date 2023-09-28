import { assertEqual } from "../../test.fixture.mjs";
import { parseScript } from "../../parse.fixture.mjs";
import { hasDirectEvalCall } from "./eval.mjs";

assertEqual(hasDirectEvalCall(parseScript("[eval(x)];")), true);

assertEqual(hasDirectEvalCall(parseScript("[eval(...xs)];")), false);

assertEqual(hasDirectEvalCall(parseScript("(() => eval(x));")), false);

assertEqual(hasDirectEvalCall(parseScript("/regexp/gu;")), false);
