import {
  StaticError,
  some,
  reduce,
  pop,
  push,
  includes,
  removeDuplicate,
  pushAll,
} from "./util/index.mjs";

/** @type {<T, X>(node: Node<T>, combine: (current: X, node: Node<T>) => X, initial: X) => X} */
export const reduceChild = (node, combine, initial) => {
  switch (node.type) {
    // Program //
    case "ScriptProgram":
      return combine(initial, node.body);
    case "ModuleProgram":
      return combine(initial, node.body);
    case "EvalProgram":
      return combine(initial, node.body);
    // Link //
    case "ImportLink":
      return initial;
    case "ExportLink":
      return initial;
    case "AggregateLink":
      return initial;
    // Block //
    case "ControlBlock":
      return reduce(node.statements, combine, initial);
    case "ClosureBlock":
      return combine(
        reduce(node.statements, combine, initial),
        node.completion,
      );
    case "PseudoBlock":
      return combine(
        reduce(node.statements, combine, initial),
        node.completion,
      );
    // Statement //
    case "EffectStatement":
      return combine(initial, node.inner);
    case "ReturnStatement":
      return combine(initial, node.result);
    case "BreakStatement":
      return initial;
    case "DebuggerStatement":
      return initial;
    case "DeclareEnclaveStatement":
      return combine(initial, node.right);
    case "BlockStatement":
      return combine(initial, node.do);
    case "IfStatement":
      return combine(combine(combine(initial, node.if), node.then), node.else);
    case "WhileStatement":
      return combine(combine(initial, node.while), node.do);
    case "TryStatement":
      return combine(
        combine(combine(initial, node.try), node.catch),
        node.finally,
      );
    // Effect //
    case "ConditionalEffect":
      return reduce(
        node.negative,
        combine,
        reduce(node.positive, combine, combine(initial, node.condition)),
      );
    case "WriteEffect":
      return combine(initial, node.right);
    case "WriteEnclaveEffect":
      return combine(initial, node.right);
    case "ExportEffect":
      return combine(initial, node.right);
    case "ExpressionEffect":
      return combine(initial, node.discard);
    // Expression //
    case "ParameterExpression":
      return initial;
    case "PrimitiveExpression":
      return initial;
    case "IntrinsicExpression":
      return initial;
    case "ImportExpression":
      return initial;
    case "ReadExpression":
      return initial;
    case "ReadEnclaveExpression":
      return initial;
    case "TypeofEnclaveExpression":
      return initial;
    case "ClosureExpression":
      return combine(initial, node.body);
    case "AwaitExpression":
      return combine(initial, node.promise);
    case "YieldExpression":
      return combine(initial, node.item);
    case "SequenceExpression":
      return combine(combine(initial, node.head), node.tail);
    case "ConditionalExpression":
      return combine(
        combine(combine(initial, node.condition), node.consequent),
        node.alternate,
      );
    case "EvalExpression":
      return combine(initial, node.code);
    case "ApplyExpression":
      return reduce(
        node.arguments,
        combine,
        combine(combine(initial, node.callee), node.this),
      );
    case "ConstructExpression":
      return reduce(node.arguments, combine, combine(initial, node.callee));
    default:
      throw new StaticError("invalid node", node);
  }
};

/** @type {<T>(node: Node<T>) => Node<T>[]} */
export const listChild = (node) => {
  switch (node.type) {
    // Program //
    case "ScriptProgram":
      return [node.body];
    case "ModuleProgram":
      return [node.body];
    case "EvalProgram":
      return [node.body];
    // Link //
    case "ImportLink":
      return [];
    case "ExportLink":
      return [];
    case "AggregateLink":
      return [];
    // Block //
    case "ControlBlock":
      return node.statements;
    case "ClosureBlock":
      return [...node.statements, node.completion];
    case "PseudoBlock":
      return [...node.statements, node.completion];
    // Statement //
    case "EffectStatement":
      return [node.inner];
    case "ReturnStatement":
      return [node.result];
    case "BreakStatement":
      return [];
    case "DebuggerStatement":
      return [];
    case "DeclareEnclaveStatement":
      return [node.right];
    case "BlockStatement":
      return [node.do];
    case "IfStatement":
      return [node.if, node.then, node.else];
    case "WhileStatement":
      return [node.while, node.do];
    case "TryStatement":
      return [node.try, node.catch, node.finally];
    // Effect //
    case "ConditionalEffect":
      return [node.condition, ...node.positive, ...node.negative];
    case "WriteEffect":
      return [node.right];
    case "WriteEnclaveEffect":
      return [node.right];
    case "ExportEffect":
      return [node.right];
    case "ExpressionEffect":
      return [node.discard];
    // Expression //
    case "ParameterExpression":
      return [];
    case "PrimitiveExpression":
      return [];
    case "IntrinsicExpression":
      return [];
    case "ImportExpression":
      return [];
    case "ReadExpression":
      return [];
    case "ReadEnclaveExpression":
      return [];
    case "TypeofEnclaveExpression":
      return [];
    case "ClosureExpression":
      return [node.body];
    case "AwaitExpression":
      return [node.promise];
    case "YieldExpression":
      return [node.item];
    case "SequenceExpression":
      return [node.head, node.tail];
    case "ConditionalExpression":
      return [node.condition, node.consequent, node.alternate];
    case "EvalExpression":
      return [node.code];
    case "ApplyExpression":
      return [node.callee, node.this, ...node.arguments];
    case "ConstructExpression":
      return [node.callee, ...node.arguments];
    default:
      throw new StaticError("invalid node", node);
  }
};

/** @type {(node: Node<unknown>) => boolean} */
export const hasImportParameter = (node) => {
  if (node.type === "ParameterExpression" && node.parameter === "import") {
    return true;
  } else {
    return some(listChild(node), hasImportParameter);
  }
};

/** @type {(node: Node<unknown>) => boolean} */
export const hasSuperGetParameter = (node) => {
  if (node.type === "ClosureExpression" && node.kind !== "arrow") {
    return false;
  } else if (
    node.type === "ParameterExpression" &&
    node.parameter === "super.get"
  ) {
    return true;
  } else {
    return some(listChild(node), hasSuperGetParameter);
  }
};

/** @type {(node: Node<unknown>) => boolean} */
export const hasSuperSetParameter = (node) => {
  if (node.type === "ClosureExpression" && node.kind !== "arrow") {
    return false;
  } else if (
    node.type === "ParameterExpression" &&
    node.parameter === "super.set"
  ) {
    return true;
  } else {
    return some(listChild(node), hasSuperSetParameter);
  }
};

/** @type {(node: Node<unknown>) => boolean} */
export const hasSuperCallParameter = (node) => {
  if (node.type === "ClosureExpression" && node.kind !== "arrow") {
    return false;
  } else if (
    node.type === "ParameterExpression" &&
    node.parameter === "super.call"
  ) {
    return true;
  } else {
    return some(listChild(node), hasSuperCallParameter);
  }
};

// /** @type {<C>(node: Program, context: C, mapper: Mapper<C>) => Program} */
// export const mapProgram = (
//   node,
//   context,
//   { statement: transformStatement, expression: transformExpression },
// ) => ({
//   ...node,
//   body: map(node.body, (statement) => transformStatement(statement, context)),
//   completion: transformExpression(node.completion, context),
// });

// /** @type {<C>(node: Block, context: C, mapper: Mapper<C>) => Block} */
// export const mapBlock = (node, context, { statement: transformStatement }) => ({
//   ...node,
//   body: map(node.body, (statement) => transformStatement(statement, context)),
// });

// /** @type {<C>(node: Statement, context: C, mapper: Mapper<C>) => Statement} */
// export const mapStatement = (
//   node,
//   context,
//   {
//     block: transformBlock,
//     expression: transformExpression,
//     effect: transformEffect,
//   },
// ) => {
//   switch (node.type) {
//     case "EffectStatement":
//       return {
//         ...node,
//         inner: transformEffect(node.inner, context),
//       };
//     case "ReturnStatement":
//       return {
//         ...node,
//         result: transformExpression(node.result, context),
//       };
//     case "DeclareEnclaveStatement":
//       return {
//         ...node,
//         value: transformExpression(node.value, context),
//       };
//     case "BlockStatement":
//       return {
//         ...node,
//         naked: transformBlock(node.naked, context),
//       };
//     case "IfStatement":
//       return {
//         ...node,
//         if: transformExpression(node.if, context),
//         then: transformBlock(node.then, context),
//         else: transformBlock(node.else, context),
//       };
//     case "WhileStatement":
//       return {
//         ...node,
//         while: transformExpression(node.while, context),
//         loop: transformBlock(node.loop, context),
//       };
//     case "TryStatement":
//       return {
//         ...node,
//         try: transformBlock(node.try, context),
//         catch: transformBlock(node.catch, context),
//         finally: transformBlock(node.finally, context),
//       };
//     default:
//       return node;
//   }
// };

// /** @type {<C>(node: Effect, context: C, mapper: Mapper<C>) => Effect} */
// export const mapEffect = (
//   node,
//   context,
//   { expression: transformExpression },
// ) => {
//   switch (node.type) {
//     case "WriteEffect":
//       return {
//         ...node,
//         right: transformExpression(node.right, context),
//       };
//     case "WriteEnclaveEffect":
//       return {
//         ...node,
//         right: transformExpression(node.right, context),
//       };
//     case "ExportEffect":
//       return {
//         ...node,
//         right: transformExpression(node.right, context),
//       };
//     case "ExpressionEffect":
//       return {
//         ...node,
//         discard: transformExpression(node.discard, context),
//       };
//     default:
//       throw new StaticError("invalid node", node);
//   }
// };

// /**
//  * @type {<C>(
//  *   node: Expression,
//  *   context: C,
//  *   mapper: Mapper<C>,
//  * ) => Expression}
//  */
// export const mapExpression = (
//   node,
//   context,
//   {
//     statement: transformStatement,
//     expression: transformExpression,
//     effect: transformEffect,
//   },
// ) => {
//   switch (node.type) {
//     case "PrimitiveExpression":
//       return node;
//     case "ReadExpression":
//       return node;
//     case "ReadEnclaveExpression":
//       return node;
//     case "TypeofEnclaveExpression":
//       return node;
//     case "ImportExpression":
//       return node;
//     case "ParameterExpression":
//       return node;
//     case "IntrinsicExpression":
//       return node;
//     case "ClosureExpression":
//       return {
//         ...node,
//         body: map(node.body, (statement) =>
//           transformStatement(statement, context),
//         ),
//         completion: transformExpression(node.completion, context),
//       };
//     case "AwaitExpression":
//       return {
//         ...node,
//         promise: transformExpression(node.promise, context),
//       };
//     case "YieldExpression":
//       return {
//         ...node,
//         item: transformExpression(node.item, context),
//       };
//     case "SequenceExpression": {
//       return {
//         ...node,
//         head: transformEffect(node.head, context),
//         tail: transformExpression(node.tail, context),
//       };
//     }
//     case "ConditionalExpression":
//       return {
//         ...node,
//         condition: transformExpression(node.condition, context),
//         consequent: transformExpression(node.consequent, context),
//         alternate: transformExpression(node.alternate, context),
//       };
//     case "EvalExpression":
//       return {
//         ...node,
//         code: transformExpression(node.code, context),
//       };
//     case "ApplyExpression":
//       return {
//         ...node,
//         callee: transformExpression(node.callee, context),
//         this: transformExpression(node.this, context),
//         arguments: map(node.arguments, (expression) =>
//           transformExpression(expression, context),
//         ),
//       };
//     case "ConstructExpression":
//       return {
//         ...node,
//         callee: transformExpression(node.callee, context),
//         arguments: map(node.arguments, (expression) =>
//           transformExpression(expression, context),
//         ),
//       };
//     default:
//       throw new StaticError("invalid node", node);
//   }
// };
