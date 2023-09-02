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

const NEW = "n";

const OLD = "o";

const VAR = "v";

const LAB = "l";

/** @type {<T>(node: {tag: T}) => T} */
const getTag = ({ tag }) => tag;

/** @type {(variable: Variable) => boolean} */
const isNewVariable = (variable) => variable[0] === NEW;

/** @type {(variable: Variable) => Variable} */
const mangleOldVariable = (variable) =>
  /** @type {Variable} */ (`${OLD}${variable}`);

/** @type {(name: string) => Variable} */
const mangleNewVariable = (name) => /** @type {Variable} */ (`${OLD}${name}`);

/** @type {(variable: Variable) => Variable} */
const mangleVarVariable = (variable) =>
  /** @type {Variable} */ (`${VAR}${variable}`);

/** @type {(label: Label) => Variable} */
const mangleLabVariable = (label) => /** @type {Variable} */ (`${LAB}${label}`);

/** @type {(variable: Variable) => Expression<Usage>} */
export const makeOldReadExpression = (variable) =>
  makeReadExpression(mangleOldVariable(variable), {});

/** @type {(variable: Variable, expression: Expression<Usage>) => Effect<Usage>} */
export const makeOldWriteEffect = (variable, expression) =>
  makeWriteEffect(mangleOldVariable(variable), expression, {});

/** @type {(variable: Variable, value: Json | undefined) => Expression<Usage>} */
export const makeNewReadExpression = (variable, value) =>
  makeReadExpression(
    mangleNewVariable(variable),
    value === undefined ? {} : { value },
  );

/** @type {(node: Node<Usage>, name: string) => boolean} */
export const hasNewVariable = (node, name) =>
  hasOwn(node.tag, mangleNewVariable(name));

/**
 * @type {(
 *   variable: Variable,
 *   expression: Expression<Usage>,
 *   value: Json | undefined,
 * ) => Effect<Usage>}
 */
export const makeNewWriteEffect = (variable, expression, value) =>
  makeWriteEffect(
    mangleNewVariable(variable),
    expression,
    value === undefined ? {} : { value },
  );

/** @type {(variable: Variable, value: Json) => Expression<Usage>} */
export const makeVarReadExpression = (variable, value) =>
  makeReadExpression(mangleVarVariable(variable), { value });

/** @type {(label: Label, value: Json) => Expression<Usage>} */
export const makeLabReadExpression = (label, value) =>
  makeReadExpression(mangleLabVariable(label), { value });

/** @type {(labels: Label[], variables: Variable[]) => (variable: Variable) => boolean} */
const compileIsBound = (labels, variables) => {
  const bound = new Set([
    ...map(variables, mangleOldVariable),
    ...map(variables, mangleVarVariable),
    ...map(labels, mangleLabVariable),
  ]);
  return (variable) =>
    isNewVariable(variable) || apply(hasSet, bound, [variable]);
};

/** @type {(entry: [Variable, Initial]) => Statement<Usage>[]} */
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

/** @type {(escape: string, entry: [Variable, Initial]) => Statement<Usage>} */
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
 *   labels: Label[],
 *   variables: Variable[],
 *   statements: Statement<Usage>[],
 * ) => ControlBlock<Usage>}
 */
export const makeLayerControlBlock = (labels, variables, statements) => {
  /** @type {Usage} */
  const usage = reduceEntry(flatMap(map(statements, getTag), listEntry));
  const isBound = compileIsBound(labels, variables);
  return makeControlBlock(
    labels,
    filter(/** @type {Variable[]} */ (listKey(usage)), isBound),
    [
      ...flatMap(
        filter(
          /** @type {[Variable, Initial][]} */ (listEntry(usage)),
          ([variable, _initial]) => isBound(variable),
        ),
        listInitializeStatement,
      ),
      ...statements,
    ],
  );
};

/**
 * @type {(
 *   variables: Variable[],
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
    filter(/** @type {Variable[]} */ (listKey(usage)), isBound),
    [
      ...flatMap(
        filter(
          /** @type {[Variable, Initial][]} */ (listEntry(usage)),
          ([variable, _initial]) => isBound(variable),
        ),
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
  const variables = /** @type {Variable[]} */ (listKey(usage));
  return makePseudoBlock(
    [
      ...map(/** @type {[Variable, Initial][]} */ (listEntry(usage)), (entry) =>
        makeEscapeInitializeStatement(escape, entry),
      ),
      ...map(statements, (statement) =>
        escapeStatement(statement, escape, variables),
      ),
    ],
    escapeExpression(completion, escape, variables),
  );
};
