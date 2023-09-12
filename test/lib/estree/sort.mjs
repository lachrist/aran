import { assertEqual } from "../../fixture.mjs";
import { parseScript, parseModule } from "../../fixture-parse.mjs";
import { map } from "../../../lib/util/index.mjs";
import { sortBody } from "../../../lib/estree/sort.mjs";

/** @type {(node: estree.Node) => string} */
const getType = ({ type }) => type;

/** @type {(node: estree.Program, ...types: string[]) => void} */
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
