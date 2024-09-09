import { AranTypeError } from "../report";
import { flatMap, map } from "../util/index.mjs";
import { listPatternVariable } from "./query/index.mjs";

/**
 * @type {(
 *   binding: import("./query/hoist-public").Binding,
 * ) => import("./deadzone").Update}
 */
const toUpdate = ({ variable: fst, baseline: snd }) => ({ fst, snd });

/**
 * @type {(
 *   variable: import("../estree").Variable,
 * ) => import("./deadzone").Update}
 */
const makeLiveUpdate = (variable) => ({ fst: variable, snd: "live" });

/**
 * @type {(
 *   declarator: import("../estree").VariableDeclarator,
 * ) => import("./deadzone").Update[]}
 */
const listUpdate = ({ id: pattern }) =>
  map(listPatternVariable(pattern), makeLiveUpdate);

/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 *   bindings: import("./query/hoist-public").Binding[],
 * ) => import("./deadzone").Deadzone}
 */
export const declareDeadzone = (deadzone, bindings) => ({
  head: map(bindings, toUpdate),
  tail: deadzone,
});

/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 *   node: (
 *      | import("../estree").Directive
 *      | import("../estree").Statement
 *      | import("../estree").ModuleDeclaration
 *   ),
 * ) => import("./deadzone").Deadzone}
 */
export const updateDeadzoneStatement = (deadzone, node) => {
  if (node.type === "ClassDeclaration") {
    return {
      head: [{ fst: node.id.name, snd: "live" }],
      tail: deadzone,
    };
  } else if (node.type === "VariableDeclaration") {
    if (node.kind === "let" || node.kind === "const") {
      return {
        head: flatMap(node.declarations, listUpdate),
        tail: deadzone,
      };
    } else if (node.kind === "var") {
      return deadzone;
    } else {
      throw new AranTypeError(node.kind);
    }
  } else if (node.type === "ExportNamedDeclaration") {
    if (node.declaration == null) {
      return deadzone;
    } else {
      return updateDeadzoneStatement(deadzone, node.declaration);
    }
  } else {
    return deadzone;
  }
};

/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 *   kind: null | "var" | "let" | "const",
 *   node: (
 *     | import("../estree").Pattern
 *     | import("../estree").PatternProperty
 *   ),
 * ) => import("./deadzone").Deadzone}
 */
export const updateDeadzonePattern = (deadzone, kind, node) => {
  if (kind === null || kind === "var") {
    return deadzone;
  } else if (kind === "let" || kind === "const") {
    return {
      head: map(
        listPatternVariable(node.type === "Property" ? node.value : node),
        makeLiveUpdate,
      ),
      tail: deadzone,
    };
  } else {
    throw new AranTypeError(kind);
  }
};

/* eslint-disable local/no-impure*/
/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 *   variable: import("../estree").Variable,
 * ) => import("./scope/operation").Status}
 */
export const lookupDeadzone = (list, target) => {
  while (list !== null) {
    const { head: array, tail } = list;
    const { length } = array;
    for (let index = 0; index < length; index++) {
      const { fst, snd } = array[index];
      if (fst === target) {
        return snd;
      }
    }
    list = tail;
  }
  return "unknown";
};
/* eslint-enable local/no-impure*/

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   deadzone: import("./deadzone").Deadzone,
 * ) => import("./deadzone").Deadzone}
 */
export const captureDeadzone = (deadzone) => {
  /**
   * @type {import("../util/pair").Pair<
   *   import("../estree").Variable,
   *   "unknown",
   * >[]}
   */
  const unknown = [];
  let push_index = 0;
  /**
   * @type {{[key: import("../estree").Variable]: null}}
   */
  const done = {
    // @ts-ignore
    __proto__: null,
  };
  let current = deadzone;
  while (current !== null) {
    const { head, tail } = current;
    const { length } = head;
    for (let index = 0; index < length; index++) {
      const { fst, snd } = head[index];
      if (!(fst in done)) {
        done[fst] = null;
        if (snd === "dead") {
          unknown[push_index++] = { fst, snd: "unknown" };
        }
      }
    }
    current = tail;
  }
  return {
    head: unknown,
    tail: deadzone,
  };
};
/* eslint-enable local/no-impure */
