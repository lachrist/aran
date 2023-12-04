import Local from "./local/index.mjs";

/** @type {import("eslint").Linter.FlatConfig} */
const config = {
  files: [],
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
      rules: Local,
    },
  },
  rules: {
    // problems //
    "no-const-assign": "error",
    "no-debugger": "warn",
    "no-dupe-args": "error",
    "no-dupe-else-if": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-duplicate-imports": "error",
    "no-ex-assign": "error",
    "no-fallthrough": "error",
    "no-import-assign": "error",
    "no-unreachable": "error",
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        ignoreRestSiblings: false,
      },
    ],
    "no-use-before-define": "error",
    // suggestions //
    "arrow-body-style": ["error", "as-needed"],
    "default-case": "error",
    "default-case-last": "error",
    "default-param-last": "error",
    "dot-notation": "error",
    "eqeqeq": ["error", "always", { null: "ignore" }],
    "logical-assignment-operators": ["error", "never"],
    "no-bitwise": "error",
    "no-console": "warn",
    "no-empty": "error",
    "no-eval": "error",
    "no-lone-blocks": "error",
    "no-param-reassign": "error",
    "no-plusplus": "error",
    "no-warning-comments": ["warn", { terms: ["todo"] }],
    "object-shorthand": ["error"],
    "prefer-const": "error",
    "require-await": "error",
    "require-yield": "error",
    // local //
    "local/curly": "error",
    "local/no-class": "error",
    "local/no-empty-return": "error",
    "local/no-deep-import": "error",
    "local/no-function": "error",
    "local/no-global": ["error", "globalThis", "console"],
    "local/no-jsdoc-typedef": "error",
    "local/no-label": "error",
    "local/no-assignment-expression": "error",
    "local/no-optional-chaining": "error",
    "local/no-optional-parameter": "error",
    "local/no-pure-statement": "error",
    "local/no-rest-parameter": "error",
    "local/standard-declaration": "error",
    "local/strict-console": "error",
  },
};

/**
 * @type {import("eslint").Linter.FlatConfig[]}
 */
export default [
  {
    ...config,
    files: ["lib/**/*.mjs"],
    ignores: ["lib/**/*.test.mjs", "lib/**/*.fixture.mjs"],
    rules: {
      ...config.rules,
      "local/no-dynamic-import": "error",
      "local/literal-location": "error",
      "local/literal-unique": "error",
      "local/no-async": "error",
      "local/no-static-dependency": "error",
      "local/no-impure": "error",
      "local/no-method-call": "error",
    },
  },
  {
    ...config,
    files: [
      "lib/**/*.test.mjs",
      "lib/**/*.fixture.mjs",
      "test/**/*.mjs",
      "lint/**/*.mjs",
    ],
    ignores: ["test/262/codebase/**/*"],
    rules: {
      ...config.rules,
      "local/no-dynamic-import": "off",
      "local/literal-location": "off",
      "local/literal-unique": "off",
      "local/no-async": "off",
      "local/no-static-dependency": "off",
      "local/no-impure": "off",
      "local/no-method-call": "off",
    },
  },
];
