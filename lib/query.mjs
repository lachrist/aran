import {
  StaticError,
  concat$_,
  concat_$$,
  concat__$,
  concat_$,
  some,
} from "./util/index.mjs";

/** @type {(node: Node<unknown>) => Node<unknown>[]} */
const listChild = (node) => {
  switch (node.type) {
    // Program //
    case "ScriptProgram":
      return node.statements;
    case "ModuleProgram":
      return concat$_(/** @type {Node<unknown>[]} */ (node.links), node.body);
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
      return concat_$$(
        /** @type {Node<unknown>} */ (node.test),
        node.positive,
        node.negative,
      );
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
      return concat__$(node.callee, node.this, node.arguments);
    case "ConstructExpression":
      return concat_$(node.callee, node.arguments);
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
