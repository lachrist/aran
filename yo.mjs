import { parse } from "acorn";

console.dir(
  parse("var foo; export { foo as 123 };", {
    sourceType: "module",
    ecmaVersion: 2024,
  }),
  { depth: null },
);
