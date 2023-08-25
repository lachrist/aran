import { makeJsonExpression } from "../intrinsic.mjs";

import {
  listChild,
  mapBlock,
  mapEffect,
  mapExpression,
  mapStatement,
} from "../query.mjs";

import {
  makeBlock,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makePrimitiveExpression,
  makeReadEnclaveExpression,
  makeReadExpression,
  makeScriptProgram,
  makeWriteEffect,
  makeWriteEnclaveEffect,
  tagNode,
} from "../syntax.mjs";

import {
  DynamicError,
  filter,
  flatMap,
  hasOwn,
  includes,
  map,
  pop,
  pushAll,
} from "../util/index.mjs";

const {
  Array: { isArray },
  undefined,
  Object: { create: createObject, entries: listEntry },
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @typedef {{
 *   type: "read",
 * } | {
 *   type: "define",
 *   initial: Json | undefined,
 * }} Usage
 */

const BASE = "$";

const META = "_";

/** @type {(node: Node) => Usage} */
const getUsageTag = (node) => {
  if (
    hasOwn(node, "tag") &&
    typeof node.tag === "object" &&
    node.tag !== null &&
    hasOwn(node.tag, "type") &&
    (node.tag.type === "read" || node.tag.type === "define")
  ) {
    return /** @type {Usage} */ (node.tag);
  } else {
    throw new DynamicError("invalid block tag", node);
  }
};

/** @type {(node: Node) => string[]} */
const getAccessTag = (node) => {
  if (hasOwn(node, "tag") && isArray(node.tag)) {
    return node.tag;
  } else {
    throw new DynamicError("invalid block tag", node);
  }
};

/** @type {<X, Y>(pair: [X, Y]) => X} */
const getFirst = ([x, _y]) => x;

/*** @type {(variable: string) => string} */
const mangleBaseVariable = (variable) => `${BASE}${variable}`;

/*** @type {(variable: string) => string} */
const mangleMetaVariable = (variable) => `${META}${variable}`;

/** @type {(variable: string) => Expression} */
export const makeBaseReadExpression = (variable) =>
  makeReadExpression(mangleBaseVariable(variable));

/** @type {(variable: string, expression: Expression) => Effect} */
export const makeBaseWriteEffect = (variable, expression) =>
  makeWriteEffect(mangleBaseVariable(variable), expression);

/** @type {(variable: string) => Expression} */
export const makeMetaReadExpression = (variable) =>
  tagNode(makeReadExpression(mangleBaseVariable(variable)), { type: "read" });

/** @type {(variable: string, initial: undefined | Json) => Expression} */
export const makeMetaDefineExpression = (variable, initial) =>
  tagNode(makeReadExpression(mangleBaseVariable(variable)), {
    type: "define",
    initial,
  });

/** @type {(variable: string, expression: Expression) => Effect} */
export const makeMetaWriteEffect = (variable, expression) =>
  makeWriteEffect(mangleMetaVariable(variable), expression);

/** @type {(roots: Node[]) => Record<string, Usage>} */
const recordUsage = (roots) => {
  /** @type {Node[]} */
  const nodes = [...roots];
  /** @type {Record<string, Usage>} */
  const record = createObject(null);
  while (nodes.length > 0) {
    const node = pop(nodes);
    if (node.type === "ReadExpression" && node.variable[0] === META) {
      if (!(node.variable in record) || record[node.variable].type === "read") {
        record[node.variable] = getUsageTag(node);
      }
    }
    if (node.type === "Block") {
      for (const variable of getAccessTag(node)) {
        if (!(variable in record)) {
          record[variable] = { type: "read" };
        }
      }
    } else {
      pushAll(nodes, listChild(node));
    }
  }
  return record;
};

/** @type {(entry: [string, Usage]) => boolean} */
const isAccessEntry = ([_variable, { type }]) => type === "read";

/** @type {(entry: [string, Usage]) => boolean} */
const isDefineEntry = ([_variable, { type }]) => type === "define";

/** @type {(entry: [string, Usage]) => Statement[]} */
const listMetaInitializeStatement = ([variable, usage]) =>
  usage.type === "define" && usage.initial !== undefined
    ? [
        makeEffectStatement(
          makeWriteEffect(
            mangleMetaVariable(variable),
            makeJsonExpression(usage.initial),
          ),
        ),
      ]
    : [];

/**
 * @type {(
 *   labels: string[],
 *   base_variables_array: string[],
 *   meta_definition_array: [string, Json | undefined][],
 *   statements: Statement[],
 * ) => Block}
 */
export const makeLayerBlock = (
  labels,
  base_variable_array,
  meta_definition_array,
  statements,
) => {
  const usages = recordUsage(statements);
  for (const [meta_variable, initial] of meta_definition_array) {
    const variable = mangleMetaVariable(meta_variable);
    if (hasOwn(usages, variable)) {
      // TODO: make sure usages[variable].initial and initial are the same.
      usages[variable] = { type: "define", initial };
    }
  }
  const entries = listEntry(usages);
  return tagNode(
    makeBlock(
      labels,
      [
        ...map(base_variable_array, mangleBaseVariable),
        ...map(filter(entries, isDefineEntry), getFirst),
      ],
      [...flatMap(entries, listMetaInitializeStatement), ...statements],
    ),
    map(filter(entries, isAccessEntry), getFirst),
  );
};

/** @type {Mapper<{prefix: string, variables: string[]}>} */
const enclaveNode = {
  link: (node, _context) => node,
  effect: (node, context) =>
    node.type === "WriteEffect" && includes(context.variables, node.variable)
      ? makeWriteEnclaveEffect(
          `${context.prefix}${node.variable}`,
          mapExpression(node.value, context, enclaveNode),
        )
      : mapEffect(node, context, enclaveNode),
  expression: (node, context) =>
    node.type === "ReadExpression" && includes(context.variables, node.variable)
      ? makeReadEnclaveExpression(`${context.prefix}${node.variable}`)
      : mapExpression(node, context, enclaveNode),
  statement: (node, context) => mapStatement(node, context, enclaveNode),
  block: (node, context) =>
    mapBlock(
      node,
      {
        ...context,
        variables: filter(
          context.variables,
          (variable) => !includes(node.variables, variable),
        ),
      },
      enclaveNode,
    ),
};

/** @type {(prefix: string, entry: [string, Usage]) => Statement} */
const makeMetaDeclareEnclaveExpression = (prefix, [variable, usage]) =>
  makeDeclareEnclaveStatement(
    "let",
    `${prefix}${variable}`,
    usage.type === "define" && usage.initial !== undefined
      ? makeJsonExpression(usage.initial)
      : makePrimitiveExpression({ undefined: null }),
  );

/**
 * @type {(
 *   prefix: string,
 *   meta_definition_array: [string, Json | undefined][],
 *   statements: Statement[],
 * ) => Program}
 */
export const makeLayerScriptProgram = (
  prefix,
  meta_definition_array,
  statements,
) => {
  const usages = recordUsage(statements);
  for (const [meta_variable, initial] of meta_definition_array) {
    const variable = mangleMetaVariable(meta_variable);
    if (hasOwn(usages, variable)) {
      // TODO: make sure usages[variable].initial and initial are the same.
      usages[variable] = { type: "define", initial };
    }
  }
  const context = {
    prefix,
    variables: /** @type {string[]} */ (listKey(usages)),
  };
  const { statement: enclaveStatement } = enclaveNode;
  return makeScriptProgram([
    ...map(listEntry(usages), (entry) =>
      makeMetaDeclareEnclaveExpression(prefix, entry),
    ),
    ...map(statements, (statement) => enclaveStatement(statement, context)),
  ]);
};
