/* eslint-disable no-use-before-define */

import {concat, map, reduceRight} from "array-lite";

import {deadcode__} from "../util/index.mjs";

import {dispatchNode, fromLiteral} from "../ast/index.mjs";

import {
  MODULE_PROGRAM_DIRECTIVE,
  SCRIPT_PROGRAM_DIRECTIVE,
  GLOBAL_EVAL_PROGRAM_DIRECTIVE,
  INTERNAL_LOCAL_EVAL_PROGRAM_DIRECTIVE,
  EXTERNAL_LOCAL_EVAL_PROGRAM_DIRECTIVE,
  EFFECT_KEYWORD,
  EVAL_KEYWORD,
  UNDEFINED_KEYWORD,
  INPUT_KEYWORD,
  INTRINSIC_KEYWORD,
  YIELD_DELEGATE_KEYWORD,
  YIELD_STRAIGHT_KEYWORD,
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

///////////////
// Transform //
///////////////

const transformVariableDeclator = (variable) =>
  makeVariableDeclarator(makeIdentifier(variable), null);

////////////
// Revert //
////////////

const default_callback = deadcode__("could not revert node");

const generateRevert = (callbacks) => (node) =>
  dispatchNode(null, node, callbacks, default_callback);

export const revertProgram = generateRevert({
  __proto__: null,
  ScriptProgram: (_context, statements, _annotation) =>
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
  ModuleProgram: (_context, links, block, _annotation) =>
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
  GlobalEvalProgram: (_context, block, _annotation) =>
    makeProgram("script", [
      makeDirective(
        makeLiteral(GLOBAL_EVAL_PROGRAM_DIRECTIVE),
        GLOBAL_EVAL_PROGRAM_DIRECTIVE,
      ),
      revertBlock(block),
    ]),
  InternalLocalEvalProgram: (_context, variables, block, _annotation) =>
    makeProgram(
      "script",
      concat(
        [
          makeDirective(
            makeLiteral(INTERNAL_LOCAL_EVAL_PROGRAM_DIRECTIVE),
            INTERNAL_LOCAL_EVAL_PROGRAM_DIRECTIVE,
          ),
        ],
        variables.length === 0
          ? []
          : [
              makeVariableDeclaration(
                "let",
                map(variables, transformVariableDeclator),
              ),
            ],
        [revertBlock(block)],
      ),
    ),
  ExternalLocalEvalProgram: (_context, specials, block, _annotation) =>
    makeProgram("script", [
      makeDirective(
        makeLiteral(EXTERNAL_LOCAL_EVAL_PROGRAM_DIRECTIVE),
        EXTERNAL_LOCAL_EVAL_PROGRAM_DIRECTIVE,
      ),
      makeExpressionStatement(makeArrayExpression(map(specials, makeLiteral))),
      revertBlock(block),
    ]),
});

export const revertLink = generateRevert({
  __proto__: null,
  ImportLink: (_context, source, specifier, _annotation) =>
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
  ExportLink: (_context, specifier, _annotation) =>
    makeExportNamedDeclaration(
      [
        makeExportSpecifier(
          makeIdentifier(specifier),
          makeIdentifier(specifier),
        ),
      ],
      null,
    ),
  AggregateLink: (_context, source, specifier1, specifier2, _annotation) =>
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
});

export const accumulateLabel = (node, label) =>
  makeLabeledStatement(makeIdentifier(label), node);

export const revertBlock = generateRevert({
  __proto__: null,
  Block: (_context, labels, variables, statements, _annotation) =>
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
                  map(variables, transformVariableDeclator),
                ),
              ],
          map(statements, revertStatement),
        ),
      ),
    ),
});

export const revertStatement = generateRevert({
  __proto__: null,
  DebuggerStatement: (_context, _annotation) => makeDebuggerStatement(),
  ReturnStatement: (_context, expression, _annotation) =>
    makeReturnStatement(revertExpression(expression)),
  BreakStatement: (_context, label, _annotation) =>
    makeBreakStatement(makeIdentifier(label)),
  BlockStatement: (_context, block, _annotation) => revertBlock(block),
  IfStatement: (_context, expression, block1, block2, _annotation) =>
    makeIfStatement(
      revertExpression(expression),
      revertBlock(block1),
      revertBlock(block2),
    ),
  WhileStatement: (_context, expression, block, _annotation) =>
    makeWhileStatement(revertExpression(expression), revertBlock(block)),
  TryStatement: (_context, block1, block2, block3, _annotation) =>
    makeTryStatement(
      revertBlock(block1),
      makeCatchClause(revertBlock(block2)),
      revertBlock(block3),
    ),
  EffectStatement: (_context, effect, _annotation) =>
    makeExpressionStatement(revertEffect(effect)),
  DeclareStatement: (_context, kind, variable, expression, _annotation) =>
    makeVariableDeclaration(kind, [
      makeVariableDeclarator(
        makeIdentifier(variable),
        revertExpression(expression),
      ),
    ]),
});

export const revertEffect = generateRevert({
  __proto__: null,
  WriteEffect: (_context, variable, expression, _annotation) =>
    makeAssignmentExpression(
      makeIdentifier(variable),
      revertExpression(expression),
    ),
  ExportEffect: (_context, specifier, expression, _annotation) =>
    makeCallExpression(makeIdentifier(EXPORT_KEYWORD), [
      makeLiteral(specifier),
      revertExpression(expression),
    ]),
  SequenceEffect: (_context, effect1, effect2, _annotation) =>
    makeSequenceExpression([revertEffect(effect1), revertEffect(effect2)]),
  ConditionalEffect: (_context, expression, effect1, effect2, _annotation) =>
    makeConditionalExpression(
      revertExpression(expression),
      revertEffect(effect1),
      revertEffect(effect2),
    ),
  ExpressionEffect: (_context, expression, _annotation) =>
    makeCallExpression(makeIdentifier(EFFECT_KEYWORD), [
      revertExpression(expression),
    ]),
});

export const revertExpression = generateRevert({
  __proto__: null,
  InputExpression: (_context, _annotation) => makeIdentifier(INPUT_KEYWORD),
  LiteralExpression: (_context, literal, _annotation) => {
    const primitive = fromLiteral(literal);
    return primitive === undefined
      ? makeIdentifier(UNDEFINED_KEYWORD)
      : makeLiteral(primitive);
  },
  IntrinsicExpression: (_context, intrinsic, _annotation) =>
    makeMemberExpression(
      true,
      makeIdentifier(INTRINSIC_KEYWORD),
      makeLiteral(intrinsic),
    ),
  ImportExpression: (_context, source, specifier, _annotation) =>
    makeCallExpression(makeIdentifier(IMPORT_KEYWORD), [
      makeLiteral(source),
      makeLiteral(specifier),
    ]),
  ReadExpression: (_context, variable, _annotation) => makeIdentifier(variable),
  ClosureExpression: (
    _context,
    kind,
    asynchronous,
    generator,
    block,
    _annotation,
  ) =>
    kind === "arrow"
      ? makeArrowFunctionExpression(asynchronous, revertBlock(block))
      : makeFunctionExpression(
          kind === "function" ? null : makeIdentifier(kind),
          asynchronous,
          generator,
          revertBlock(block),
        ),
  AwaitExpression: (_context, expression, _annotation) =>
    makeAwaitExpression(revertExpression(expression)),
  YieldExpression: (_context, delegate, expression, _annotation) =>
    makeCallExpression(
      makeIdentifier(
        delegate ? YIELD_DELEGATE_KEYWORD : YIELD_STRAIGHT_KEYWORD,
      ),
      [revertExpression(expression)],
    ),
  SequenceExpression: (_context, effect, expression, _annotation) =>
    makeSequenceExpression([
      revertEffect(effect),
      revertExpression(expression),
    ]),
  ConditionalExpression: (
    _context,
    expression1,
    expression2,
    expression3,
    _annotation,
  ) =>
    makeConditionalExpression(
      revertExpression(expression1),
      revertExpression(expression2),
      revertExpression(expression3),
    ),
  EvalExpression: (_context, variables, expression, _annotation) =>
    makeCallExpression(makeIdentifier(EVAL_KEYWORD), [
      makeArrayExpression(map(variables, makeIdentifier)),
      revertExpression(expression),
    ]),
  ApplyExpression: (
    _context,
    expression1,
    expression2,
    expressions,
    _annotation,
  ) =>
    makeCallExpression(
      revertExpression(expression1),
      concat(
        [makeUnaryExpression("!", revertExpression(expression2))],
        map(expressions, revertExpression),
      ),
    ),
  ConstructExpression: (_context, expression, expressions, _annotation) =>
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
});
