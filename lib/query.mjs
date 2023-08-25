import { StaticError, some, map, reduce } from "./util/index.mjs";

/** @type {<X>(node: Node, combine: (current: X, node: Node) => X, initial: X) => X} */
export const reduceChild = (node, combine, initial) => {
  switch (node.type) {
    // Program //
    case "ScriptProgram":
      return reduce(node.statements, combine, initial);
    case "ModuleProgram":
      return combine(reduce(node.links, combine, initial), node.body);
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
    case "Block":
      return reduce(node.statements, combine, initial);
    // Statement //
    case "EffectStatement":
      return combine(initial, node.effect);
    case "ReturnStatement":
      return combine(initial, node.value);
    case "BreakStatement":
      return initial;
    case "DebuggerStatement":
      return initial;
    case "DeclareEnclaveStatement":
      return combine(initial, node.value);
    case "BlockStatement":
      return combine(initial, node.body);
    case "IfStatement":
      return combine(
        combine(combine(initial, node.test), node.then),
        node.else,
      );
    case "WhileStatement":
      return combine(combine(initial, node.test), node.body);
    case "TryStatement":
      return combine(
        combine(combine(initial, node.body), node.catch),
        node.finally,
      );
    // Effect //
    case "WriteEffect":
      return combine(initial, node.value);
    case "WriteEnclaveEffect":
      return combine(initial, node.value);
    case "ExportEffect":
      return combine(initial, node.value);
    case "ExpressionEffect":
      return combine(initial, node.discard);
    // case "ConditionalEffect":
    //   return combine(
    //     combine(combine(initial, node.test), node.positive),
    //     node.negative,
    //   );
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
      return combine(initial, node.value);
    case "YieldExpression":
      return combine(initial, node.value);
    case "SequenceExpression":
      return combine(combine(initial, node.effect), node.value);
    case "ConditionalExpression":
      return combine(
        combine(combine(initial, node.test), node.consequent),
        node.alternate,
      );
    case "EvalExpression":
      return combine(initial, node.argument);
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

/** @type {(node: Node) => Node[]} */
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
    case "DeclareEnclaveStatement":
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
    case "WriteEnclaveEffect":
      return [node.value];
    case "ExportEffect":
      return [node.value];
    case "ExpressionEffect":
      return [node.discard];
    // case "ConditionalEffect":
    //   return [node.test, ...node.positive, ...node.negative];
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

/** @type {(node: Node) => boolean} */
export const hasImportParameter = (node) => {
  if (node.type === "ParameterExpression" && node.parameter === "import") {
    return true;
  } else {
    return some(listChild(node), hasImportParameter);
  }
};

/** @type {(node: Node) => boolean} */
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

/** @type {(node: Node) => boolean} */
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

/** @type {(node: Node) => boolean} */
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

/** @type {<C>(node: Program, context: C, mapper: Mapper<C>) => Program} */
export const mapProgram = (
  node,
  context,
  { statement: transformStatement, link: transformLink, block: transformBlock },
) => {
  switch (node.type) {
    case "ScriptProgram":
      return {
        ...node,
        statements: map(node.statements, (statement) =>
          transformStatement(statement, context),
        ),
      };
    case "ModuleProgram":
      return {
        ...node,
        links: map(node.links, (link) => transformLink(link, context)),
        body: transformBlock(node.body, context),
      };
    case "EvalProgram":
      return {
        ...node,
        body: transformBlock(node.body, context),
      };
    default:
      throw new StaticError("invalid program", node);
  }
};

/** @type {<C>(node: Block, context: C, mapper: Mapper<C>) => Block} */
export const mapBlock = (node, context, { statement: transformStatement }) => ({
  ...node,
  statements: map(node.statements, (statement) =>
    transformStatement(statement, context),
  ),
});

// /** @type {(node: Expression) => { effects: Effect[], expression: Expression}} */
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
//  * @param {Statement[]} nodes
//  * @param {Mapper} mapper
//  * @returns {Statement[]}
//  */
// export const mapStatementArray = (nodes, mapper) => {
//   const { effects: transformEffectArray, statement: transformStatement } =
//     mapper;
//   const { length } = nodes;
//   /** @type {Statement[]} */
//   const result = [];
//   for (let index = 0; index < length; index += 1) {
//     if (nodes[index].type === "EffectStatement") {
//       /** @type {Effect[]} */
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

/** @type {<C>(node: Statement, context: C, mapper: Mapper<C>) => Statement} */
export const mapStatement = (
  node,
  context,
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
        effect: transformEffect(node.effect, context),
      };
    case "ReturnStatement":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "DeclareEnclaveStatement":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "BlockStatement":
      return {
        ...node,
        body: transformBlock(node.body, context),
      };
    case "IfStatement":
      return {
        ...node,
        test: transformExpression(node.test, context),
        then: transformBlock(node.then, context),
        else: transformBlock(node.else, context),
      };
    case "WhileStatement":
      return {
        ...node,
        test: transformExpression(node.test, context),
        body: transformBlock(node.body, context),
      };
    case "TryStatement":
      return {
        ...node,
        body: transformBlock(node.body, context),
        catch: transformBlock(node.catch, context),
        finally: transformBlock(node.finally, context),
      };
    default:
      return node;
  }
};

/** @type {<C>(node: Effect, context: C, mapper: Mapper<C>) => Effect} */
export const mapEffect = (
  node,
  context,
  { expression: transformExpression },
) => {
  switch (node.type) {
    case "WriteEffect":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "WriteEnclaveEffect":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "ExportEffect":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "ExpressionEffect":
      return {
        ...node,
        discard: transformExpression(node.discard, context),
      };
    // case "ConditionalEffect":
    //   return {
    //     ...node,
    //     test: transformExpression(node.test),
    //     positive: map(node.positive, transformEffect),
    //     negative: map(node.negative, transformEffect),
    //   };
    default:
      throw new StaticError("invalid node", node);
  }
};

/**
 * @type {<C>(
 *   node: Expression,
 *   context: C,
 *   mapper: Mapper<C>,
 * ) => Expression}
 */
export const mapExpression = (
  node,
  context,
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
    case "ReadEnclaveExpression":
      return node;
    case "TypeofEnclaveExpression":
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
        body: transformBlock(node.body, context),
      };
    case "AwaitExpression":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "YieldExpression":
      return {
        ...node,
        value: transformExpression(node.value, context),
      };
    case "SequenceExpression": {
      return {
        ...node,
        effect: transformEffect(node.effect, context),
        value: transformExpression(node.value, context),
      };
    }
    case "ConditionalExpression":
      return {
        ...node,
        test: transformExpression(node.test, context),
        consequent: transformExpression(node.consequent, context),
        alternate: transformExpression(node.alternate, context),
      };
    case "EvalExpression":
      return {
        ...node,
        argument: transformExpression(node.argument, context),
      };
    case "ApplyExpression":
      return {
        ...node,
        callee: transformExpression(node.callee, context),
        this: transformExpression(node.this, context),
        arguments: map(node.arguments, (expression) =>
          transformExpression(expression, context),
        ),
      };
    case "ConstructExpression":
      return {
        ...node,
        callee: transformExpression(node.callee, context),
        arguments: map(node.arguments, (expression) =>
          transformExpression(expression, context),
        ),
      };
    default:
      throw new StaticError("invalid node", node);
  }
};
