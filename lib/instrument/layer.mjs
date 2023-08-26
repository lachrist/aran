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
 *   type: "access",
 * } | {
 *   type: "define",
 *   initial: Json | undefined,
 * }} Usage
 */

const BASE = "$";

const META = "_";

/** @type {<N extends Node>(node: N, usage: Usage) => N} */
const tagUsage = tagNode;

/** @type {<N extends Node>(node: N, record: [string, Usage][]) => N} */
const tagUsageRecord = tagNode;

// TODO: complete type assertion.
/** @type {(tag: unknown) => tag is Usage} */
const isUsage = (tag) =>
  typeof tag === "object" &&
  tag !== null &&
  hasOwn(tag, "type") &&
  (tag.type === "access" || tag.type === "define");

/** @type {(node: Node) => Usage} */
const getUsage = (node) => {
  if (hasOwn(node, "tag") && isUsage(node.tag)) {
    return node.tag;
  } else {
    throw new DynamicError("invalid usage tag", node);
  }
};

// TODO: complete type assertion.
/** @type {(tag: unknown) => tag is [string, Usage][]} */
const isUsageRecord = (tag) => typeof tag === "object" && isArray(tag);

/** @type {(node: Node) => [string, Usage][]} */
const getUsageRecord = (node) => {
  if (hasOwn(node, "tag") && isUsageRecord(node.tag)) {
    return node.tag;
  } else {
    throw new DynamicError("invalid usage record tag", node);
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
  tagUsage(makeReadExpression(mangleBaseVariable(variable)), {
    type: "access",
  });

/** @type {(variable: string, initial: Json) => Expression} */
export const makeMetaDeclareExpression = (variable, initial) =>
  tagUsage(makeReadExpression(mangleBaseVariable(variable)), {
    type: "define",
    initial,
  });

/** @type {(variable: string, expression: Expression) => Effect} */
export const makeMetaWriteEffect = (variable, expression) =>
  tagUsage(makeWriteEffect(mangleMetaVariable(variable), expression), {
    type: "access",
  });

/** @type {(variable: string, expression: Expression) => Effect} */
export const makeMetaInitializeEffect = (variable, expression) =>
  tagUsage(makeWriteEffect(mangleMetaVariable(variable), expression), {
    type: "define",
    initial: undefined,
  });

/** @type {(usages: Record<string, Usage>, variable: string, usage: Usage) => void} */
const addUsage = (usages, variable, usage) => {
  // TODO: check usage.initial compatibility.
  if (!hasOwn(usages, variable) || usages[variable].type === "access") {
    usages[variable] = usage;
  }
};

/** @type {(roots: Node[]) => Record<string, Usage>} */
const recordUsage = (roots) => {
  /** @type {Node[]} */
  const nodes = [...roots];
  /** @type {Record<string, Usage>} */
  const usages = createObject(null);
  while (nodes.length > 0) {
    const node = pop(nodes);
    if (
      (node.type === "ReadExpression" || node.type === "WriteEffect") &&
      node.variable[0] === META
    ) {
      addUsage(usages, node.variable, getUsage(node));
    }
    if (node.type === "Block") {
      for (const [variable, usage] of getUsageRecord(node)) {
        addUsage(usages, variable, usage);
      }
    } else {
      pushAll(nodes, listChild(node));
    }
  }
  return usages;
};

/** @type {(entry: [string, Usage]) => boolean} */
const isAccessEntry = ([_variable, { type }]) => type === "access";

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

/** @type {(statements: Statement[]) => Block} */
export const makeTransparentBlock = (statements) =>
  tagUsageRecord(
    makeBlock([], [], statements),
    listEntry(recordUsage(statements)),
  );

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
  for (const [variable, initial] of meta_definition_array) {
    addUsage(usages, mangleMetaVariable(variable), {
      type: "define",
      initial,
    });
  }
  const entries = listEntry(usages);
  return tagUsageRecord(
    makeBlock(
      labels,
      [
        ...map(base_variable_array, mangleBaseVariable),
        ...map(filter(entries, isDefineEntry), getFirst),
      ],
      [...flatMap(entries, listMetaInitializeStatement), ...statements],
    ),
    filter(entries, isAccessEntry),
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

/** @type {(nodes: Node[], variable: string) => boolean} */
export const hasMetaReadExpression = (roots, meta_variable) => {
  const variable = mangleMetaVariable(meta_variable);
  /** @type {Node[]} */
  const nodes = [...roots];
  while (nodes.length > 0) {
    const node = pop(nodes);
    if (node.type === "ReadExpression" && node.variable === variable) {
      return true;
    }
    if (node.type === "Block") {
      for (const [present_variable, _usage] of getUsageRecord(node)) {
        if (present_variable === variable) {
          return true;
        }
      }
    } else {
      pushAll(nodes, listChild(node));
    }
  }
  return false;
};
