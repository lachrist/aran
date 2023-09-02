import {
  filter,
  includes,
  map,
  push,
  pushAll,
  reduce,
  reduceReverse,
  slice,
} from "../util/index.mjs";
import {
  listChild,
  mapEffect,
  mapExpression,
  mapProgram,
  mapStatement,
} from "../query.mjs";
import {
  makeEffectStatement,
  makeSequenceExpression,
} from "../deconstruct/syntax.mjs";

const NO_ACCESS = 1;
const READ_ACCESS = 2;
const WRITE_ACCESS = 3;

const READ_WRITE_ACCESS = READ_ACCESS * WRITE_ACCESS;

/** @type {<T>(node: Node<T>, variable: string) => number} */
const getAccess = (node, variable) => {
  switch (node.type) {
    case "Block":
      return includes(node.variables, variable)
        ? NO_ACCESS
        : reduce(
            node.statements,
            (access, child) => access * getAccess(child, variable),
            NO_ACCESS,
          );
    case "ReadExpression":
      return node.variable === variable ? READ_ACCESS : NO_ACCESS;
    case "WriteEffect":
      return node.variable === variable
        ? WRITE_ACCESS
        : NO_ACCESS * getAccess(node.value, variable);
    default:
      return reduce(
        listChild(node),
        (access, child) => access * getAccess(child, variable),
        0,
      );
  }
};

/**
 * @type {<T>(
 *   node: Block<T>,
 *   singleton: string[],
 *   predicate: (variable: string) => boolean,
 * ) => string[]}
 */
const updateBlockSingleton = (node, singleton, predicate) => [
  ...filter(singleton, (variable) => !includes(node.variables, variable)),
  ...filter(
    node.variables,
    (variable) =>
      predicate(variable) && getAccess(node, variable) === READ_WRITE_ACCESS,
  ),
];

/**
 * @type {<T>(
 *   effect1: Effect<T>,
 *   effect2: Effect<T>,
 *   singleton: string[],
 * ) => Effect<T> | null}
 */
const optimizeEffectPair = (effect1, effect2, singleton) =>
  effect1.type === "WriteEffect" &&
  effect2.type === "WriteEffect" &&
  effect2.value.type === "ReadExpression" &&
  effect2.value.variable === effect1.variable &&
  includes(singleton, effect1.variable)
    ? {
        type: "WriteEffect",
        variable: effect2.variable,
        value: effect1.value,
        tag: effect2.tag,
      }
    : null;

/**
 * @type {<T>(
 *   effect: Effect<T>[],
 *   singleton: string[],
 * ) => Effect<T>[]}
 */
const optimizeEffectArray = (nodes, singleton) => {
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const maybe_effect = optimizeEffectPair(
      nodes[index],
      nodes[index + 1],
      singleton,
    );
    if (maybe_effect !== null) {
      return optimizeEffectArray(
        [
          ...slice(nodes, 0, index),
          maybe_effect,
          ...slice(nodes, index + 2, nodes.length),
        ],
        singleton,
      );
    }
  }
  return nodes;
};

/** @type {<T>(expression: Expression<T>, effect: Effect<T>) => Expression<T>} */
const accumulateEffect = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/**
 * @template T
 * @param {Expression<T>} node
 * @return {{ effects: Effect<T>[], expression: Expression<T>}}
 */
const stripExpressionEffect = (node) => {
  /** @type {Effect<T>[]} */
  const effects = [];
  while (node.type === "SequenceExpression") {
    push(effects, node.effect);
    node = node.value;
  }
  return { effects, expression: node };
};

/**
 * @template T
 * @param {Statement<T>[]} nodes
 * @param {string[]} singleton
 * @return {Statement<T>[]}
 */
const optimizeStatementArray = (nodes, singleton) => {
  /** @type {(Statement<T>)[]} */
  const statements = [];
  /** @type {Effect<T>[]} */
  const effects = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.type === "EffectStatement") {
      push(effects, node.effect);
    } else {
      if (effects.length > 0) {
        pushAll(
          statements,
          map(optimizeEffectArray(effects, singleton), makeEffectStatement),
        );
        effects.length = 0;
      }
      push(statements, node);
    }
  }
  if (effects.length > 0) {
    pushAll(
      statements,
      map(optimizeEffectArray(effects, singleton), makeEffectStatement),
    );
  }
  return statements;
};

/**
 * @template T
 * @param {string[]} singleton
 * @param {(variable: string) => boolean} predicate
 * @return {Mapper<T>}
 */
const compileMapper = (singleton, predicate) => {
  /** @type {Mapper<T>} */
  const mapper = {
    link: (node) => node,
    block: (node) => {
      const new_singleton = updateBlockSingleton(node, singleton, predicate);
      const new_mapper = compileMapper(new_singleton, predicate);
      return {
        ...node,
        statements: map(
          optimizeStatementArray(node.statements, new_singleton),
          new_mapper.statement,
        ),
      };
    },
    effect: (node) => mapEffect(node, mapper),
    statement: (node) => mapStatement(node, mapper),
    expression: (node) => {
      if (node.type === "SequenceExpression") {
        const { effects, expression } = stripExpressionEffect(node);
        return reduceReverse(
          map(optimizeEffectArray(effects, singleton), mapper.effect),
          accumulateEffect,
          mapExpression(expression, mapper),
        );
      }
      return mapExpression(node, mapper);
    },
  };
  return mapper;
};

/**
 * @type {<T>(
 *   node: Program<T>,
 *   predicate: (variable: string) => boolean,
 * ) => Program<T>}
 */
export const optimizeSingleton = (node, predicate) =>
  mapProgram(node, compileMapper([], predicate));
