import { unpackPrimitive } from "./node.mjs";
import {
  enumerate,
  filter,
  flatMap,
  includes,
  pushAll,
  zip,
} from "./util/index.mjs";

const {
  Math: { min },
} = globalThis;

/**
 * @template T1
 * @template T2
 * @typedef {{
 *   type: "failure",
 *   path: string,
 *   pair: [Node<T1>, Node<T2>],
 * } | {
 *   type: "success",
 *   labels: [Label, Label][],
 *   variables: [Variable, Variable][],
 * }} Result
 */

/** @type {<X, Y>(entries: [X, Y][]) => boolean} */
const isBijection = (entries) => {
  for (const [x1, y1] of entries) {
    for (const [x2, y2] of entries) {
      if (x1 === x2 && y1 !== y2) {
        return false;
      }
    }
  }
  return true;
};

/**
 * @type {<T1, T2>(
 *   pair: [Primitive, Primitive],
 *   path: string,
 *   parents: [Node<T1>, Node<T2>],
 * ) => Result<T1, T2>}
 */
const allignPrimitive = ([primitive1, primitive2], path, parents) =>
  primitive1 === primitive2
    ? { type: "success", labels: [], variables: [] }
    : { type: "failure", path, pair: parents };

/**
 * @type {<T1, T2>(
 *   results: Result<T1, T2>[],
 *   path: string,
 *   parents: [Node<T1>, Node<T2>],
 * ) => Result<T1, T2>}
 */
const combineAllResult = (results, path, parents) => {
  /** @type {[Label, Label][]} */
  const labels = [];
  /** @type {[Variable, Variable][]} */
  const variables = [];
  for (const result of results) {
    if (result.type === "success") {
      pushAll(labels, result.labels);
      pushAll(variables, result.variables);
    } else {
      return result;
    }
  }
  if (!isBijection(labels)) {
    return {
      type: "failure",
      path: `${path}.@label`,
      pair: parents,
    };
  }
  if (!isBijection(variables)) {
    return {
      type: "failure",
      path: `${path}.@variable`,
      pair: parents,
    };
  }
  return { type: "success", labels, variables };
};

/**
 * @type {<T1, T2>(
 *   result: Result<T1, T2>,
 *   variables: [Variable[], Variable[]],
 *   path: string,
 *   pair: [Node<T1>, Node<T2>],
 * ) => Result<T1, T2>}
 */
const bindResultVariable = (result, [variables1, variable2], path, pair) => {
  if (result.type === "failure") {
    return result;
  } else {
    const variables = [...zip(variables1, variable2), ...result.variables];
    if (isBijection(variables)) {
      return {
        type: "success",
        labels: result.labels,
        variables: filter(
          variables,
          ([variable1, _variable2]) => !includes(variables1, variable1),
        ),
      };
    } else {
      return {
        type: "failure",
        path: `${path}.@variable`,
        pair,
      };
    }
  }
};

/**
 * @type {<T1, T2>(
 *   result: Result<T1, T2>,
 *   labels: [Label[], Label[]],
 *   path: string,
 *   pair: [Node<T1>, Node<T2>],
 * ) => Result<T1, T2>}
 */
const bindResultLabel = (result, [labels1, labels2], path, pair) => {
  if (result.type === "failure") {
    return result;
  } else {
    const labels = [...zip(labels1, labels2), ...result.labels];
    if (isBijection(labels)) {
      return {
        type: "success",
        variables: result.variables,
        labels: filter(
          labels,
          ([label1, _label2]) => !includes(labels1, label1),
        ),
      };
    } else {
      return {
        type: "failure",
        path: `${path}.@label`,
        pair,
      };
    }
  }
};

/** @type {<T1, T2>(pair: [Node<T1>, Node<T2>], path: string) => Result<T1, T2>[]} */
const allignNode = (pair, path) => {
  const [node1, node2] = pair;
  // Program //
  if (node1.type === "ScriptProgram" && node2.type === "ScriptProgram") {
    return allignNode([node1.body, node2.body], `${path}.body`);
  } else if (node1.type === "ModuleProgram" && node2.type === "ModuleProgram") {
    return [
      allignPrimitive(
        [node1.links.length, node2.links.length],
        `${path}.links.length`,
        pair,
      ),
      ...flatMap(
        enumerate(min(node1.links.length, node2.links.length)),
        (index) =>
          allignNode(
            [node1.links[index], node2.links[index]],
            `${path}.links[${index}]`,
          ),
      ),
      ...allignNode([node1.body, node2.body], `${path}.body`),
    ];
  } else if (node1.type === "EvalProgram" && node2.type === "EvalProgram") {
    return allignNode([node1.body, node2.body], `${path}.body`);
  } else if (node1.type === "ClosureBlock" && node2.type === "ClosureBlock") {
    return [
      bindResultVariable(
        combineAllResult(
          [
            allignPrimitive(
              [node1.variables.length, node2.variables.length],
              `${path}.variable.length`,
              pair,
            ),
            allignPrimitive(
              [node1.statements.length, node2.statements.length],
              `${path}.statements.length`,
              pair,
            ),
            ...flatMap(
              enumerate(min(node1.statements.length, node2.statements.length)),
              (index) =>
                allignNode(
                  [node1.statements[index], node2.statements[index]],
                  `${path}.statements[${index}]`,
                ),
            ),
            ...allignNode(
              [node1.completion, node2.completion],
              `${path}.completion`,
            ),
          ],
          path,
          pair,
        ),
        [node1.variables, node2.variables],
        path,
        pair,
      ),
    ];
    // node //
  } else if (node1.type === "ImportLink" && node2.type === "ImportLink") {
    return [
      allignPrimitive([node1.import, node2.import], `${path}.import`, pair),
      allignPrimitive([node1.source, node2.source], `${path}.source`, pair),
    ];
  } else if (node1.type === "ExportLink" && node2.type === "ExportLink") {
    return [
      allignPrimitive([node1.export, node2.export], `${path}.export`, pair),
    ];
  } else if (node1.type === "AggregateLink" && node2.type === "AggregateLink") {
    return [
      allignPrimitive([node1.import, node2.import], `${path}.import`, pair),
      allignPrimitive([node1.source, node2.source], `${path}.source`, pair),
      allignPrimitive([node1.export, node2.export], `${path}.export`, pair),
    ];
    // Block //
  } else if (node1.type === "ControlBlock" && node2.type === "ControlBlock") {
    return [
      bindResultLabel(
        bindResultVariable(
          combineAllResult(
            [
              allignPrimitive(
                [node1.labels.length, node2.labels.length],
                `${path}.labels.length`,
                pair,
              ),
              allignPrimitive(
                [node1.variables.length, node2.variables.length],
                `${path}.variable.length`,
                pair,
              ),
              allignPrimitive(
                [node1.statements.length, node2.statements.length],
                `${path}.statements.length`,
                pair,
              ),
              ...flatMap(
                enumerate(
                  min(node1.statements.length, node2.statements.length),
                ),
                (index) =>
                  allignNode(
                    [node1.statements[index], node2.statements[index]],
                    `${path}.statements[${index}]`,
                  ),
              ),
            ],
            path,
            pair,
          ),
          [node1.variables, node2.variables],
          path,
          pair,
        ),
        [node1.labels, node2.labels],
        path,
        pair,
      ),
    ];
  } else if (node1.type === "PseudoBlock" && node2.type === "PseudoBlock") {
    return [
      allignPrimitive(
        [node1.statements.length, node2.statements.length],
        `${path}.statements.length`,
        pair,
      ),
      ...flatMap(
        enumerate(min(node1.statements.length, node2.statements.length)),
        (index) =>
          allignNode(
            [node1.statements[index], node2.statements[index]],
            `${path}.statements[${index}]`,
          ),
      ),
      ...allignNode([node1.completion, node2.completion], `${path}.completion`),
    ];
    // Statement //
  } else if (
    node1.type === "EffectStatement" &&
    node2.type === "EffectStatement"
  ) {
    return allignNode([node1.inner, node2.inner], `${path}.inner`);
  } else if (
    node1.type === "DebuggerStatement" &&
    node2.type === "DebuggerStatement"
  ) {
    return [{ type: "success", labels: [], variables: [] }];
  } else if (
    node1.type === "ReturnStatement" &&
    node2.type === "ReturnStatement"
  ) {
    return allignNode([node1.result, node2.result], `${path}.result`);
  } else if (
    node1.type === "BreakStatement" &&
    node2.type === "BreakStatement"
  ) {
    return [
      {
        type: "success",
        labels: [[node1.label, node2.label]],
        variables: [],
      },
    ];
  } else if (
    node1.type === "DeclareEnclaveStatement" &&
    node2.type === "DeclareEnclaveStatement"
  ) {
    return [
      allignPrimitive([node1.kind, node2.kind], `${path}.kind`, pair),
      allignPrimitive(
        [node1.variable, node2.variable],
        `${path}.variable`,
        pair,
      ),
      ...allignNode([node1.right, node2.right], `${path}.right`),
    ];
  } else if (
    node1.type === "BlockStatement" &&
    node2.type === "BlockStatement"
  ) {
    return allignNode([node1.do, node2.do], `${path}.do`);
  } else if (node1.type === "IfStatement" && node2.type === "IfStatement") {
    return [
      ...allignNode([node1.if, node2.if], `${path}.if`),
      ...allignNode([node1.then, node2.then], `${path}.then`),
      ...allignNode([node1.else, node2.else], `${path}.else`),
    ];
  } else if (
    node1.type === "WhileStatement" &&
    node2.type === "WhileStatement"
  ) {
    return [
      ...allignNode([node1.while, node2.while], `${path}.while`),
      ...allignNode([node1.do, node2.do], `${path}.do`),
    ];
  } else if (node1.type === "TryStatement" && node2.type === "TryStatement") {
    return [
      ...allignNode([node1.try, node2.try], `${path}.try`),
      ...allignNode([node1.catch, node2.catch], `${path}.catch`),
      ...allignNode([node1.finally, node2.finally], `${path}.finally`),
    ];
    // Effect //
  } else if (node1.type === "WriteEffect" && node2.type === "WriteEffect") {
    return [
      {
        type: "success",
        labels: [],
        variables: [[node1.variable, node2.variable]],
      },
      ...allignNode([node1.right, node2.right], `${path}.right`),
    ];
  } else if (
    node1.type === "WriteEnclaveEffect" &&
    node2.type === "WriteEnclaveEffect"
  ) {
    return [
      allignPrimitive(
        [node1.variable, node2.variable],
        `${path}.variable`,
        pair,
      ),
      ...allignNode([node1.right, node2.right], `${path}.right`),
    ];
  } else if (node1.type === "ExportEffect" && node2.type === "ExportEffect") {
    return [
      allignPrimitive([node1.export, node2.export], `${path}.export`, pair),
      ...allignNode([node1.right, node2.right], `${path}.right`),
    ];
  } else if (
    node1.type === "ExpressionEffect" &&
    node2.type === "ExpressionEffect"
  ) {
    return allignNode([node1.discard, node2.discard], `${path}.discard`);
  } else if (
    node1.type === "ConditionalEffect" &&
    node2.type === "ConditionalEffect"
  ) {
    return [
      ...allignNode([node1.condition, node2.condition], `${path}.condition`),
      allignPrimitive(
        [node1.positive.length, node2.positive.length],
        `${path}.positive.length`,
        pair,
      ),
      ...flatMap(
        enumerate(min(node1.positive.length, node2.positive.length)),
        (index) =>
          allignNode(
            [node1.positive[index], node2.positive[index]],
            `${path}.positive[${index}]`,
          ),
      ),
      allignPrimitive(
        [node1.negative.length, node2.negative.length],
        `${path}.negative.length`,
        pair,
      ),
      ...flatMap(
        enumerate(min(node1.negative.length, node2.negative.length)),
        (index) =>
          allignNode(
            [node1.negative[index], node2.negative[index]],
            `${path}.negative[${index}]`,
          ),
      ),
    ];
    // Expression //
  } else if (
    node1.type === "PrimitiveExpression" &&
    node2.type === "PrimitiveExpression"
  ) {
    return [
      allignPrimitive(
        [unpackPrimitive(node1.primitive), unpackPrimitive(node2.primitive)],
        `${path}.primitive`,
        pair,
      ),
    ];
  } else if (
    node1.type === "ReadExpression" &&
    node2.type === "ReadExpression"
  ) {
    return [
      {
        type: "success",
        variables: [[node1.variable, node2.variable]],
        labels: [],
      },
    ];
  } else if (
    node1.type === "ReadEnclaveExpression" &&
    node2.type === "ReadEnclaveExpression"
  ) {
    return [
      allignPrimitive(
        [node1.variable, node2.variable],
        `${path}.variable`,
        pair,
      ),
    ];
  } else if (
    node1.type === "ClosureExpression" &&
    node2.type === "ClosureExpression"
  ) {
    return [
      allignPrimitive([node1.kind, node2.kind], `${path}.kind`, pair),
      allignPrimitive(
        [node1.asynchronous, node2.asynchronous],
        `${path}.asynchronous`,
        pair,
      ),
      allignPrimitive(
        [node1.generator, node2.generator],
        `${path}.generator`,
        pair,
      ),
      ...allignNode([node1.body, node2.body], `${path}.body`),
    ];
  } else if (
    node1.type === "TypeofEnclaveExpression" &&
    node2.type === "TypeofEnclaveExpression"
  ) {
    return [
      allignPrimitive(
        [node1.variable, node2.variable],
        `${path}.variable`,
        pair,
      ),
    ];
  } else if (
    node1.type === "ParameterExpression" &&
    node2.type === "ParameterExpression"
  ) {
    return [
      allignPrimitive(
        [node1.parameter, node2.parameter],
        `${path}.parameter`,
        pair,
      ),
    ];
  } else if (
    node1.type === "IntrinsicExpression" &&
    node2.type === "IntrinsicExpression"
  ) {
    return [
      allignPrimitive(
        [node1.intrinsic, node2.intrinsic],
        `${path}.intrinsic`,
        pair,
      ),
    ];
  } else if (
    node1.type === "ImportExpression" &&
    node2.type === "ImportExpression"
  ) {
    return [
      allignPrimitive([node1.import, node2.import], `${path}.import`, pair),
      allignPrimitive([node1.source, node2.source], `${path}.source`, pair),
    ];
  } else if (
    node1.type === "SequenceExpression" &&
    node2.type === "SequenceExpression"
  ) {
    return [
      ...allignNode([node1.head, node2.head], `${path}.head`),
      ...allignNode([node1.tail, node2.tail], `${path}.tail`),
    ];
  } else if (
    node1.type === "ConditionalExpression" &&
    node2.type === "ConditionalExpression"
  ) {
    return [
      ...allignNode([node1.condition, node2.condition], `${path}.condition`),
      ...allignNode([node1.consequent, node2.consequent], `${path}.consequent`),
      ...allignNode([node1.alternate, node2.alternate], `${path}.alternate`),
    ];
  } else if (
    node1.type === "AwaitExpression" &&
    node2.type === "AwaitExpression"
  ) {
    return allignNode([node1.promise, node2.promise], `${path}.promise`);
  } else if (
    node1.type === "YieldExpression" &&
    node2.type === "YieldExpression"
  ) {
    return [
      allignPrimitive(
        [node1.delegate, node2.delegate],
        `${path}.delegate`,
        pair,
      ),
      ...allignNode([node1.item, node2.item], `${path}.item`),
    ];
  } else if (
    node1.type === "EvalExpression" &&
    node2.type === "EvalExpression"
  ) {
    return allignNode([node1.code, node2.code], `${path}.code`);
  } else if (
    node1.type === "ApplyExpression" &&
    node2.type === "ApplyExpression"
  ) {
    return [
      ...allignNode([node1.callee, node2.callee], `${path}.callee`),
      ...allignNode([node1.this, node2.this], `${path}.this`),
      allignPrimitive(
        [node1.arguments.length, node2.arguments.length],
        `${path}.arguments.length`,
        pair,
      ),
      ...flatMap(
        enumerate(min(node1.arguments.length, node2.arguments.length)),
        (index) =>
          allignNode(
            [node1.arguments[index], node2.arguments[index]],
            `${path}.arguments[${index}]`,
          ),
      ),
    ];
  } else if (
    node1.type === "ConstructExpression" &&
    node2.type === "ConstructExpression"
  ) {
    return [
      ...allignNode([node1.callee, node2.callee], `${path}.callee`),
      allignPrimitive(
        [node1.arguments.length, node2.arguments.length],
        `${path}.arguments.length`,
        pair,
      ),
      ...flatMap(
        enumerate(min(node1.arguments.length, node2.arguments.length)),
        (index) =>
          allignNode(
            [node1.arguments[index], node2.arguments[index]],
            `${path}.arguments[${index}]`,
          ),
      ),
    ];
  } else {
    return [
      {
        type: "failure",
        path: `${path}.type`,
        pair,
      },
    ];
  }
};

/**
 * @template T1
 * @template T2
 * @param {Node<T1>} node1
 * @param {Node<T2>} node2
 * @returns {Result<T1, T2> | null}
 */
export const allign = (node1, node2) => {
  /** @type {[Node<T1>, Node<T2>]} */
  const pair = [node1, node2];
  const result = combineAllResult(allignNode(pair, "root"), "root", pair);
  return result.type === "failure" ? result : null;
};