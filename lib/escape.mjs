/* eslint-disable no-use-before-define */

import { includes, map, removeAll } from "./util/index.mjs";
import { AranTypeError } from "./error.mjs";

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.PseudoBlock<A>,
 *   variables: A["Variable"][],
 *   options: import("./escape").Options<A>,
 * ) => aran.PseudoBlock<A>}
 */
export const escapePseudoBlock = (node, variables, options) => ({
  ...node,
  statements: map(node.statements, (statement) =>
    escapeStatement(statement, variables, options),
  ),
  completion: escapeExpression(node.completion, variables, options),
});

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.ControlBlock<A>,
 *   variables: A["Variable"][],
 *   options: import("./escape").Options<A>,
 * ) => aran.ControlBlock<A>}
 */
export const escapeControlBlock = (node, variables, options) => {
  const slice = removeAll(variables, node.variables);
  return slice.length === 0
    ? node
    : {
        ...node,
        statements: map(node.statements, (statement) =>
          escapeStatement(statement, slice, options),
        ),
      };
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.ClosureBlock<A>,
 *   variables: A["Variable"][],
 *   options: import("./escape").Options<A>,
 * ) => aran.ClosureBlock<A>}
 */
export const escapeClosureBlock = (node, variables, options) => {
  const slice = removeAll(variables, node.variables);
  return slice.length === 0
    ? node
    : {
        ...node,
        statements: map(node.statements, (statement) =>
          escapeStatement(statement, slice, options),
        ),
        completion: escapeExpression(node.completion, slice, options),
      };
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Statement<A>,
 *   variables: A["Variable"][],
 *   options: import("./escape").Options<A>,
 * ) => aran.Statement<A>}
 */
export const escapeStatement = (node, variables, options) => {
  switch (node.type) {
    case "EffectStatement": {
      return {
        ...node,
        inner: escapeEffect(node.inner, variables, options),
      };
    }
    case "DeclareGlobalStatement": {
      return node;
    }
    case "ReturnStatement": {
      return {
        ...node,
        result: escapeExpression(node.result, variables, options),
      };
    }
    case "DebuggerStatement": {
      return node;
    }
    case "BreakStatement": {
      return node;
    }
    case "BlockStatement": {
      return {
        ...node,
        do: escapeControlBlock(node.do, variables, options),
      };
    }
    case "IfStatement": {
      return {
        ...node,
        if: escapeExpression(node.if, variables, options),
        then: escapeControlBlock(node.then, variables, options),
        else: escapeControlBlock(node.else, variables, options),
      };
    }
    case "WhileStatement": {
      return {
        ...node,
        while: escapeExpression(node.while, variables, options),
        do: escapeControlBlock(node.do, variables, options),
      };
    }
    case "TryStatement": {
      return {
        ...node,
        try: escapeControlBlock(node.try, variables, options),
        catch: escapeControlBlock(node.catch, variables, options),
        finally: escapeControlBlock(node.finally, variables, options),
      };
    }
    default: {
      throw new AranTypeError("invalid statement", node);
    }
  }
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Effect<A>,
 *   variables: A["Variable"][],
 *   options: import("./escape").Options<A>,
 * ) => aran.Effect<A>}
 */
export const escapeEffect = (node, variables, options) => {
  switch (node.type) {
    case "ExpressionEffect": {
      return {
        ...node,
        discard: escapeExpression(node.discard, variables, options),
      };
    }
    case "ConditionalEffect": {
      return {
        ...node,
        condition: escapeExpression(node.condition, variables, options),
        positive: map(node.positive, (effect) =>
          escapeEffect(effect, variables, options),
        ),
        negative: map(node.negative, (effect) =>
          escapeEffect(effect, variables, options),
        ),
      };
    }
    case "WriteEffect": {
      const { makeWriteEffect } = options;
      return includes(variables, node.variable)
        ? makeWriteEffect(
            node.variable,
            escapeExpression(node.right, variables, options),
            node.tag,
          )
        : {
            ...node,
            right: escapeExpression(node.right, variables, options),
          };
    }
    case "WriteGlobalEffect": {
      return {
        ...node,
        right: escapeExpression(node.right, variables, options),
      };
    }
    case "ExportEffect": {
      return {
        ...node,
        right: escapeExpression(node.right, variables, options),
      };
    }
    default: {
      throw new AranTypeError("invalid effect", node);
    }
  }
};

/**
 * @type {<A extends aran.Atom>(
 *   node: aran.Expression<A>,
 *   variables: A["Variable"][],
 *   options: import("./escape").Options<A>,
 * ) => aran.Expression<A>}
 */
export const escapeExpression = (node, variables, options) => {
  switch (node.type) {
    case "PrimitiveExpression": {
      return node;
    }
    case "IntrinsicExpression": {
      return node;
    }
    case "ImportExpression": {
      return node;
    }
    case "ReadExpression": {
      const { makeReadExpression } = options;
      return includes(variables, node.variable)
        ? makeReadExpression(node.variable, node.tag)
        : node;
    }
    case "FunctionExpression": {
      return {
        ...node,
        body: escapeClosureBlock(node.body, variables, options),
      };
    }
    case "ArrowExpression": {
      return {
        ...node,
        body: escapeClosureBlock(node.body, variables, options),
      };
    }
    case "ReadGlobalExpression": {
      return node;
    }
    case "TypeofGlobalExpression": {
      return node;
    }
    case "AwaitExpression": {
      return {
        ...node,
        promise: escapeExpression(node.promise, variables, options),
      };
    }
    case "YieldExpression": {
      return {
        ...node,
        item: escapeExpression(node.item, variables, options),
      };
    }
    case "SequenceExpression": {
      return {
        ...node,
        head: map(node.head, (node) => escapeEffect(node, variables, options)),
        tail: escapeExpression(node.tail, variables, options),
      };
    }
    case "ConditionalExpression": {
      return {
        ...node,
        condition: escapeExpression(node.condition, variables, options),
        consequent: escapeExpression(node.consequent, variables, options),
        alternate: escapeExpression(node.alternate, variables, options),
      };
    }
    case "EvalExpression": {
      return {
        ...node,
        code: escapeExpression(node.code, variables, options),
      };
    }
    case "ApplyExpression": {
      return {
        ...node,
        callee: escapeExpression(node.callee, variables, options),
        this: escapeExpression(node.this, variables, options),
        arguments: map(node.arguments, (argument) =>
          escapeExpression(argument, variables, options),
        ),
      };
    }
    case "ConstructExpression": {
      return {
        ...node,
        callee: escapeExpression(node.callee, variables, options),
        arguments: map(node.arguments, (argument) =>
          escapeExpression(argument, variables, options),
        ),
      };
    }
    default: {
      throw new AranTypeError("invalid expression", node);
    }
  }
};
