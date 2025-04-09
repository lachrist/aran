import { listKey, map, mapTree, reduce, reduceEntry } from "../util/index.mjs";
import { global_object_parameter } from "./global.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

const sep = ["_"];

/**
 * @type {(
 *   dependency: import("./layout.d.ts").Dependency,
 * ) => import("estree-sentry").VariableName}
 */
const toDependencyVariable = (dependency) =>
  /** @type {import("estree-sentry").VariableName} */ (`$${dependency}`);

/**
 * @type {(
 *   dependency: import("./layout.d.ts").Dependency,
 * ) => string[]}
 */
const splitDependency = (dependency) => apply(split, dependency, sep);

/**
 * @type {(
 *   dependency: import("./layout.d.ts").Dependency,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeReadDependencyExpression = (dependency) => ({
  type: "Identifier",
  name: toDependencyVariable(dependency),
});

/**
 * @type {(
 *   object: import("estree-sentry").Expression<{}>,
 *   key: string,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeMemberExpression = (object, key) => ({
  type: "MemberExpression",
  object,
  optional: false,
  property: {
    type: "Literal",
    raw: null,
    bigint: null,
    regex: null,
    value: key,
  },
  computed: true,
});

/**
 * @type {(
 *   dependency: import("./layout.d.ts").Dependency,
 * ) => import("estree-sentry").Statement<{}>}
 */
const makeDeclareDependencyStatement = (dependency) => ({
  type: "VariableDeclaration",
  kind: "const",
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: toDependencyVariable(dependency),
      },
      init: reduce(splitDependency(dependency), makeMemberExpression, {
        type: "Identifier",
        name: global_object_parameter,
      }),
    },
  ],
});

/**
 * @type {<K>(
 *   key: K,
 * ) => [K, null]}
 */
const toNullEntry = (key) => [key, null];

/**
 * @type {(
 *   dependencies: import("../util/tree.d.ts").Tree<import("./layout.d.ts").Dependency>,
 * ) => import("estree-sentry").Statement<{}>[]}
 */
export const listDeclareDependencyStatement = (dependencies) =>
  map(
    listKey(reduceEntry(mapTree(dependencies, toNullEntry))),
    makeDeclareDependencyStatement,
  );
