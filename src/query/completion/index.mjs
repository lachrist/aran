import {map, concat, flatMap} from "array-lite";
import {assert} from "../../util.mjs";
import {VALUED, UNVALUED} from "./valuation.mjs";
import {makeFreeCompletion, extractCompletionNode} from "./completion.mjs";
import {
  makeResult,
  generateReleaseResult,
  prefaceResult,
  chainResult,
  getFirstResultValuation,
} from "./result.mjs";

const {
  Object: {assign},
} = globalThis;

const empty_result = makeResult(UNVALUED, []);

const releaseNullResult = generateReleaseResult(null);

const visitors = {__proto__: null};

const visit = (node) => {
  assert(node.type in visitors, `unknown node type ${node.type}`);
  const visitor = visitors[node.type];
  return visitor(node);
};

const chain = (result, index, results) =>
  chainResult(result, getFirstResultValuation(results, index + 1));

const visitEmpty = (_node) => empty_result;

const visitLoop = (node) =>
  makeResult(
    true,
    concat(
      [makeFreeCompletion(node)],
      prefaceResult(releaseNullResult(visit(node.body)), node),
    ),
  );

const visitAll = (nodes) => {
  const results = map(nodes, visit);
  return makeResult(
    getFirstResultValuation(results, 0),
    flatMap(results, chain),
  );
};

assign(visitors, {
  ThrowStatemnt: visitEmpty,
  EmptyStatement: visitEmpty,
  DebuggerStatement: visitEmpty,
  VariableDeclaration: visitEmpty,
  ContinueStatement: visitEmpty,
  FunctionDeclaration: visitEmpty,
  ExpressionStatement: (node) => makeResult(VALUED, [makeFreeCompletion(node)]),
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
});

export const inferCompletionNodeArray = (node) => {
  assert(node.type === "Program", "Expected a program node");
  assert(node.sourceType === "script", "Only script program have completion");
  return map(chainResult(visitAll(node.body), UNVALUED), extractCompletionNode);
};
