import { filter, flatMap, hasOwn, map } from "../lib/util/index.mjs";

import {
  makeEffectStatement,
  makeReadExpression,
  makeWriteEffect,
  makePrimitiveExpression,
  makeClosureBlock,
  makePseudoBlock,
  makeControlBlock,
} from "../lib/instrument/syntax.mjs";

import { makeJsonExpression } from "../lib/instrument/intrinsic.mjs";

import {
  escapeExpression,
  escapeStatement,
  makeEscapeDeclareStatement,
} from "../lib/instrument/escape.mjs";
import {
  ADVICE_VARIABLE,
  COMPLETION_VARIABLE,
  mangleCalleeVariable,
  mangleLabelVariable,
  mangleParameterVariable,
  mangleSerialVariable,
  mangleShadowVariable,
} from "../lib/instrument/mangle.mjs";

const {
  undefined,
  Set,
  Set: {
    prototype: { has: hasSet },
  },
  Reflect: { apply, ownKeys: listKey },
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @type {<L extends Json>(value: L, stringifyLabel: (value: L) => Label) => Expression<Usage>} */
export const makeLabelReadExpression = (value, stringifyLabel) =>
  makeReadExpression(mangleLabelVariable(stringifyLabel(value)), { value });

/** @type {<V extends Json>(value: V, stringifyLabel: (value: V) => Variable) => Expression<Usage>} */
export const makeShadowReadExpression = (value, stringifyVariable) =>
  makeReadExpression(mangleShadowVariable(stringifyVariable(value)), { value });

/** @type {<S extends Json>(path: string, value: S) => Expression<Usage>} */
export const makeSerialReadExpression = (path, value) =>
  makeReadExpression(mangleSerialVariable(path), { value });

/** @type {(path: string) => Expression<Usage>} */
export const makeCalleeReadExpression = (path) =>
  makeReadExpression(mangleCalleeVariable(path), {});

/** @type {(path: string, expression: Expression<Usage>) => Effect<Usage>} */
export const makeCalleeWriteEffect = (path, expression) =>
  makeWriteEffect(mangleCalleeVariable(path), expression, {});

/** @type {(parameter: Parameter | null) => Expression<Usage>} */
export const makeParameterReadExpression = (parameter) =>
  makeReadExpression(mangleParameterVariable(parameter), {});

/** @type {(parameter: Parameter | null) => Expression<Usage>} */
export const makeParameterWriteEffect = (parameter) =>
  makeReadExpression(mangleParameterVariable(parameter), {});

/** @type {() => Expression<Usage>} */
export const makeAdviceReadExpression = () =>
  makeReadExpression(ADVICE_VARIABLE, {});

/** @type {(expression: Expression<Usage>) => Effect<Usage>} */
export const makeAdviceWriteEffect = (expression) =>
  makeWriteEffect(ADVICE_VARIABLE, expression, {});

/** @type {() => Expression<Usage>} */
export const makeCompletionReadExpression = () =>
  makeReadExpression(COMPLETION_VARIABLE, {});

/** @type {(expression: Expression<Usage>) => Effect<Usage>} */
export const makeCompletionWriteEffect = (expression) =>
  makeWriteEffect(COMPLETION_VARIABLE, expression, {});

export const listPreludeStatement = () => {};

export const listEnclavePreludeStatement = () => {};

//
//
//
//
//

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
