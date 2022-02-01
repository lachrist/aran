
import { hoistShallow } from "./hoist-shallow.mjs";
import { hoistDeep } from "./hoist-deep.mjs";
import { hoistModule } from "./hoist-module.mjs";

const generateHoist = (types, hoist) => (node) => {
  assert(includes(types, node.type, "invalid node");
  return checkoutDeclarationArray(hoist(node));
};

export const hoistProgram = generateHoist(["Program"], (node) => {
  const declarations = concat(flatMap(node.body, hoistDeep), flatMap(node.body, hoistShallow));
  return node.sourceType === "module"
    ? concat(flatMap(node.body, hoistModule), declarations);
    : declarations;
});

export const hoistBlock = generateHoist(
  ["BlockStatement"],
  (node) => flatMap(node.body, hoistShallow),
);

export const hoistSwitchStatement = generateHoist(
  ["SwitchStatement"],
  (node) => flatMap(flatMap(node.cases, getConsequent), hoistShallow),
);

export const hoistCatchClauseHead = generateHoist(
  ["CatchClause"],
  (node) => node.param === null
    ? []
    : map(
      collectPattern(node.param),
      node.param.type === "Identifier" ? makeSimpleParameterDeclaration : makeParameterDeclaration,
    )
);

export const hoistClosureHead = generateHoist(
  ["FunctionDeclaration", "ArrowFunctionExpression", "FunctionExpression"],
  (node) => map(
    flatMap(node.params, collectPattern),
    node.type !== "ArrowFunctionExpression" && every(node.params, isIdentifier)
      ? makeSimpleParameterVariable
      : makeParameterVariable,
  ),
);

export const hoistClosureBody = generateHoist(
  ["FunctionDeclaration", "ArrowFunctionExpression", "FunctionExpression"],
  (node) => node.type === "ArrowFunctionExpression" && node.expression
    ? []
    : concat(hoistDeep(node.body), flatMap(node.body.body, hoistShallow)),
);
