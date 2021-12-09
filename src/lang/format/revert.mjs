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
  ScriptProgram: (_context, _node, statements) =>
    makeProgram(
      "script",
      concat(
        [
          makeDirective(
            makeLiteral(SCRIPT_PROGRAM_KEYWORD, null),
            SCRIPT_PROGRAM_KEYWORD,
          ),
        ],
        map(statements, revertStatement),
      ),
    ),
  ModuleProgram: (_context, _node, links, block) =>
    makeProgram(
      "module",
      concat(
        [
          makeDirective(
            makeLiteral(MODULE_PROGRAM_KEYWORD, null),
            MODULE_PROGRAM_KEYWORD,
          ),
        ],
        map(links, revertLink),
        [revertBlock(block)],
      ),
    ),
  EvalProgram: (_context, _node, enclaves, variables, block) =>
    makeProgram(
      "script",
      concat(
        [
          makeDirective(
            makeLiteral(EVAL_PROGRAM_KEYWORD, null),
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
  ImportLink: (_context, _node, source, specifier) =>
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
  ExportLink: (_context, _node, specifier) =>
    makeExportNamedDeclaration(
      [
        makeExportSpecifier(
          makeIdentifier(specifier),
          makeIdentifier(specifier),
        ),
      ],
      null,
    ),
  AggregateLink: (_context, _node, source, specifier1, specifier2) =>
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
  Block: (_context, _node, labels, variables, statements) =>
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
  DebuggerStatement: (_context, _node) => makeDebuggerStatement(),
  ReturnStatement: (_context, _node, expression) =>
    makeReturnStatement(revertExpression(expression)),
  BreakStatement: (_context, _node, label) =>
    makeBreakStatement(makeIdentifier(label)),
  BlockStatement: (_context, _node, block) => revertBlock(block),
  IfStatement: (_context, _node, expression, block1, block2) =>
    makeIfStatement(
      revertExpression(expression),
      revertBlock(block1),
      revertBlock(block2),
    ),
  WhileStatement: (_context, _node, expression, block) =>
    makeWhileStatement(revertExpression(expression), revertBlock(block)),
  TryStatement: (_context, _node, block1, block2, block3) =>
    makeTryStatement(
      revertBlock(block1),
      makeCatchClause(revertBlock(block2)),
      revertBlock(block3),
    ),
  EffectStatement: (_context, _node, effect) =>
    makeExpressionStatement(revertEffect(effect)),
  DeclareEnclaveStatement: (_context, _node, kind, variable, expression) =>
    makeVariableDeclaration(kind, [
      makeVariableDeclarator(
        makeIdentifier(makeBaseVariable(variable)),
        revertExpression(expression),
      ),
    ]),
});

export const revertEffect = generateRevert({
  __proto__: null,
  SetSuperEnclaveEffect: (_context, _node, expression1, expression2) =>
    makeAssignmentExpression(
      makeMemberExpression(
        true,
        makeIdentifier(makeBaseVariable("super")),
        revertExpression(expression1),
      ),
      revertExpression(expression2),
    ),
  WriteEffect: (_context, _node, variable, expression) =>
    makeAssignmentExpression(
      makeIdentifier(makeMetaVariable(variable)),
      revertExpression(expression),
    ),
  WriteEnclaveEffect: (_context, _node, variable, expression) =>
    makeAssignmentExpression(
      makeIdentifier(makeBaseVariable(variable)),
      revertExpression(expression),
    ),
  StaticExportEffect: (_context, _node, specifier, expression) =>
    makeCallExpression(makeIdentifier(EXPORT_STATIC_KEYWORD), [
      makeLiteral(specifier, null),
      revertExpression(expression),
    ]),
  SequenceEffect: (_context, _node, effect1, effect2) =>
    makeSequenceExpression([revertEffect(effect1), revertEffect(effect2)]),
  ConditionalEffect: (_context, _node, expression, effect1, effect2) =>
    makeConditionalExpression(
      revertExpression(expression),
      revertEffect(effect1),
      revertEffect(effect2),
    ),
  ExpressionEffect: (_context, _node, expression) =>
    makeCallExpression(makeIdentifier(EFFECT_KEYWORD), [
      revertExpression(expression),
    ]),
});

export const revertExpression = generateRevert({
  __proto__: null,
  InputExpression: (_context, _node) => makeIdentifier(INPUT_KEYWORD),
  PrimitiveExpression: (_context, _node, primitive) => {
    if (typeof primitive === "object" && primitive !== null) {
      if (getOwnPropertyDescriptor(primitive, "bigint") !== undefined) {
        return makeLiteral(null, primitive.bigint);
      }
      if (getOwnPropertyDescriptor(primitive, "undefined") !== undefined) {
        return makeIdentifier(UNDEFINED_KEYWORD);
      }
      /* c8 ignore start */
      throw new Error("invalid primitive");
    }
    /* c8 ignore stop */
    return makeLiteral(primitive, null);
  },
  IntrinsicExpression: (_context, _node, intrinsic) =>
    makeCallExpression(makeIdentifier(INTRINSIC_KEYWORD), [
      makeLiteral(intrinsic, null),
    ]),
  StaticImportExpression: (_context, _node, source, specifier) =>
    makeCallExpression(makeIdentifier(IMPORT_STATIC_KEYWORD), [
      makeLiteral(source, null),
      makeLiteral(specifier, null),
    ]),
  ReadExpression: (_context, _node, variable) =>
    makeIdentifier(makeMetaVariable(variable)),
  ReadEnclaveExpression: (_context, _node, variable) =>
    makeIdentifier(makeBaseVariable(variable)),
  TypeofEnclaveExpression: (_context, _node, variable) =>
    makeUnaryExpression("typeof", makeIdentifier(makeBaseVariable(variable))),
  ClosureExpression: (_context, _node, kind, asynchronous, generator, block) =>
    kind === "arrow"
      ? makeArrowFunctionExpression(asynchronous, revertBlock(block))
      : makeFunctionExpression(
          kind === "function" ? null : makeIdentifier(kind),
          asynchronous,
          generator,
          revertBlock(block),
        ),
  AwaitExpression: (_context, _node, expression) =>
    makeAwaitExpression(revertExpression(expression)),
  YieldExpression: (_context, _node, delegate, expression) =>
    makeCallExpression(
      makeIdentifier(
        delegate ? YIELD_DELEGATE_KEYWORD : YIELD_STRAIGHT_KEYWORD,
      ),
      [revertExpression(expression)],
    ),
  ThrowExpression: (_context, _node, expression) =>
    makeCallExpression(makeIdentifier(THROW_KEYWORD), [
      revertExpression(expression),
    ]),
  SequenceExpression: (_context, _node, effect, expression) =>
    makeSequenceExpression([
      revertEffect(effect),
      revertExpression(expression),
    ]),
  ConditionalExpression: (
    _context,
    _node,
    expression1,
    expression2,
    expression3,
  ) =>
    makeConditionalExpression(
      revertExpression(expression1),
      revertExpression(expression2),
      revertExpression(expression3),
    ),
  GetSuperEnclaveExpression: (_context, _node, expression) =>
    makeMemberExpression(
      true,
      makeIdentifier(makeBaseVariable("super")),
      revertExpression(expression),
    ),
  CallSuperEnclaveExpression: (_context, _node, expression) =>
    makeCallExpression(makeIdentifier(makeBaseVariable("super")), [
      makeSpreadElement(revertExpression(expression)),
    ]),
  EvalExpression: (_context, _node, enclaves, variables, expression) =>
    makeCallExpression(makeIdentifier(EVAL_KEYWORD), [
      makeArrayExpression(map(enclaves, transformEnclave)),
      makeArrayExpression(map(variables, transformMetaVariable)),
      revertExpression(expression),
    ]),
  DynamicImportExpression: (_context, _node, expression) =>
    makeImportExpression(revertExpression(expression)),
  ApplyExpression: (_context, _node, expression1, expression2, expressions) =>
    makeCallExpression(
      revertExpression(expression1),
      concat(
        [revertExpression(expression2)],
        map(expressions, revertExpression),
      ),
    ),
  ConstructExpression: (_context, _node, expression, expressions) =>
    makeNewExpression(
      revertExpression(expression),
      map(expressions, revertExpression),
    ),
  UnaryExpression: (_context, _node, operator, expression) =>
    makeUnaryExpression(operator, revertExpression(expression)),
  BinaryExpression: (_context, _node, operator, expression1, expression2) =>
    makeBinaryExpression(
      operator,
      revertExpression(expression1),
      revertExpression(expression2),
    ),
  ObjectExpression: (_context, _node, expression, properties) =>
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
