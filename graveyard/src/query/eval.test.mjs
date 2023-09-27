import { assertEqual } from "../__fixture__.mjs";
import { parseScript } from "../__fixture__parser__.mjs";
import { hasDirectEvalCall } from "./eval.mjs";

assertEqual(hasDirectEvalCall(parseScript("[eval(x)];")), true);

assertEqual(hasDirectEvalCall(parseScript("[eval(...xs)];")), false);

assertEqual(hasDirectEvalCall(parseScript("(() => eval(x));")), false);

assertEqual(hasDirectEvalCall(parseScript("/regexp/gu;")), false);
