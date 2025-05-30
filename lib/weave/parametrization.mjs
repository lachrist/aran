import { AranTypeError } from "../error.mjs";
import {
  hasNarrowKey,
  listKey,
  recordArrayTotal,
  return$,
} from "../util/index.mjs";

/**
 * @type {{[key in import("./parametrization.d.ts").ProgramKind]: null}}
 */
export const PROGRAM_KIND = {
  "module": null,
  "script": null,
  "global-eval": null,
  "root-local-eval": null,
  "deep-local-eval": null,
};

/**
 * @type {{[key in import("./parametrization.d.ts").ClosureKind]: null}}
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
 * @type {{[key in import("./parametrization.d.ts").SegmentKind]: null}}
 */
export const SEGMENT_KIND = {
  bare: null,
  then: null,
  else: null,
  try: null,
  catch: null,
  finally: null,
  while: null,
};

/**
 * @type {{[key1 in keyof import("./parametrization.d.ts").Parametrization]: {
 *   [key2 in import("./parametrization.d.ts").Parametrization[key1]]: null
 * }}}
 */
const PARAMETRIZATION = {
  "module": {
    "this": null,
    "import": null,
    "import.meta": null,
  },
  "script": {
    this: null,
    import: null,
  },
  "global-eval": {
    this: null,
    import: null,
  },
  "root-local-eval": {
    "this": null,
    "import": null,
    "import.meta": null,
    "new.target": null,
    "scope.read": null,
    "scope.writeStrict": null,
    "scope.writeSloppy": null,
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
 *   [key in keyof import("./parametrization.d.ts").Parametrization]:
 *   import("../lang/syntax.d.ts").Parameter[]
 * }}
 */
const enumeration = recordArrayTotal(
  listKey(PARAMETRIZATION),
  return$,
  (kind) => listKey(PARAMETRIZATION[kind]),
);

/**
 * @type {(
 *   kind: keyof import("./parametrization.d.ts").Parametrization,
 * ) => import("../lang/syntax.d.ts").Parameter[]}
 */
export const listParameter = (kind) => enumeration[kind];

/**
 * @type {(
 *   node: import("./atom.d.ts").ArgProgram,
 * ) => import("./parametrization.d.ts").ProgramKind}
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
 *   kind: string,
 * ) => kind is import("./parametrization.d.ts").ProgramKind}
 */
export const isProgramKind = (kind) => hasNarrowKey(PROGRAM_KIND, kind);

/**
 * @type {(
 *   kind: string,
 * ) => kind is import("./parametrization.d.ts").ClosureKind}
 */
export const isClosureKind = (kind) => hasNarrowKey(CLOSURE_KIND, kind);

/**
 * @type {(
 *   kind: string,
 * ) => kind is import("./parametrization.d.ts").RoutineKind}
 */
export const isRoutineKind = (kind) =>
  isProgramKind(kind) || isClosureKind(kind);

/**
 * @type {(
 *   kind: string,
 * ) => kind is import("./parametrization.d.ts").SegmentKind}
 */
export const isSegmentKind = (kind) => hasNarrowKey(SEGMENT_KIND, kind);

/**
 * @type {(
 *   kind: string,
 * ) => kind is import("./parametrization.d.ts").ControlKind}
 */
export const isControlKind = (kind) =>
  isSegmentKind(kind) || isRoutineKind(kind);
