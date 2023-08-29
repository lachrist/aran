import { filter, flatMap, hasOwn, map } from "../util/index.mjs";

import {
  makeEffectStatement,
  makeReadExpression,
  makeBlock,
  makeWriteEffect,
  makeClosureExpression,
  makeProgram,
} from "./syntax.mjs";

import { makeJsonExpression } from "./intrinsic.mjs";

import { enclaveExpression, enclaveStatement } from "./enclave.mjs";

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

/** @type {(variable: string, initial: Initial) => Statement<Usage>[]} */
const listInitializeStatement = (variable, initial) =>
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

/**
 * @type {(
 *   labels: string[],
 *   variables: [],
 *   statements: Statement<Usage>[],
 * ) => Block<Usage>}
 */
export const makeLayerBlock = (labels, variables, statements) => {
  /** @type {Usage} */
  const usage = reduceEntry(flatMap(map(statements, getTag), listEntry));
  const slice = filter(
    /** @type {string[]} */ (listKey(usage)),
    compileIsBound(labels, variables),
  );
  return makeBlock(labels, slice, [
    ...flatMap(slice, (variable) =>
      listInitializeStatement(variable, usage[variable]),
    ),
    ...statements,
  ]);
};

/**
 * @type {(
 *   kind: ClosureKind,
 *   asynchronous: boolean,
 *   generator: boolean,
 *   variables: string[],
 *   body: Statement<Usage>[],
 *   completion: Expression<Usage>,
 * ) => Expression<Usage>}
 */
export const makeLayerClosureExpression = (
  kind,
  asynchronous,
  generator,
  variables,
  statements,
  completion,
) => {
  /** @type {Usage} */
  const usage = {
    ...reduceEntry(flatMap(map(statements, getTag), listEntry)),
    ...completion.tag,
  };
  const slice = filter(
    /** @type {string[]} */ (listKey(usage)),
    compileIsBound([], variables),
  );
  return makeClosureExpression(
    kind,
    asynchronous,
    generator,
    slice,
    [
      ...flatMap(slice, (variable) =>
        listInitializeStatement(variable, usage[variable]),
      ),
      ...statements,
    ],
    completion,
  );
};

/**
 * @type {(
 *   escape: string,
 *   kind: ProgramKind,
 *   links: Link[],
 *   variables: string[],
 *   body: Statement<Usage>[],
 *   completion: Expression<Usage>,
 * ) => Program<Usage>}
 */
export const makeLayerProgram = (
  escape,
  kind,
  links,
  variables,
  statements,
  completion,
) => {
  /** @type {Usage} */
  const usage = {
    ...reduceEntry(flatMap(map(statements, getTag), listEntry)),
    ...completion.tag,
  };
  const slice = filter(
    /** @type {string[]} */ (listKey(usage)),
    compileIsBound([], variables),
  );
  if (kind === "script") {
    return makeProgram(
      "script",
      [],
      [],
      map(statements, (statement) =>
        enclaveStatement(statement, escape, slice),
      ),
      enclaveExpression(completion, escape, slice),
    );
  } else {
    return makeProgram(
      kind,
      links,
      slice,
      [
        ...flatMap(slice, (variable) =>
          listInitializeStatement(variable, usage[variable]),
        ),
        ...statements,
      ],
      completion,
    );
  }
};
