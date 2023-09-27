import { map } from "array-lite";
import { assertDeepEqual } from "../__fixture__.mjs";
import { parseScript, parseModule } from "../__fixture__parser__.mjs";
import { sortBody } from "./sort.mjs";

const getType = ({ type }) => type;

const test = ({ body }, ...types) => {
  assertDeepEqual(map(sortBody(body), getType), types);
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
