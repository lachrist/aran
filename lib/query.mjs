import { StaticError, some, map } from "./util/index.mjs";

/**
 * @template T
 * @param {Node<T>} node
 * @return {Node<T>[]}
 */
export const listChild = (node) => {
  switch (node.type) {
    // Program //
    case "ScriptProgram":
      return node.statements;
    case "ModuleProgram":
      return [...node.links, node.body];
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
    case "Block":
      return node.statements;
    // Statement //
    case "EffectStatement":
      return [node.effect];
    case "ReturnStatement":
      return [node.value];
    case "BreakStatement":
      return [];
    case "DebuggerStatement":
      return [];
    case "DeclareExternalStatement":
      return [node.value];
    case "BlockStatement":
      return [node.body];
    case "IfStatement":
      return [node.test, node.then, node.else];
    case "WhileStatement":
      return [node.test, node.body];
    case "TryStatement":
      return [node.body, node.catch, node.finally];
    // Effect //
    case "WriteEffect":
      return [node.value];
    case "WriteExternalEffect":
      return [node.value];
    case "ExportEffect":
      return [node.value];
    case "ExpressionEffect":
      return [node.discard];
    case "ConditionalEffect":
      return [node.test, ...node.positive, ...node.negative];
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
    case "ReadExternalExpression":
      return [];
    case "TypeofExternalExpression":
      return [];
    case "ClosureExpression":
      return [node.body];
    case "AwaitExpression":
      return [node.value];
    case "YieldExpression":
      return [node.value];
    case "SequenceExpression":
      return [node.effect, node.value];
    case "ConditionalExpression":
      return [node.test, node.consequent, node.alternate];
    case "EvalExpression":
      return [node.argument];
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

/** @type {<T>(node: Program<T>, mapper: Mapper<T>) => Program<T>} */
export const mapProgram = (
  node,
  { statement: transformStatement, link: transformLink, block: transformBlock },
) => {
  switch (node.type) {
    case "ScriptProgram":
      return {
        ...node,
        statements: map(node.statements, transformStatement),
      };
    case "ModuleProgram":
      return {
        ...node,
        links: map(node.links, transformLink),
        body: transformBlock(node.body),
      };
    case "EvalProgram":
      return {
        ...node,
        body: transformBlock(node.body),
      };
    default:
      throw new StaticError("invalid program", node);
  }
};

/** @type {<T>(node: Block<T>, mapper: Mapper<T>) => Block<T>} */
export const mapBlock = (node, { statement: transformStatement }) => ({
  ...node,
  statements: map(node.statements, transformStatement),
});

// /** @type {<T>(node: Expression<T>) => { effects: Effect<T>[], expression: Expression<T>}} */
// const stripEffect = (node) => {
//   const effects = [];
//   let length = 0;
//   while (node.type === "SequenceExpression") {
//     effects[length] = node.effect;
//     length += 1;
//     node = node.value;
//   }
//   return { effects, expression: node };
// };

// /**
//  * @template T
//  * @param {Statement<T>[]} nodes
//  * @param {Mapper<T>} mapper
//  * @returns {Statement<T>[]}
//  */
// export const mapStatementArray = (nodes, mapper) => {
//   const { effects: transformEffectArray, statement: transformStatement } =
//     mapper;
//   const { length } = nodes;
//   /** @type {Statement<T>[]} */
//   const result = [];
//   for (let index = 0; index < length; index += 1) {
//     if (nodes[index].type === "EffectStatement") {
//       /** @type {Effect<T>[]} */
//       const effects = [];
//       while (nodes[index].type === "EffectStatement") {
//         index += 1;
//         push(effects, nodes[index].effect);
//       }
//       pushAll(result, map(transformEffectArray(effects), makeEffectStatement));
//     } else {
//       push(result, transformStatement(nodes[index], mapper));
//     }
//   }
//   return result;
// };

/** @type {<T>(node: Statement<T>, mapper: Mapper<T>) => Statement<T>} */
export const mapStatement = (
  node,
  {
    block: transformBlock,
    expression: transformExpression,
    effect: transformEffect,
  },
) => {
  switch (node.type) {
    case "EffectStatement":
      return {
        ...node,
        effect: transformEffect(node.effect),
      };
    case "ReturnStatement":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "DeclareExternalStatement":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "BlockStatement":
      return {
        ...node,
        body: transformBlock(node.body),
      };
    case "IfStatement":
      return {
        ...node,
        test: transformExpression(node.test),
        then: transformBlock(node.then),
        else: transformBlock(node.else),
      };
    case "WhileStatement":
      return {
        ...node,
        test: transformExpression(node.test),
        body: transformBlock(node.body),
      };
    case "TryStatement":
      return {
        ...node,
        body: transformBlock(node.body),
        catch: transformBlock(node.catch),
        finally: transformBlock(node.finally),
      };
    default:
      return node;
  }
};

/** @type {<T>(node: Effect<T>, mapper: Mapper<T>) => Effect<T>} */
export const mapEffect = (
  node,
  { expression: transformExpression, effect: transformEffect },
) => {
  switch (node.type) {
    case "WriteEffect":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "WriteExternalEffect":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "ExportEffect":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "ExpressionEffect":
      return {
        ...node,
        discard: transformExpression(node.discard),
      };
    case "ConditionalEffect":
      return {
        ...node,
        test: transformExpression(node.test),
        positive: map(node.positive, transformEffect),
        negative: map(node.negative, transformEffect),
      };
    default:
      throw new StaticError("invalid node", node);
  }
};

/**
 * @type {<T>(
 *   node: Expression<T>,
 *   mapper: Mapper<T>,
 * ) => Expression<T>}
 */
export const mapExpression = (
  node,
  {
    block: transformBlock,
    expression: transformExpression,
    effect: transformEffect,
  },
) => {
  switch (node.type) {
    case "PrimitiveExpression":
      return node;
    case "ReadExpression":
      return node;
    case "ReadExternalExpression":
      return node;
    case "TypeofExternalExpression":
      return node;
    case "ImportExpression":
      return node;
    case "ParameterExpression":
      return node;
    case "IntrinsicExpression":
      return node;
    case "ClosureExpression":
      return {
        ...node,
        body: transformBlock(node.body),
      };
    case "AwaitExpression":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "YieldExpression":
      return {
        ...node,
        value: transformExpression(node.value),
      };
    case "SequenceExpression": {
      return {
        ...node,
        effect: transformEffect(node.effect),
        value: transformExpression(node.value),
      };
    }
    case "ConditionalExpression":
      return {
        ...node,
        test: transformExpression(node.test),
        consequent: transformExpression(node.consequent),
        alternate: transformExpression(node.alternate),
      };
    case "EvalExpression":
      return {
        ...node,
        argument: transformExpression(node.argument),
      };
    case "ApplyExpression":
      return {
        ...node,
        callee: transformExpression(node.callee),
        this: transformExpression(node.this),
        arguments: map(node.arguments, transformExpression),
      };
    case "ConstructExpression":
      return {
        ...node,
        callee: transformExpression(node.callee),
        arguments: map(node.arguments, transformExpression),
      };
    default:
      throw new StaticError("invalid node", node);
  }
};
