import rules from "./rules.mjs";
import BasenameLiteral from "./rules/basename-literal.mjs";
import NoGlobals from "./rules/no-globals.mjs";
import UniqueLiteral from "./rules/unique-literal.mjs";
import NodePath from "./rules/node-path.mjs";
import ImportPlugin from "eslint-plugin-import";

/**
 * @type {import("eslint").Linter.FlatConfig[]}
 */
export default [
  {
    files: ["lib/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        globalThis: false,
        console: false,
      },
    },
    plugins: {
      local: {
        rules: {
          "basename-literal": BasenameLiteral,
          "no-globals": NoGlobals,
          "unique-literal": UniqueLiteral,
          "node-path": NodePath,
        },
      },
      import: ImportPlugin,
    },
    settings: {
      "import/resolver": { typescript: true, node: true },
    },
    rules,
  },
];
