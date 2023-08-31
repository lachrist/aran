import { filter, flatMap, hasOwn, map } from "../util/index.mjs";

import {
  makeEffectStatement,
  makeReadExpression,
  makeWriteEffect,
  makePrimitiveExpression,
  makeClosureBlock,
  makePseudoBlock,
  makeControlBlock,
} from "./syntax.mjs";

import { makeJsonExpression } from "./intrinsic.mjs";

import {
  escapeExpression,
  escapeStatement,
  makeEscapeDeclareStatement,
} from "./escape.mjs";

const {
  undefined,
  Set,
  Set: {
    prototype: { has: hasSet },
  },
  Reflect: { apply, ownKeys: listKey },
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @type {<T>(node: {tag: T}) => T} */
const getTag = ({ tag }) => tag;

/** @type {(variable: string) => boolean} */
const isNewVariable = (variable) => variable[0] === "n";

/** @type {(variable: string) => string} */
const mangleOldVariable = (variable) => `o${variable}`;

/** @type {(path: string, name: string) => string} */
const mangleNewVariable = (path, name) => `n_${path}_${name}`;

/** @type {(variable: string) => string} */
const mangleVarVariable = (variable) => `v${variable}`;

/** @type {(variable: string) => string} */
const mangleLabVariable = (label) => `l${label}`;

/** @type {(variable: string) => Expression<Usage>} */
export const makeOldReadExpression = (variable) =>
  makeReadExpression(mangleOldVariable(variable), {});

/** @type {(variable: string, expression: Expression<Usage>) => Effect<Usage>} */
export const makeOldWriteEffect = (variable, expression) =>
  makeWriteEffect(mangleOldVariable(variable), expression, {});

/** @type {(path: string, name: string, value: Json | undefined) => Expression<Usage>} */
export const makeNewReadExpression = (path, name, value) =>
  makeReadExpression(
    mangleNewVariable(path, name),
    value === undefined ? {} : { value },
  );

/**
 * @type {(
 *   path: string,
 *   name: string,
 *   expression: Expression<Usage>,
 *   value: Json | undefined,
 * ) => Effect<Usage>}
 */
export const makeNewWriteEffect = (path, name, expression, value) =>
  makeWriteEffect(
    mangleNewVariable(path, name),
    expression,
    value === undefined ? {} : { value },
  );

/** @type {(variable: string, value: Json) => Expression<Usage>} */
export const makeVarReadExpression = (variable, value) =>
  makeReadExpression(mangleVarVariable(variable), { value });

/** @type {(label: string, value: Json) => Expression<Usage>} */
export const makeLabReadExpression = (label, value) =>
  makeReadExpression(mangleLabVariable(label), { value });

/** @type {(labels: string[], variables: string[]) => (variable: string) => boolean} */
const compileIsBound = (labels, variables) => {
  const bound = new Set([
    ...map(variables, mangleOldVariable),
    ...map(variables, mangleVarVariable),
    ...map(labels, mangleLabVariable),
  ]);
  return (variable) =>
    isNewVariable(variable) || apply(hasSet, bound, [variable]);
};

/** @type {(entry: [string, Initial]) => Statement<Usage>[]} */
const listInitializeStatement = ([variable, initial]) =>
  hasOwn(initial, "value")
    ? [
        makeEffectStatement(
          makeWriteEffect(
            variable,
            makeJsonExpression(/** @type {Json} */ (initial.value)),
            /** @type {Initial} */ (initial),
          ),
        ),
      ]
    : [];

/** @type {(escape: string, entry: [string, Initial]) => Statement<Usage>} */
const makeEscapeInitializeStatement = (escape, [variable, initial]) =>
  makeEscapeDeclareStatement(
    escape,
    "let",
    variable,
    hasOwn(initial, "value")
      ? makeJsonExpression(/** @type {Json} */ (initial.value))
      : makePrimitiveExpression({ undefined: null }),
  );

/**
 * @type {(
 *   labels: string[],
 *   variables: string[],
 *   statements: Statement<Usage>[],
 * ) => ControlBlock<Usage>}
 */
export const makeLayerControlBlock = (labels, variables, statements) => {
  /** @type {Usage} */
  const usage = reduceEntry(flatMap(map(statements, getTag), listEntry));
  const isBound = compileIsBound(labels, variables);
  return makeControlBlock(
    labels,
    filter(/** @type {string[]} */ (listKey(usage)), isBound),
    [
      ...flatMap(
        filter(listEntry(usage), ([variable, _initial]) => isBound(variable)),
        listInitializeStatement,
      ),
      ...statements,
    ],
  );
};

/**
 * @type {(
 *   variables: string[],
 *   body: Statement<Usage>[],
 *   completion: Expression<Usage>,
 * ) => ClosureBlock<Usage>}
 */
export const makeLayerClosureBlock = (variables, statements, completion) => {
  /** @type {Usage} */
  const usage = {
    ...reduceEntry(flatMap(map(statements, getTag), listEntry)),
    ...completion.tag,
  };
  const isBound = compileIsBound([], variables);
  return makeClosureBlock(
    filter(/** @type {string[]} */ (listKey(usage)), isBound),
    [
      ...flatMap(
        filter(listEntry(usage), ([variable, _initial]) => isBound(variable)),
        listInitializeStatement,
      ),
      ...statements,
    ],
    completion,
  );
};

/**
 * @type {(
 *   escape: string,
 *   statements: Statement<Usage>[],
 *   completion: Expression<Usage>,
 * ) => PseudoBlock<Usage>}
 */
export const makeLayerPseudoBlock = (escape, statements, completion) => {
  /** @type {Usage} */
  const usage = {
    ...reduceEntry(flatMap(map(statements, getTag), listEntry)),
    ...completion.tag,
  };
  const variables = /** @type {string[]} */ (listKey(usage));
  return makePseudoBlock(
    [
      ...map(listEntry(usage), (entry) =>
        makeEscapeInitializeStatement(escape, entry),
      ),
      ...map(statements, (statement) =>
        escapeStatement(statement, escape, variables),
      ),
    ],
    escapeExpression(completion, escape, variables),
  );
};
