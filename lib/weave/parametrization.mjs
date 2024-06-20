import { AranTypeError } from "../error.mjs";
import {
  hasNarrowKey,
  listEntry,
  listKey,
  map,
  reduceEntry,
} from "../util/index.mjs";

/**
 * @type {{[key in import("./parametrization").ProgramKind]: null}}
 */
export const PROGRAM_KIND = {
  "module": null,
  "script": null,
  "global-eval": null,
  "root-local-eval": null,
  "deep-local-eval": null,
};

/**
 * @type {{[key in import("./parametrization").ClosureKind]: null}}
 */
export const CLOSURE_KIND = {
  "arrow": null,
  "async-arrow": null,
  "function": null,
  "async-function": null,
  "generator": null,
  "async-generator": null,
  "method": null,
  "async-method": null,
};

/**
 * @type {{[key in import("./parametrization").ControlKind]: null}}
 */
export const CONTROL_KIND = {
  bare: null,
  then: null,
  else: null,
  try: null,
  catch: null,
  finally: null,
  while: null,
};

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
  "global-eval": {
    "this": null,
    "import.dynamic": null,
    "scope.read": null,
    "scope.write": null,
    "scope.typeof": null,
    "scope.discard": null,
  },
  "root-local-eval": {
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
  "deep-local-eval": {},
  "function": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "async-function": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "generator": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "async-generator": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "method": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "async-method": {
    "this": null,
    "new.target": null,
    "function.callee": null,
    "function.arguments": null,
  },
  "arrow": {
    "function.callee": null,
    "function.arguments": null,
  },
  "async-arrow": {
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
 *   [key in keyof import("./parametrization").Parametrization]:
 *   import("../lang").Parameter[]
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
 *   kind: keyof import("./parametrization").Parametrization,
 * ) => import("../lang").Parameter[]}
 */
export const listParameter = (kind) => enumeration[kind];

/**
 * @type {(
 *   node: import("./atom").ArgProgram,
 * ) => import("./parametrization").ProgramKind}
 */
export const makeProgramKind = (node) => {
  switch (node.kind) {
    case "module": {
      return node.kind;
    }
    case "script": {
      return node.kind;
    }
    case "eval": {
      if (node.situ === "global") {
        return "global-eval";
      } else if (node.situ === "local.deep") {
        return "deep-local-eval";
      } else if (node.situ === "local.root") {
        return "root-local-eval";
      } else {
        throw new AranTypeError(node);
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   kind: import("./parametrization").BlockKind,
 * ) => kind is import("./parametrization").ProgramKind}
 */
export const isProgramKind = (kind) => hasNarrowKey(PROGRAM_KIND, kind);

/**
 * @type {(
 *   kind: import("./parametrization").BlockKind,
 * ) => kind is import("./parametrization").ClosureKind}
 */
export const isClosureKind = (kind) => hasNarrowKey(CLOSURE_KIND, kind);

/**
 * @type {(
 *   kind: import("./parametrization").BlockKind,
 * ) => kind is import("./parametrization").RoutineKind}
 */
export const isRoutineKind = (kind) =>
  isProgramKind(kind) || isClosureKind(kind);

/**
 * @type {(
 *   kind: import("./parametrization").BlockKind,
 * ) => kind is import("./parametrization").ControlKind}
 */
export const isControlKind = (kind) => hasNarrowKey(CONTROL_KIND, kind);
