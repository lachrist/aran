import {map} from "array-lite";

import {assertDeepEqual} from "../__fixture__.mjs";

import {sortBody} from "./sort.mjs";

import {parse as parseAcorn} from "acorn";

const getType = ({type}) => type;

const test = (type, code, ...types) => {
  assertDeepEqual(
    map(
      sortBody(
        parseAcorn(code, {
          ecmaVersion: 2021,
          sourceType: type,
        }).body,
      ),
      getType,
    ),
    types,
  );
};

test(
  "script",
  "debugger; function f () {}",
  "FunctionDeclaration",
  "DebuggerStatement",
);

test(
  "script",
  "debugger; label: function f () {}",
  "LabeledStatement",
  "DebuggerStatement",
);

test(
  "module",
  "debugger; export function f () {}",
  "ExportNamedDeclaration",
  "DebuggerStatement",
);

test(
  "module",
  "debugger; export default function f () {}",
  "ExportDefaultDeclaration",
  "DebuggerStatement",
);
