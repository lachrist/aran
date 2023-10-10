import rules from "./rules.mjs";
import NoGlobals from "./rules/no-globals.mjs";
import LiteralBasename from "./rules/literal-basename.mjs";
import LiteralUnique from "./rules/literal-unique.mjs";
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
          "literal-basename": LiteralBasename,
          "literal-unique": LiteralUnique,
          "no-globals": NoGlobals,
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
