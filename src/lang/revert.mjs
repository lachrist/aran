/* eslint-disable no-use-before-define */

import {concat, map, reduceRight} from "array-lite";

import {hasOwn, assert, partial_x, partialxx_} from "../util/index.mjs";

import {dispatchArrayNode0, throwUnexpectedArrayNodeType} from "../node.mjs";

import {fromLiteral} from "../ast/index.mjs";

import {
  MODULE_PROGRAM_DIRECTIVE,
  SCRIPT_PROGRAM_DIRECTIVE,
  EVAL_PROGRAM_DIRECTIVE,
  EFFECT_KEYWORD,
  EVAL_KEYWORD,
  UNDEFINED_KEYWORD,
  INTRINSIC_KEYWORD,
  EXPORT_KEYWORD,
  IMPORT_KEYWORD,
} from "./keywords.mjs";

const {
  String,
  undefined,
  JSON: {stringify: stringifyJSON},
} = globalThis;

//////////
// Make //
//////////

const makeDirective = (expression, directive) => ({
  type: "ExpressionStatement",
  expression,
  directive,
});
const makeBlockStatement = (body) => ({type: "BlockStatement", body});
const makeVariableDeclaration = (kind, declarations) => ({
  type: "VariableDeclaration",
  kind,
  declarations,
});
const makeDebuggerStatement = () => ({type: "DebuggerStatement"});
const makeReturnStatement = (argument) => ({type: "ReturnStatement", argument});
const makeBreakStatement = (label) => ({type: "BreakStatement", label});
const makeIfStatement = (test, consequent, alternate) => ({
  type: "IfStatement",
  test,
  consequent,
  alternate,
});
const makeSuper = () => ({
  type: "Super",
});
const makeThisExpression = () => ({
  type: "ThisExpression",
});
const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
});
const makeTryStatement = (block, handler, finalizer) => ({
  type: "TryStatement",
  block,
  handler,
  finalizer,
});
const makeCatchClause = (body) => ({type: "CatchClause", param: null, body});
const makeLiteral = (value) => ({
  type: "Literal",
  value,
  bigint: typeof value === "bigint" ? String(value) : null,
  raw: typeof value === "bigint" ? `${String(value)}n` : stringifyJSON(value),
});
const makeProgram = (kind, body) => ({
  type: "Program",
  sourceType: kind,
  body,
});
const makeImportDeclaration = (specifiers, source) => ({
  type: "ImportDeclaration",
  specifiers,
  source,
});
const makeExportNamedDeclaration = (specifiers, source) => ({
  type: "ExportNamedDeclaration",
  declaration: null,
  specifiers,
  source,
});
const makeExportAllDeclaration = (exported, source) => ({
  type: "ExportAllDeclaration",
  exported,
  source,
});
const makeExportSpecifier = (local, exported) => ({
  type: "ExportSpecifier",
  local: {
    start: 0,
    end: 0,
    ...local,
  },
  exported: {
    start: local.name === exported.name ? 0 : 1,
    end: local.name === exported.name ? 0 : 1,
    ...exported,
  },
});
const makeImportSpecifier = (local, imported) => ({
  type: "ImportSpecifier",
  local,
  imported,
});
const makeVariableDeclarator = (id, init) => ({
  type: "VariableDeclarator",
  id,
  init,
});
const makeEmptyVariableDeclarator = partial_x(makeVariableDeclarator, null);
const makeArrayExpression = (elements) => ({type: "ArrayExpression", elements});
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  expression,
});
const makeIdentifier = (name) => ({type: "Identifier", name});
const makeMemberExpression = (computed, object, property) => ({
  type: "MemberExpression",
  computed,
  optional: false,
  object,
  property,
});
const makeLabeledStatement = (label, body) => ({
  type: "LabeledStatement",
  label,
  body,
});
const makeAssignmentExpression = (left, right) => ({
  type: "AssignmentExpression",
  operator: "=",
  left,
  right,
});
const makeCallExpression = (callee, $arguments) => ({
  type: "CallExpression",
  optional: false,
  callee,
  arguments: $arguments,
});
const makeMetaProperty = (name1, name2) => ({
  type: "MetaProperty",
  meta: makeIdentifier(name1),
  property: makeIdentifier(name2),
});
const makeSequenceExpression = (expressions) => ({
  type: "SequenceExpression",
  expressions,
});
const makeConditionalExpression = (test, consequent, alternate) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
});
const makeFunctionExpression = (id, $async, generator, body) => ({
  type: "FunctionExpression",
  id,
  async: $async,
  generator,
  body,
});
const makeArrowFunctionExpression = ($async, body) => ({
  type: "ArrowFunctionExpression",
  id: null,
  async: $async,
  params: [],
  body,
});
const makeAwaitExpression = (argument) => ({type: "AwaitExpression", argument});
const makeYieldExpression = (delegate, argument) => ({
  type: "YieldExpression",
  delegate,
  argument,
});
const makeNewExpression = (callee, $arguments) => ({
  type: "NewExpression",
  callee,
  arguments: $arguments,
});
const makeUnaryExpression = (operator, argument) => ({
  type: "UnaryExpression",
  prefix: true,
  operator,
  argument,
});

////////////
// Revert //
////////////

const parameter_mapping = {
  "__proto__": null,
  "error": makeIdentifier("error"),
  "arguments": makeIdentifier("arguments"),
  "this": makeThisExpression(),
  "new.target": makeMetaProperty("new", "target"),
  "import.meta": makeMetaProperty("import", "meta"),
  "import": makeMetaProperty("import", "dynamic"),
  "super.get": makeMemberExpression(false, makeSuper(), makeIdentifier("get")),
  "super.set": makeMemberExpression(false, makeSuper(), makeIdentifier("set")),
  "super.call": makeMemberExpression(
    false,
    makeSuper(),
    makeIdentifier("call"),
  ),
};

const revertParameter = (parameter) => {
  assert(hasOwn(parameter_mapping, parameter), "unexpected parameter name");
  return parameter_mapping[parameter];
};

export const revertProgram = partialxx_(
  dispatchArrayNode0,
  {
    __proto__: null,
    ScriptProgram: ({1: statements}) =>
      makeProgram(
        "script",
        concat(
          [
            makeDirective(
              makeLiteral(SCRIPT_PROGRAM_DIRECTIVE),
              SCRIPT_PROGRAM_DIRECTIVE,
            ),
          ],
          map(statements, revertStatement),
        ),
      ),
    ModuleProgram: ({1: links, 2: block}) =>
      makeProgram(
        "module",
        concat(
          [
            makeDirective(
              makeLiteral(MODULE_PROGRAM_DIRECTIVE),
              MODULE_PROGRAM_DIRECTIVE,
            ),
          ],
          map(links, revertLink),
          [revertBlock(block)],
        ),
      ),
    EvalProgram: ({1: parameters, 2: variables, 3: block}) =>
      makeProgram(
        "script",
        concat(
          [
            makeDirective(
              makeLiteral(EVAL_PROGRAM_DIRECTIVE),
              EVAL_PROGRAM_DIRECTIVE,
            ),
            makeExpressionStatement(
              makeArrayExpression(map(parameters, revertParameter)),
            ),
          ],
          variables.length === 0
            ? []
            : [
                makeVariableDeclaration(
                  "let",
                  map(variables, makeEmptyVariableDeclarator),
                ),
              ],
          [revertBlock(block)],
        ),
      ),
  },
  throwUnexpectedArrayNodeType,
);

export const revertLink = partialxx_(
  dispatchArrayNode0,
  {
    __proto__: null,
    ImportLink: ({1: source, 2: specifier}) =>
      makeImportDeclaration(
        specifier === null
          ? []
          : [
              makeImportSpecifier(
                makeIdentifier(specifier),
                makeIdentifier(specifier),
              ),
            ],
        makeLiteral(source),
      ),
    ExportLink: ({1: specifier}) =>
      makeExportNamedDeclaration(
        [
          makeExportSpecifier(
            makeIdentifier(specifier),
            makeIdentifier(specifier),
          ),
        ],
        null,
      ),
    AggregateLink: ({1: source, 2: specifier1, 3: specifier2}) =>
      specifier1 === null
        ? makeExportAllDeclaration(
            specifier2 === null ? null : makeIdentifier(specifier2),
            makeLiteral(source),
          )
        : makeExportNamedDeclaration(
            [
              makeExportSpecifier(
                makeIdentifier(specifier1),
                makeIdentifier(specifier2),
              ),
            ],
            makeLiteral(source),
          ),
  },
  throwUnexpectedArrayNodeType,
);

export const accumulateLabel = (node, label) =>
  makeLabeledStatement(makeIdentifier(label), node);

export const revertBlock = partialxx_(
  dispatchArrayNode0,
  {
    __proto__: null,
    Block: ({1: labels, 2: variables, 3: statements}) =>
      reduceRight(
        labels,
        accumulateLabel,
        makeBlockStatement(
          concat(
            variables.length === 0
              ? []
              : [
                  makeVariableDeclaration(
                    "let",
                    map(variables, makeEmptyVariableDeclarator),
                  ),
                ],
            map(statements, revertStatement),
          ),
        ),
      ),
  },
  throwUnexpectedArrayNodeType,
);

export const revertStatement = partialxx_(
  dispatchArrayNode0,
  {
    __proto__: null,
    DebuggerStatement: ({}) => makeDebuggerStatement(),
    ReturnStatement: ({1: expression}) =>
      makeReturnStatement(revertExpression(expression)),
    BreakStatement: ({1: label}) => makeBreakStatement(makeIdentifier(label)),
    BlockStatement: ({1: block}) => revertBlock(block),
    IfStatement: ({1: expression, 2: block1, 3: block2}) =>
      makeIfStatement(
        revertExpression(expression),
        revertBlock(block1),
        revertBlock(block2),
      ),
    WhileStatement: ({1: expression, 2: block}) =>
      makeWhileStatement(revertExpression(expression), revertBlock(block)),
    TryStatement: ({1: block1, 2: block2, 3: block3}) =>
      makeTryStatement(
        revertBlock(block1),
        makeCatchClause(revertBlock(block2)),
        revertBlock(block3),
      ),
    EffectStatement: ({1: effect}) =>
      makeExpressionStatement(revertEffect(effect)),
    DeclareExternalStatement: ({1: kind, 2: variable, 3: expression}) =>
      makeVariableDeclaration(kind, [
        makeVariableDeclarator(
          makeIdentifier(`_${variable}`),
          revertExpression(expression),
        ),
      ]),
  },
  throwUnexpectedArrayNodeType,
);

export const revertEffect = partialxx_(
  dispatchArrayNode0,
  {
    __proto__: null,
    WriteEffect: ({1: variable, 2: expression}) =>
      makeAssignmentExpression(
        makeIdentifier(variable),
        revertExpression(expression),
      ),
    WriteExternalEffect: ({1: variable, 2: expression}) =>
      makeAssignmentExpression(
        makeIdentifier(`_${variable}`),
        revertExpression(expression),
      ),
    ExportEffect: ({1: specifier, 2: expression}) =>
      makeCallExpression(makeIdentifier(EXPORT_KEYWORD), [
        makeLiteral(specifier),
        revertExpression(expression),
      ]),
    SequenceEffect: ({1: effect1, 2: effect2}) =>
      makeSequenceExpression([revertEffect(effect1), revertEffect(effect2)]),
    ConditionalEffect: ({1: expression, 2: effect1, 3: effect2}) =>
      makeConditionalExpression(
        revertExpression(expression),
        revertEffect(effect1),
        revertEffect(effect2),
      ),
    ExpressionEffect: ({1: expression}) =>
      makeCallExpression(makeIdentifier(EFFECT_KEYWORD), [
        revertExpression(expression),
      ]),
  },
  throwUnexpectedArrayNodeType,
);

export const revertExpression = partialxx_(
  dispatchArrayNode0,
  {
    __proto__: null,
    ParameterExpression: ({1: parameter}) => revertParameter(parameter),
    LiteralExpression: ({1: literal}) => {
      const primitive = fromLiteral(literal);
      if (primitive === undefined) {
        return makeIdentifier(UNDEFINED_KEYWORD);
      } else {
        return makeLiteral(primitive);
      }
    },
    IntrinsicExpression: ({1: intrinsic}) =>
      makeMemberExpression(
        true,
        makeIdentifier(INTRINSIC_KEYWORD),
        makeLiteral(intrinsic),
      ),
    ImportExpression: ({1: source, 2: specifier}) =>
      makeCallExpression(makeIdentifier(IMPORT_KEYWORD), [
        makeLiteral(source),
        makeLiteral(specifier),
      ]),
    ReadExpression: ({1: variable}) => makeIdentifier(variable),
    ReadExternalExpression: ({1: variable}) => makeIdentifier(`_${variable}`),
    TypeofExternalExpression: ({1: variable}) =>
      makeUnaryExpression("typeof", makeIdentifier(`_${variable}`)),
    ClosureExpression: ({1: kind, 2: asynchronous, 3: generator, 4: block}) =>
      kind === "arrow"
        ? makeArrowFunctionExpression(asynchronous, revertBlock(block))
        : makeFunctionExpression(
            kind === "function" ? null : makeIdentifier(kind),
            asynchronous,
            generator,
            revertBlock(block),
          ),
    AwaitExpression: ({1: expression}) =>
      makeAwaitExpression(revertExpression(expression)),
    YieldExpression: ({1: delegate, 2: expression}) =>
      makeYieldExpression(delegate, revertExpression(expression)),
    SequenceExpression: ({1: effect, 2: expression}) =>
      makeSequenceExpression([
        revertEffect(effect),
        revertExpression(expression),
      ]),
    ConditionalExpression: ({1: expression1, 2: expression2, 3: expression3}) =>
      makeConditionalExpression(
        revertExpression(expression1),
        revertExpression(expression2),
        revertExpression(expression3),
      ),
    EvalExpression: ({1: parameters, 2: variables, 3: expression}) =>
      makeCallExpression(makeIdentifier(EVAL_KEYWORD), [
        makeArrayExpression(map(parameters, revertParameter)),
        makeArrayExpression(map(variables, makeIdentifier)),
        revertExpression(expression),
      ]),
    ApplyExpression: ({1: expression1, 2: expression2, 3: expressions}) =>
      makeCallExpression(
        revertExpression(expression1),
        concat(
          [makeUnaryExpression("!", revertExpression(expression2))],
          map(expressions, revertExpression),
        ),
      ),
    ConstructExpression: ({1: expression, 2: expressions}) =>
      makeNewExpression(
        revertExpression(expression),
        map(expressions, revertExpression),
      ),
    // InvokeExpression: (
    //   _context,
    //   expression1,
    //   expression2,
    //   expressions,
    //   _annotation,
    // ) =>
    //   makeCallExpression(
    //     makeMemberExpression(
    //       true,
    //       revertExpression(expression1),
    //       revertExpression(expression2),
    //     ),
    //     map(expressions, revertExpression),
    //   ),
  },
  throwUnexpectedArrayNodeType,
);
