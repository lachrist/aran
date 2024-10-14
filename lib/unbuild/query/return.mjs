import { AranTypeError } from "../../error.mjs";
import { some } from "../../util/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").Statement<{}>,
 * ) => boolean}
 */
export const hasReturnStatement = (node) => {
  switch (node.type) {
    case "ReturnStatement": {
      return true;
    }
    case "EmptyStatement": {
      return false;
    }
    case "DebuggerStatement": {
      return false;
    }
    case "ExpressionStatement": {
      return false;
    }
    case "VariableDeclaration": {
      return false;
    }
    case "FunctionDeclaration": {
      return false;
    }
    case "ClassDeclaration": {
      return false;
    }
    case "BreakStatement": {
      return false;
    }
    case "ContinueStatement": {
      return false;
    }
    case "ThrowStatement": {
      return false;
    }
    case "TryStatement": {
      return (
        hasReturnStatement(node.block) ||
        (node.handler == null
          ? false
          : hasReturnStatement(node.handler.body)) ||
        (node.finalizer == null ? false : hasReturnStatement(node.finalizer))
      );
    }
    case "BlockStatement": {
      return some(node.body, hasReturnStatement);
    }
    case "IfStatement": {
      return (
        hasReturnStatement(node.consequent) ||
        (node.alternate == null ? false : hasReturnStatement(node.alternate))
      );
    }
    case "SwitchStatement": {
      return some(node.cases, (node) =>
        some(node.consequent, hasReturnStatement),
      );
    }
    case "WhileStatement": {
      return hasReturnStatement(node.body);
    }
    case "DoWhileStatement": {
      return hasReturnStatement(node.body);
    }
    case "ForStatement": {
      return hasReturnStatement(node.body);
    }
    case "ForInStatement": {
      return hasReturnStatement(node.body);
    }
    case "ForOfStatement": {
      return hasReturnStatement(node.body);
    }
    case "LabeledStatement": {
      return hasReturnStatement(node.body);
    }
    case "WithStatement": {
      return hasReturnStatement(node.body);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Statement<{}>,
 * ) => boolean}
 */
export const hasTryReturnStatement = (node) => {
  switch (node.type) {
    case "ReturnStatement": {
      return false;
    }
    case "EmptyStatement": {
      return false;
    }
    case "DebuggerStatement": {
      return false;
    }
    case "ExpressionStatement": {
      return false;
    }
    case "VariableDeclaration": {
      return false;
    }
    case "FunctionDeclaration": {
      return false;
    }
    case "ClassDeclaration": {
      return false;
    }
    case "BreakStatement": {
      return false;
    }
    case "ContinueStatement": {
      return false;
    }
    case "ThrowStatement": {
      return false;
    }
    case "TryStatement": {
      return (
        hasReturnStatement(node.block) ||
        (node.handler == null
          ? false
          : hasReturnStatement(node.handler.body)) ||
        (node.finalizer == null ? false : hasReturnStatement(node.finalizer))
      );
    }
    case "BlockStatement": {
      return some(node.body, hasTryReturnStatement);
    }
    case "IfStatement": {
      return (
        hasTryReturnStatement(node.consequent) ||
        (node.alternate == null ? false : hasTryReturnStatement(node.alternate))
      );
    }
    case "SwitchStatement": {
      return some(node.cases, (node) =>
        some(node.consequent, hasTryReturnStatement),
      );
    }
    case "WhileStatement": {
      return hasTryReturnStatement(node.body);
    }
    case "DoWhileStatement": {
      return hasTryReturnStatement(node.body);
    }
    case "ForStatement": {
      return hasTryReturnStatement(node.body);
    }
    case "ForInStatement": {
      return hasTryReturnStatement(node.body);
    }
    case "ForOfStatement": {
      return hasTryReturnStatement(node.body);
    }
    case "LabeledStatement": {
      return hasTryReturnStatement(node.body);
    }
    case "WithStatement": {
      return hasTryReturnStatement(node.body);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
