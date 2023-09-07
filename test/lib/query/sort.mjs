import { assertEqual } from "../fixture.mjs";
import { parseScript, parseModule } from "../fixture-parse.mjs";
import { map } from "../util/index.mjs";
import { sortBody } from "./sort.mjs";

/** @type {(node: EstreeNode) => string} */
const getType = ({ type }) => type;

/** @type {(node: EstreeProgram, ...types: string[]) => void} */
const test = ({ body }, ...types) => {
  assertEqual(map(sortBody(body), getType), types);
};

test(
  parseScript("debugger; function f () {}"),
  "FunctionDeclaration",
  "DebuggerStatement",
);

test(
  parseScript("debugger; label: function f () {}"),
  "LabeledStatement",
  "DebuggerStatement",
);

test(
  parseModule("debugger; export function f () {}"),
  "ExportNamedDeclaration",
  "DebuggerStatement",
);

test(
  parseModule("debugger; export default function f () {}"),
  "ExportDefaultDeclaration",
  "DebuggerStatement",
);
