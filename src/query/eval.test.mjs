import {parse as parseAcorn} from "acorn";
import {assertEqual} from "../__fixture__.mjs";
import {hasDirectEvalCall} from "./eval.mjs";

const options = {
  sourceType: "script",
  ecmaVersion: 2021,
};

assertEqual(hasDirectEvalCall(parseAcorn("[eval(x)];", options)), true);

assertEqual(hasDirectEvalCall(parseAcorn("[eval(...xs)];", options)), false);

assertEqual(hasDirectEvalCall(parseAcorn("(() => eval(x));", options)), false);

assertEqual(hasDirectEvalCall(parseAcorn("/regexp/gu;", options)), false);
