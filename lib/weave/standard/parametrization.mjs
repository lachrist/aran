import { listEntry, listKey, map, reduceEntry } from "../../util/index.mjs";

/**
 * @type {{[key1 in keyof import("./parametrization").Parametrization]: {
 *   [key2 in import("./parametrization").Parametrization[key1]]: null
 * }}}
 */
const parametrization = {
  "module": {
    "this": null,
    "import.meta": null,
    "import.dynamic": null,
    "scope.read": null,
    "scope.write": null,
    "scope.typeof": null,
    "scope.discard": null,
  },
  "script": {
    "this": null,
    "import.dynamic": null,
    "scope.read": null,
    "scope.write": null,
    "scope.typeof": null,
    "scope.discard": null,
  },
  "eval.global": {
    "this": null,
    "import.dynamic": null,
    "scope.read": null,
    "scope.write": null,
    "scope.typeof": null,
    "scope.discard": null,
  },
  "eval.local.root": {
    "this": null,
    "import.meta": null,
    "new.target": null,
    "import.dynamic": null,
    "scope.read": null,
    "scope.write": null,
    "scope.typeof": null,
    "scope.discard": null,
    "private.get": null,
    "private.set": null,
    "private.has": null,
    "super.call": null,
    "super.get": null,
    "super.set": null,
  },
  "eval.local.deep": {},
  "function": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "function.async": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "function.generator": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "function.async.generator": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "arrow": {
    "function.callee": null,
    "function.arguments": null,
  },
  "arrow.async": {
    "function.callee": null,
    "function.arguments": null,
  },
  "catch": {
    "catch.error": null,
  },
  "finally": {},
  "while": {},
  "try": {},
  "then": {},
  "else": {},
  "bare": {},
};

/**
 * @type {{
 *   [key in import("./pointcut").BlockKind]:
 *   import("../../lang").Parameter[]
 * }}
 */
const enumeration = /** @type {any} */ (
  reduceEntry(
    map(listEntry(parametrization), ([kind, parameters]) => [
      kind,
      listKey(parameters),
    ]),
  )
);

/**
 * @type {(
 *   kind: import("./pointcut").BlockKind,
 * ) => import("../../lang").Parameter[]}
 */
export const listParameter = (kind) => enumeration[kind];
