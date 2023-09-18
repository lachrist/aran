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
  makeClosureExpression,
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
 * @type {<T>(
 *   escape: estree.Variable,
 *   kind: aran.VariableKind,
 *   variable: unbuild.Variable,
 *   value: aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>}
 */
export const makeEscapeDeclareStatement = (
  escape,
  kind,
  variable,
  value,
  tag,
) =>
  makeDeclareEnclaveStatement(
    kind,
    escapeVariable(escape, variable),
    value,
    tag,
  );

/**
 * @type {<T>(
 *   node: aran.ControlBlock<unbuild.Atom<T>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.ControlBlock<unbuild.Atom<T>>}
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
        node.tag,
      );
};

/**
 * @type {<T>(
 *   node: aran.ClosureBlock<unbuild.Atom<T>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.ClosureBlock<unbuild.Atom<T>>}
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
        node.tag,
      );
};

/**
 * @type {<T>(
 *   node: aran.Statement<unbuild.Atom<T>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.Statement<unbuild.Atom<T>>}
 */
export const escapeStatement = (node, escape, variables) => {
  switch (node.type) {
    case "EffectStatement":
      return makeEffectStatement(
        escapeEffect(node.inner, escape, variables),
        node.tag,
      );
    case "DeclareEnclaveStatement":
      return makeDeclareEnclaveStatement(
        node.kind,
        node.variable,
        escapeExpression(node.right, escape, variables),
        node.tag,
      );
    case "ReturnStatement":
      return makeReturnStatement(
        escapeExpression(node.result, escape, variables),
        node.tag,
      );
    case "DebuggerStatement":
      return node;
    case "BreakStatement":
      return node;
    case "BlockStatement":
      return makeBlockStatement(
        escapeControlBlock(node.do, escape, variables),
        node.tag,
      );
    case "IfStatement":
      return makeIfStatement(
        escapeExpression(node.if, escape, variables),
        escapeControlBlock(node.then, escape, variables),
        escapeControlBlock(node.else, escape, variables),
        node.tag,
      );
    case "WhileStatement":
      return makeWhileStatement(
        escapeExpression(node.while, escape, variables),
        escapeControlBlock(node.do, escape, variables),
        node.tag,
      );
    case "TryStatement":
      return makeTryStatement(
        escapeControlBlock(node.try, escape, variables),
        escapeControlBlock(node.catch, escape, variables),
        escapeControlBlock(node.finally, escape, variables),
        node.tag,
      );
    default:
      throw new StaticError("invalid statement", node);
  }
};

/**
 * @type {<T>(
 *   node: aran.Effect<unbuild.Atom<T>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.Effect<unbuild.Atom<T>>}
 */
export const escapeEffect = (node, escape, variables) => {
  switch (node.type) {
    case "ExpressionEffect":
      return makeExpressionEffect(
        escapeExpression(node.discard, escape, variables),
        node.tag,
      );
    case "ConditionalEffect":
      return makeConditionalEffect(
        escapeExpression(node.condition, escape, variables),
        map(node.positive, (effect) => escapeEffect(effect, escape, variables)),
        map(node.negative, (effect) => escapeEffect(effect, escape, variables)),
        node.tag,
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
            node.tag,
          )
        : makeWriteEffect(
            node.variable,
            escapeExpression(node.right, escape, variables),
            node.tag,
          );
    case "WriteEnclaveEffect":
      return makeWriteEnclaveEffect(
        node.variable,
        escapeExpression(node.right, escape, variables),
        node.tag,
      );
    case "ExportEffect":
      return makeExportEffect(
        node.export,
        escapeExpression(node.right, escape, variables),
        node.tag,
      );
    default:
      throw new StaticError("invalid effect", node);
  }
};

/**
 * @type {<T>(
 *   node: aran.Expression<unbuild.Atom<T>>,
 *   escape: estree.Variable,
 *   variables: unbuild.Variable[],
 * ) => aran.Expression<unbuild.Atom<T>>}
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
            node.tag,
          )
        : makeReadExpression(node.variable, node.tag);
    case "ClosureExpression": {
      return makeClosureExpression(
        node.kind,
        node.asynchronous,
        node.generator,
        escapeClosureBlock(node.body, escape, variables),
        node.tag,
      );
    }
    case "ReadEnclaveExpression":
      return node;
    case "TypeofEnclaveExpression":
      return node;
    case "AwaitExpression":
      return makeAwaitExpression(
        escapeExpression(node.promise, escape, variables),
        node.tag,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        escapeExpression(node.item, escape, variables),
        node.tag,
      );
    case "SequenceExpression":
      return makeSequenceExpression(
        escapeEffect(node.head, escape, variables),
        escapeExpression(node.tail, escape, variables),
        node.tag,
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        escapeExpression(node.condition, escape, variables),
        escapeExpression(node.consequent, escape, variables),
        escapeExpression(node.alternate, escape, variables),
        node.tag,
      );
    case "EvalExpression":
      return makeEvalExpression(
        escapeExpression(node.code, escape, variables),
        node.tag,
      );
    case "ApplyExpression":
      return makeApplyExpression(
        escapeExpression(node.callee, escape, variables),
        escapeExpression(node.this, escape, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, escape, variables),
        ),
        node.tag,
      );
    case "ConstructExpression":
      return makeConstructExpression(
        escapeExpression(node.callee, escape, variables),
        map(node.arguments, (argument) =>
          escapeExpression(argument, escape, variables),
        ),
        node.tag,
      );
    default:
      throw new StaticError("invalid expression", node);
  }
};
