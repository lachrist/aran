import { parse } from "acorn";

console.dir(
  parse("import './foo.js';", {
    ecmaVersion: 2024,
    sourceType: "module",
  }),
  { depth: null },
);
