/* eslint-disable no-use-before-define */

import {concat, map, reduceRight} from "array-lite";

import {generateThrowError} from "../../util.mjs";

import {dispatchNode} from "../ast/index.mjs";

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
  Error,
  undefined,
  Reflect: {apply, getOwnPropertyDescriptor},
  String: {
    prototype: {split},
  },
  JSON: {stringify: stringifyJSON},
} = globalThis;

//////////
// Make //
//////////

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
const makeLiteral = (value, bigint) => ({
  type: "Literal",
  value,
  bigint,
  raw: bigint === null ? stringifyJSON(value) : `${bigint}n`,
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
  local,
  exported,
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
const makeCallExpression = (callee, _arguments) => ({
  type: "CallExpression",
  optional: false,
  callee,
  arguments: _arguments,
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
const makeFunctionExpression = (id, _async, generator, body) => ({
  type: "FunctionExpression",
  id,
  async: _async,
  generator,
  body,
});
const makeArrowFunctionExpression = (_async, body) => ({
  type: "ArrowFunctionExpression",
  id: null,
  async: _async,
  params: [],
  body,
});
const makeAwaitExpression = (argument) => ({type: "AwaitExpression", argument});
const makeSpreadElement = (argument) => ({type: "SpreadElement", argument});
const makeImportExpression = (source) => ({type: "ImportExpression", source});
const makeNewExpression = (callee, _arguments) => ({
  type: "NewExpression",
  callee,
  arguments: _arguments,
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
  throw new Error("invalid enclave name");
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
  ScriptProgram: (context, node, statements) =>
    makeProgram(
      "script",
      concat(
        [makeExpressionStatement(makeLiteral(SCRIPT_PROGRAM_KEYWORD, null))],
        map(statements, revertStatement),
      ),
    ),
  ModuleProgram: (context, node, links, block) =>
    makeProgram(
      "module",
      concat(
        [makeExpressionStatement(makeLiteral(MODULE_PROGRAM_KEYWORD, null))],
        map(links, revertLink),
        [revertBlock(block)],
      ),
    ),
  EvalProgram: (context, node, enclaves, variables, block) =>
    makeProgram(
      "script",
      concat(
        [
          makeExpressionStatement(makeLiteral(EVAL_PROGRAM_KEYWORD, null)),
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
  ImportLink: (context, node, source, specifier) =>
    makeImportDeclaration(
      specifier === null
        ? []
        : [
            makeImportSpecifier(
              makeIdentifier(specifier),
              makeIdentifier(specifier),
            ),
          ],
      makeLiteral(source, null),
    ),
  ExportLink: (context, node, specifier) =>
    makeExportNamedDeclaration(
      [
        makeExportSpecifier(
          makeIdentifier(specifier),
          makeIdentifier(specifier),
        ),
      ],
      null,
    ),
  AggregateLink: (context, node, source, specifier1, specifier2) =>
    specifier1 === null
      ? makeExportAllDeclaration(
          specifier2 === null ? null : makeIdentifier(specifier2),
          makeLiteral(source, null),
        )
      : makeExportNamedDeclaration(
          [
            makeExportSpecifier(
              makeIdentifier(specifier1),
              makeIdentifier(specifier2),
            ),
          ],
          makeLiteral(source, null),
        ),
});

export const accumulateLabel = (node, label) =>
  makeLabeledStatement(makeIdentifier(label), node);

export const revertBlock = generateRevert({
  __proto__: null,
  Block: (context, node, labels, variables, statements) =>
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
  DebuggerStatement: (context, node) => makeDebuggerStatement(),
  ReturnStatement: (context, node, expression) =>
    makeReturnStatement(revertExpression(expression)),
  BreakStatement: (context, node, label) =>
    makeBreakStatement(makeIdentifier(label)),
  BlockStatement: (context, node, block) => revertBlock(block),
  IfStatement: (context, node, expression, block1, block2) =>
    makeIfStatement(
      revertExpression(expression),
      revertBlock(block1),
      revertBlock(block2),
    ),
  WhileStatement: (context, node, expression, block) =>
    makeWhileStatement(revertExpression(expression), revertBlock(block)),
  TryStatement: (context, node, block1, block2, block3) =>
    makeTryStatement(
      revertBlock(block1),
      makeCatchClause(revertBlock(block2)),
      revertBlock(block3),
    ),
  EffectStatement: (context, node, effect) =>
    makeExpressionStatement(revertEffect(effect)),
  DeclareEnclaveStatement: (context, node, kind, variable, expression) =>
    makeVariableDeclaration(kind, [
      makeVariableDeclarator(
        makeIdentifier(makeBaseVariable(variable)),
        revertExpression(expression),
      ),
    ]),
});

export const revertEffect = generateRevert({
  __proto__: null,
  SetSuperEnclaveEffect: (context, node, expression1, expression2) =>
    makeAssignmentExpression(
      makeMemberExpression(
        true,
        makeIdentifier(makeBaseVariable("super")),
        revertExpression(expression1),
      ),
      revertExpression(expression2),
    ),
  WriteEffect: (context, node, variable, expression) =>
    makeAssignmentExpression(
      makeIdentifier(makeMetaVariable(variable)),
      revertExpression(expression),
    ),
  WriteEnclaveEffect: (context, node, variable, expression) =>
    makeAssignmentExpression(
      makeIdentifier(makeBaseVariable(variable)),
      revertExpression(expression),
    ),
  StaticExportEffect: (context, node, specifier, expression) =>
    makeCallExpression(makeIdentifier(EXPORT_STATIC_KEYWORD), [
      makeLiteral(specifier, null),
      revertExpression(expression),
    ]),
  SequenceEffect: (context, node, effect1, effect2) =>
    makeSequenceExpression([revertEffect(effect1), revertEffect(effect2)]),
  ConditionalEffect: (context, node, expression, effect1, effect2) =>
    makeConditionalExpression(
      revertExpression(expression),
      revertEffect(effect1),
      revertEffect(effect2),
    ),
  ExpressionEffect: (context, node, expression) =>
    makeCallExpression(makeIdentifier(EFFECT_KEYWORD), [
      revertExpression(expression),
    ]),
});

export const revertExpression = generateRevert({
  __proto__: null,
  InputExpression: (context, node) => makeIdentifier(INPUT_KEYWORD),
  PrimitiveExpression: (context, node, primitive) => {
    if (typeof primitive === "object" && primitive !== null) {
      if (getOwnPropertyDescriptor(primitive, "bigint") !== undefined) {
        return makeLiteral(null, primitive.bigint);
      }
      if (getOwnPropertyDescriptor(primitive, "undefined") !== undefined) {
        return makeIdentifier(UNDEFINED_KEYWORD);
      }
      throw new Error("invalid primitive");
    }
    return makeLiteral(primitive, null);
  },
  IntrinsicExpression: (context, node, intrinsic) =>
    makeCallExpression(makeIdentifier(INTRINSIC_KEYWORD), [
      makeLiteral(intrinsic, null),
    ]),
  StaticImportExpression: (context, node, source, specifier) =>
    makeCallExpression(makeIdentifier(IMPORT_STATIC_KEYWORD), [
      makeLiteral(source, null),
      makeLiteral(specifier, null),
    ]),
  ReadExpression: (context, node, variable) =>
    makeIdentifier(makeMetaVariable(variable)),
  ReadEnclaveExpression: (context, node, variable) =>
    makeIdentifier(makeBaseVariable(variable)),
  TypeofEnclaveExpression: (context, node, variable) =>
    makeUnaryExpression("typeof", makeIdentifier(makeBaseVariable(variable))),
  ClosureExpression: (context, node, kind, asynchronous, generator, block) =>
    kind === "arrow"
      ? makeArrowFunctionExpression(asynchronous, revertBlock(block))
      : makeFunctionExpression(
          kind === "function" ? null : makeIdentifier(kind),
          asynchronous,
          generator,
          revertBlock(block),
        ),
  AwaitExpression: (context, node, expression) =>
    makeAwaitExpression(revertExpression(expression)),
  YieldExpression: (context, node, delegate, expression) =>
    makeCallExpression(
      makeIdentifier(
        delegate ? YIELD_DELEGATE_KEYWORD : YIELD_STRAIGHT_KEYWORD,
      ),
      [revertExpression(expression)],
    ),
  ThrowExpression: (context, node, expression) =>
    makeCallExpression(makeIdentifier(THROW_KEYWORD), [
      revertExpression(expression),
    ]),
  SequenceExpression: (context, node, effect, expression) =>
    makeSequenceExpression([
      revertEffect(effect),
      revertExpression(expression),
    ]),
  ConditionalExpression: (
    context,
    node,
    expression1,
    expression2,
    expression3,
  ) =>
    makeConditionalExpression(
      revertExpression(expression1),
      revertExpression(expression2),
      revertExpression(expression3),
    ),
  GetSuperEnclaveExpression: (context, node, expression) =>
    makeMemberExpression(
      true,
      makeIdentifier(makeBaseVariable("super")),
      revertExpression(expression),
    ),
  CallSuperEnclaveExpression: (context, node, expression) =>
    makeCallExpression(makeIdentifier(makeBaseVariable("super")), [
      makeSpreadElement(revertExpression(expression)),
    ]),
  EvalExpression: (context, node, enclaves, variables, expression) =>
    makeCallExpression(makeIdentifier(EVAL_KEYWORD), [
      makeArrayExpression(map(enclaves, transformEnclave)),
      makeArrayExpression(map(variables, transformMetaVariable)),
      revertExpression(expression),
    ]),
  DynamicImportExpression: (context, node, expression) =>
    makeImportExpression(revertExpression(expression)),
  ApplyExpression: (context, node, expression1, expression2, expressions) =>
    makeCallExpression(
      revertExpression(expression1),
      concat(
        [revertExpression(expression2)],
        map(expressions, revertExpression),
      ),
    ),
  ConstructExpression: (context, node, expression, expressions) =>
    makeNewExpression(
      revertExpression(expression),
      map(expressions, revertExpression),
    ),
  UnaryExpression: (context, node, operator, expression) =>
    makeUnaryExpression(operator, revertExpression(expression)),
  BinaryExpression: (context, node, operator, expression1, expression2) =>
    makeBinaryExpression(
      operator,
      revertExpression(expression1),
      revertExpression(expression2),
    ),
  ObjectExpression: (context, node, expression, properties) =>
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
