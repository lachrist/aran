/* eslint-disable no-use-before-define */

import {
  StaticError,
  escapeDot,
  includes,
  map,
  removeAll,
} from "../../util/index.mjs";

import {
  makeApplyExpression,
  makeFunctionExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeReadEnclaveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeAwaitExpression,
  makeControlBlock,
  makeClosureBlock,
  makeBlockStatement,
  makeConstructExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeReturnStatement,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEffect,
  makeWriteEnclaveEffect,
  makeYieldExpression,
  makeConditionalEffect,
  getSerial,
  isInitialization,
  getEvalContext,
} from "../node.mjs";

/**
 * @type {(
 *   escape: estree.Variable,
 *   variable: unbuild.Variable,
 * ) => estree.Variable}
 */
const escapeVariable = (escape, variable) =>
  /** @type {estree.Variable} */ (`${escape}${escapeDot(variable)}`);

/**
 * @type {<S>(
 *   escape: estree.Variable,
 *   kind: aran.VariableKind,
 *   variable: unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const makeEscapeDeclareStatement = (
  escape,
  kind,
  variable,
  value,
  serial,
) =>
  makeDeclareEnclaveStatement(
    kind,
    escapeVariable(escape, variable),
    value,
    serial,
  );

/**
 * @type {<S>(
 *   node: aran.ControlBlock<unbuild.Atom<S>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const escapeControlBlock = (node, escape, variables) => {
  const slice = /** @type {unbuild.Variable[]} */ (
    removeAll(/** @type {string[]} */ (variables), node.variables)
  );
  return slice.length === 0
    ? node
    : makeControlBlock(
        node.labels,
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, escape, slice),
        ),
        getSerial(node),
      );
};

/**
 * @type {<S>(
 *   node: aran.ClosureBlock<unbuild.Atom<S>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.ClosureBlock<unbuild.Atom<S>>}
 */
export const escapeClosureBlock = (node, escape, variables) => {
  const slice = /** @type {unbuild.Variable[]} */ (
    removeAll(/** @type {string[]} */ (variables), node.variables)
  );
  return slice.length === 0
    ? node
    : makeClosureBlock(
        node.variables,
        map(node.statements, (statement) =>
          escapeStatement(statement, escape, slice),
        ),
        escapeExpression(node.completion, escape, slice),
        getSerial(node),
      );
};

/**
 * @type {<S>(
 *   node: aran.Statement<unbuild.Atom<S>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.Statement<unbuild.Atom<S>>}
 */
export const escapeStatement = (node, escape, variables) => {
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(
        escapeEffect(node.inner, escape, variables),
        getSerial(node),
      );
    case "DeclareEnclaveStatement":
      return makeDeclareEnclaveStatement(
        node.kind,
        node.variable,
        escapeExpression(node.right, escape, variables),
        getSerial(node),
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, escape, variables),
        getSerial(node),
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(
        escapeControlBlock(node.do, escape, variables),
        getSerial(node),
      );
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, escape, variables),
        escapeControlBlock(node.then, escape, variables),
        escapeControlBlock(node.else, escape, variables),
        getSerial(node),
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, escape, variables),
        escapeControlBlock(node.do, escape, variables),
        getSerial(node),
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, escape, variables),
        escapeControlBlock(node.catch, escape, variables),
        escapeControlBlock(node.finally, escape, variables),
        getSerial(node),
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/**
 * @type {<S>(
 *   node: aran.Effect<unbuild.Atom<S>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.Effect<unbuild.Atom<S>>}
 */
export const escapeEffect = (node, escape, variables) => {
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, escape, variables),
        getSerial(node),
      );
    case "ConditionalEffect":
      return makeConditionalEffect(
        escapeExpression(node.condition, escape, variables),
        map(node.positive, (effect) => escapeEffect(effect, escape, variables)),
        map(node.negative, (effect) => escapeEffect(effect, escape, variables)),
        getSerial(node),
      );
    case "WriteEffect":
      return includes(/** @type {string []} */ (variables), node.variable)
        ? makeWriteEnclaveEffect(
            escapeVariable(
              escape,
              /** @type {unbuild.Variable} */ (
                /** @type {string} */ (node.variable)
              ),
            ),
            escapeExpression(node.right, escape, variables),
            getSerial(node),
          )
        : makeWriteEffect(
            node.variable,
            escapeExpression(node.right, escape, variables),
            getSerial(node),
            isInitialization(node),
          );
    case "WriteEnclaveEffect":
      return makeWriteEnclaveEffect(
        node.variable,
        escapeExpression(node.right, escape, variables),
        getSerial(node),
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, escape, variables),
        getSerial(node),
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/**
 * @type {<S>(
 *   node: aran.Expression<unbuild.Atom<S>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const escapeExpression = (node, escape, variables) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return node;
    case "IntrinsicExpression":
      return node;
    case "ImportExpression":
      return node;
    case "ReadExpression":
      return includes(/** @type {string[]} */ (variables), node.variable)
        ? makeReadEnclaveExpression(
            escapeVariable(
              escape,
              /** @type {unbuild.Variable} */ (node.variable),
            ),
            getSerial(node),
          )
        : makeReadExpression(node.variable, getSerial(node));
    case "FunctionExpression": {
      return makeFunctionExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, escape, variables),
        getSerial(node),
      );
    }
    case "ReadEnclaveExpression":
      return node;
    case "TypeofEnclaveExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, escape, variables),
        getSerial(node),
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, escape, variables),
        getSerial(node),
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, escape, variables),
        escapeExpression(node.tail, escape, variables),
        getSerial(node),
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, escape, variables),
        escapeExpression(node.consequent, escape, variables),
        escapeExpression(node.alternate, escape, variables),
        getSerial(node),
      );
    case "EvalExpression":
      return makeEvalExpression(
        escapeExpression(node.code, escape, variables),
        getSerial(node),
        getEvalContext(node),
      );
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, escape, variables),
        escapeExpression(node.this, escape, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, escape, variables),
        ),
        getSerial(node),
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, escape, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, escape, variables),
        ),
        getSerial(node),
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
