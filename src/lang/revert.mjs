/* eslint-disable no-use-before-define */

import {concat, map, reduceRight} from "array-lite";

import {generateThrowError} from "../util.mjs";

import {dispatchNode, fromLiteral} from "../ast/index.mjs";

import {makeMetaVariable, makeBaseVariable} from "./variable.mjs";

import {
  MODULE_PROGRAM_KEYWORD,
  SCRIPT_PROGRAM_KEYWORD,
  EVAL_PROGRAM_KEYWORD,
  EFFECT_KEYWORD,
  THROW_KEYWORD,
  EVAL_KEYWORD,
  UNDEFINED_KEYWORD,
  INPUT_KEYWORD,
  INTRINSIC_KEYWORD,
  YIELD_DELEGATE_KEYWORD,
  YIELD_STRAIGHT_KEYWORD,
  EXPORT_STATIC_KEYWORD,
  IMPORT_STATIC_KEYWORD,
} from "./keywords.mjs";

const {
  String,
  Error,
  undefined,
  Reflect: {apply},
  String: {
    prototype: {split},
  },
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
const makeUnaryExpression = (operator, argument) => ({
  type: "UnaryExpression",
  prefix: true,
  operator,
  argument,
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
const makeSpreadElement = (argument) => ({type: "SpreadElement", argument});
const makeImportExpression = (source) => ({type: "ImportExpression", source});
const makeNewExpression = (callee, $arguments) => ({
  type: "NewExpression",
  callee,
  arguments: $arguments,
});
const makeBinaryExpression = (operator, left, right) => ({
  type: "BinaryExpression",
  operator,
  left,
  right,
});
const makeObjectExpression = (properties) => ({
  type: "ObjectExpression",
  properties,
});
const makeProperty = (computed, key, value) => ({
  type: "Property",
  kind: "init",
  computed,
  key,
  value,
});

///////////////
// Transform //
///////////////

const transformMetaVariable = (variable) =>
  makeIdentifier(makeMetaVariable(variable));

const transformEnclave = (enclave) => {
  const segments = apply(split, enclave, ["."]);
  if (segments.length === 1) {
    return makeIdentifier(makeBaseVariable(segments[0]));
  }
  if (segments.length === 2) {
    return makeMemberExpression(
      false,
      makeIdentifier(makeBaseVariable(segments[0])),
      makeIdentifier(segments[1]),
    );
  }
  /* c8 ignore start */
  throw new Error("invalid enclave name");
  /* c8 ignore stop */
};

const transformProperty = (property) =>
  makeProperty(
    true,
    revertExpression(property[0]),
    revertExpression(property[1]),
  );

const transformMetaVariableDeclator = (variable) =>
  makeVariableDeclarator(makeIdentifier(makeMetaVariable(variable)), null);

////////////
// Revert //
////////////

const default_callback = generateThrowError("could not revert node");

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
            makeLiteral(SCRIPT_PROGRAM_KEYWORD),
            SCRIPT_PROGRAM_KEYWORD,
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
            makeLiteral(MODULE_PROGRAM_KEYWORD),
            MODULE_PROGRAM_KEYWORD,
          ),
        ],
        map(links, revertLink),
        [revertBlock(block)],
      ),
    ),
  EvalProgram: (_context, enclaves, variables, block, _annotation) =>
    makeProgram(
      "script",
      concat(
        [
          makeDirective(
            makeLiteral(EVAL_PROGRAM_KEYWORD),
            MODULE_PROGRAM_KEYWORD,
          ),
        ],
        enclaves.length === 0
          ? []
          : [
              makeExpressionStatement(
                makeArrayExpression(map(enclaves, transformEnclave)),
              ),
            ],
        variables.length === 0
          ? []
          : [
              makeVariableDeclaration(
                "let",
                map(variables, transformMetaVariableDeclator),
              ),
            ],
        [revertBlock(block)],
      ),
    ),
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
                  map(variables, transformMetaVariableDeclator),
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
  DeclareEnclaveStatement: (
    _context,
    kind,
    variable,
    expression,
    _annotation,
  ) =>
    makeVariableDeclaration(kind, [
      makeVariableDeclarator(
        makeIdentifier(makeBaseVariable(variable)),
        revertExpression(expression),
      ),
    ]),
});

export const revertEffect = generateRevert({
  __proto__: null,
  SetSuperEnclaveEffect: (_context, expression1, expression2, _annotation) =>
    makeAssignmentExpression(
      makeMemberExpression(
        true,
        makeIdentifier(makeBaseVariable("super")),
        revertExpression(expression1),
      ),
      revertExpression(expression2),
    ),
  WriteEffect: (_context, variable, expression, _annotation) =>
    makeAssignmentExpression(
      makeIdentifier(makeMetaVariable(variable)),
      revertExpression(expression),
    ),
  WriteEnclaveEffect: (_context, variable, expression, _annotation) =>
    makeAssignmentExpression(
      makeIdentifier(makeBaseVariable(variable)),
      revertExpression(expression),
    ),
  StaticExportEffect: (_context, specifier, expression, _annotation) =>
    makeCallExpression(makeIdentifier(EXPORT_STATIC_KEYWORD), [
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
    makeCallExpression(makeIdentifier(INTRINSIC_KEYWORD), [
      makeLiteral(intrinsic),
    ]),
  StaticImportExpression: (_context, source, specifier, _annotation) =>
    makeCallExpression(makeIdentifier(IMPORT_STATIC_KEYWORD), [
      makeLiteral(source),
      makeLiteral(specifier),
    ]),
  ReadExpression: (_context, variable, _annotation) =>
    makeIdentifier(makeMetaVariable(variable)),
  ReadEnclaveExpression: (_context, variable, _annotation) =>
    makeIdentifier(makeBaseVariable(variable)),
  TypeofEnclaveExpression: (_context, variable, _annotation) =>
    makeUnaryExpression("typeof", makeIdentifier(makeBaseVariable(variable))),
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
  ThrowExpression: (_context, expression, _annotation) =>
    makeCallExpression(makeIdentifier(THROW_KEYWORD), [
      revertExpression(expression),
    ]),
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
  GetSuperEnclaveExpression: (_context, expression, _annotation) =>
    makeMemberExpression(
      true,
      makeIdentifier(makeBaseVariable("super")),
      revertExpression(expression),
    ),
  CallSuperEnclaveExpression: (_context, expression, _annotation) =>
    makeCallExpression(makeIdentifier(makeBaseVariable("super")), [
      makeSpreadElement(revertExpression(expression)),
    ]),
  EvalExpression: (_context, enclaves, variables, expression, _annotation) =>
    makeCallExpression(makeIdentifier(EVAL_KEYWORD), [
      makeArrayExpression(map(enclaves, transformEnclave)),
      makeArrayExpression(map(variables, transformMetaVariable)),
      revertExpression(expression),
    ]),
  DynamicImportExpression: (_context, expression, _annotation) =>
    makeImportExpression(revertExpression(expression)),
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
        [revertExpression(expression2)],
        map(expressions, revertExpression),
      ),
    ),
  ConstructExpression: (_context, expression, expressions, _annotation) =>
    makeNewExpression(
      revertExpression(expression),
      map(expressions, revertExpression),
    ),
  UnaryExpression: (_context, operator, expression, _annotation) =>
    makeUnaryExpression(operator, revertExpression(expression)),
  BinaryExpression: (
    _context,
    operator,
    expression1,
    expression2,
    _annotation,
  ) =>
    makeBinaryExpression(
      operator,
      revertExpression(expression1),
      revertExpression(expression2),
    ),
  ObjectExpression: (_context, expression, properties, _annotation) =>
    makeObjectExpression(
      concat(
        [
          makeProperty(
            false,
            makeIdentifier("__proto__"),
            revertExpression(expression),
          ),
        ],
        map(properties, transformProperty),
      ),
    ),
});
