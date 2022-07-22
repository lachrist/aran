import {map, concat, flatMap} from "array-lite";

import {partialx_x, deadcode} from "../../util/index.mjs";

import {applyVisitor} from "../visit.mjs";

import {VALUED, UNVALUED} from "./valuation.mjs";

import {makeFreeCompletion, getCompletionNode} from "./completion.mjs";

import {
  makeResult,
  generateReleaseResult,
  prefaceResult,
  chainResult,
  getFirstResultValuation,
} from "./result.mjs";

const empty_result = makeResult(UNVALUED, []);

const releaseNullResult = generateReleaseResult(null);

const chain = (result, index, results) =>
  chainResult(result, getFirstResultValuation(results, index + 1));

const visitEmpty = (_node) => empty_result;

/* eslint-disable no-use-before-define */
const visitLoop = (node) =>
  makeResult(
    true,
    concat(
      [makeFreeCompletion(node)],
      prefaceResult(releaseNullResult(visit(node.body)), node),
    ),
  );
/* eslint-enable no-use-before-define */

/* eslint-disable no-use-before-define */
const visitAll = (nodes) => {
  const results = map(nodes, visit);
  return makeResult(
    getFirstResultValuation(results, 0),
    flatMap(results, chain),
  );
};
/* eslint-enable no-use-before-define */

const visit = partialx_x(
  applyVisitor,
  {
    ThrowStatemnt: visitEmpty,
    EmptyStatement: visitEmpty,
    DebuggerStatement: visitEmpty,
    FunctionDeclaration: visitEmpty,
    ClassDeclaration: visitEmpty,
    VariableDeclaration: visitEmpty,
    ContinueStatement: visitEmpty,
    ExpressionStatement: (node) =>
      makeResult(VALUED, [makeFreeCompletion(node)]),
    BreakStatement: (node) =>
      makeResult(node.label === null ? null : node.label.name, []),
    BlockStatement: (node) => visitAll(node.body),
    LabeledStatement: (node) =>
      generateReleaseResult(node.label.name)(visit(node.body)),
    TryStatement: (node) =>
      makeResult(
        VALUED,
        concat(
          prefaceResult(visit(node.block), node),
          prefaceResult(
            node.handler === null ? empty_result : visit(node.handler.body),
            node,
          ),
        ),
      ),
    IfStatement: (node) =>
      makeResult(
        VALUED,
        concat(
          prefaceResult(visit(node.consequent), node),
          prefaceResult(
            node.alternate === null ? empty_result : visit(node.alternate),
            node,
          ),
        ),
      ),
    SwitchStatement: (node) =>
      makeResult(
        VALUED,
        concat(
          [makeFreeCompletion(node)],
          flatMap(node.cases, ({consequent: nodes}) =>
            prefaceResult(releaseNullResult(visitAll(nodes)), node),
          ),
        ),
      ),
    WithStatement: (node) =>
      makeResult(VALUED, prefaceResult(visit(node.body), node)),
    WhileStatement: visitLoop,
    DoWhileStatement: visitLoop,
    ForStatement: visitLoop,
    ForInStatement: visitLoop,
    ForOfStatement: visitLoop,
  },
  deadcode("invalid node type"),
);

export const inferCompletionNodeArray = (nodes) =>
  map(chainResult(visitAll(nodes), UNVALUED), getCompletionNode);
