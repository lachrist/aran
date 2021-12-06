"use strict";

const Throw = require("../throw.js");
const Tree = require("../tree.js");
const ArrayLite = require("array-lite");

const global_JSON_stringify = global.JSON.stringify;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_apply = global.Reflect.apply;
const global_String = global.String;
const global_String_prototype_repeat = global.String.prototype.repeat;
const global_Object_assign = global.Object.assign;

const colon = (label) => `${label}:`

/////////////
// Matcher //
/////////////

const empty_branch_matcher = [
  "Branch",
  [],
  (block) => true];

const list_statement_matcher = [
  "ListStatement",
  (statements) => true];

const undefined_primitive_expression_matcher = [
  "PrimitiveExpression",
  void 0];

const expression_statement_matcher = [
  "ExpressionStatement",
  (context, expression) => true];

const branch_statement_matcher = [
  "BranchStatement",
  (context, branch) => true];

const eval_program_matcher = [
  "EvalProgram",
  (enclave) => true,
  (context, identifiers) => true,
  (context, block) => true];

const script_program_matcher = [
  "ScriptProgram",
  (enclave) => true,
  (context, statement) => true];

const module_program_matcher = [
  "ModuleProgram",
  (enclave) => true,
  (context, links) => true,
  (context, block) => true];

///////////
// Visit //
///////////

const stringify = (context, node) => (
  (
    Tree.match(null, node, empty_branch_matcher) ||
    Tree.match(null, node, list_statement_matcher) ||
    Tree.match(null, node, expression_statement_matcher) ||
    Tree.match(null, node, branch_statement_matcher) ||
    Tree.match(null, node, eval_program_matcher) ||
    Tree.match(null, node, script_program_matcher) ||
    Tree.match(null, node, module_program_matcher)) ?
  Tree.dispatch(context, node, callbacks) :
  (
    context.newline +
    global_Reflect_apply(global_String_prototype_repeat, context.indent, [context.depth]) +
    Tree.dispatch(
      {
        newline: context.newline,
        indent: context.indent,
        depth: context.depth + 1},
      node,
      callbacks)));

const append_coma = (identifier) => `${identifier},`;

const generateStringify = (context) => (node) => generate(context, node);

const BASE

const stringifyEnclave = (enclave) => enclave === "var" ? "var" : `$${}`

const callbacks = {
  __proto__: null,
  // Program //
  ScriptProgram: (context, node, statements) => (
    `script; ${map(statements, generateStringify(context))}`
  EvalProgram: (context, node, enclave, identifiers, block) => (
    `eval; [${join(map(enclaves, stringifyEnclave), ", "}]; ${identifiers.length === 0 ? "" : `let `}`
    (enclave === null ? `eval;` : `enclave eval ${enclave};`) +
    (
      identifiers.length === 0 ?
      `` :
      ` let ${ArrayLite.join(identifiers, ", ")};`) +
    stringify(context, block)),
  ModuleProgram: (context, node, enclave, links, block) => (
    (enclave === null ? `module;` : `enclave module;`) +
    ArrayLite.join(
      ArrayLite.map(
        links,
        (link) => stringify(context, link)),
      "") +
    stringify(context, block)),
  // Link //
  ImportLink: (context, node, specifier, source) => (
    `import ${(specifier === null ? "*" : specifier)} from ${global_JSON_stringify(source)};`),
  ExportLink: (context, node, specifier) => (
    Throw.assert(specifier !== null, null, `Null export specifier`),
    `export ${specifier};`),
  AggregateLink: (context, node, specifier1, source, specifier2) => (
    Throw.assert(
      (specifier1 === null) === (specifier2 === null),
      null,
      `Aggregate import/export specifier nullish mismatch`),
    `aggregate ${(specifier1 === null ? "*" : specifier1)} from ${global_JSON_stringify(source)}${(specifier2 === null ? `` : ` as ${specifier2}`)};`),
  // Block //
  Block: (context, node, identifiers, statement) => (
    `{` +
    (
      identifiers.length === 0 ?
      `` :
      ` let ${ArrayLite.join(identifiers, `, `)};`) +
    stringify(context, statement) +
    ` }`),
  // Branch //
  Branch: (context, node, labels, block) => `${ArrayLite.join(ArrayLite.map(labels, colon), " ")}${stringify(context, block)}`,
  // Statement //
  ExpressionStatement: (context, node, expression) => `${stringify(context, expression)};`,
  CompletionStatement: (context, node, expression) => `completion${stringify(context, expression)};`,
  ReturnStatement: (context, node, expression) => `return${stringify(context, expression)};`,
  BreakStatement: (context, node, label) => `break ${label};`,
  DebuggerStatement: (context, node) => `debugger;`,
  ListStatement: (context, node, statements) => ArrayLite.join(
    ArrayLite.map(
      statements,
      (statement) => stringify(context, statement)),
    ""),
  BranchStatement: (context, node, branch) => stringify(context, branch),
  DeclareEnclaveStatement: (context, node, kind, identifier, expression) => `enclave ${kind} ${identifier} =${stringify(context, expression)};`,
  IfStatement: (context, node, expression, branch1, branch2) => (
    `if (` +
    stringify(context, expression) +
    `)` +
    stringify(context, branch1) +
    ` else` +
    stringify(context, branch2)),
  WhileStatement: (context, node, expression, label_block) => (
    `while (` +
    stringify(context, expression) +
    `)` +
    stringify(context, label_block)),
  TryStatement: (context, node, branch1, branch2, branch3) => (
    `try` +
    stringify(context, branch1) +
    ` catch` +
    stringify(context, branch2) +
    ` finally` +
    stringify(context, branch3)),
  // Expression //
  PrimitiveExpression: (context, node, primitive) => (
    primitive === void 0 ?
    `void 0` :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))),
  IntrinsicExpression: (context, node, intrinsic) => `#${intrinsic}`,
  ClosureExpression: (context, node, sort, asynchronous, generator, block) => `${asynchronous ? "async " : ""}${sort} ${generator ? "* " : ""}()${stringify(context, block)}`,
  ReadExpression: (context, node, identifier) => identifier,
  WriteExpression: (context, node, identifier, expression) => `${identifier} =${stringify(context, expression)}`,
  ReadEnclaveExpression: (context, node, identifier) => `enclave ${identifier}`,
  TypeofEnclaveExpression: (context, node, identifier) => `enclave typeof ${identifier}`,
  WriteEnclaveExpression: (context, node, strict, identifier, expression) => `enclave ${identifier} ${strict ? `!` : `?`}=${stringify(context, expression)}`,
  CallSuperEnclaveExpression: (context, node, expression) => `enclave super(...${stringify(context, expression)})`,
  GetSuperEnclaveExpression: (context, node, expression) => `enclave super[${stringify(context, expression)}]`,
  SetSuperEnclaveExpression: (context, node, expression1, expression2) => `enclave super[${stringify(context, expression1)}] = ${stringify(context, expression2)}`,
  SequenceExpression: (context, node, expression1, expression2) => `(${stringify(context, expression1)},${stringify(context, expression2)})`,
  ConditionalExpression: (context, node, expression1, expression2, expression3) => `(${stringify(context, expression1)} ?${stringify(context, expression2)} :${stringify(context, expression3)})`,
  ThrowExpression: (context, node, expression) => `throw${stringify(context, expression)}`,
  AwaitExpression: (context, node, expression) => `await${stringify(context, expression)}`,
  YieldExpression: (context, node, delegate, expression) => `yield${delegate ? " *" : ""}${stringify(context, expression)}`,
  EvalExpression: (context, node, enclave, identifiers, expression) => `${enclave === null ? `eval` : `enclave eval ${enclave}`} (${ArrayLite.join(ArrayLite.map(identifiers, append_coma), " ")}${stringify(context, expression)})`,
  RequireExpression: (context, node, expression) => `require${stringify(context, expression)}`,
  ApplyExpression: (context, node, expression1, expression2, expressions) => (
    `(` +
    stringify(context, expression1) +
    `(` +
    (
      Tree.match(null, expression2, undefined_primitive_expression_matcher) ?
      `` :
      (
        `@${stringify(context, expression2)}` +
        (expressions.length === 0 ? `` : `,`))) +
    ArrayLite.join(
      ArrayLite.map(
        expressions,
        (expression) => stringify(context, expression)),
      `,`) +
    `))`),
  ConstructExpression: (context, node, expression, expressions) => (
    `new` +
    stringify(context, expression) +
    `(` +
    ArrayLite.join(
      ArrayLite.map(
        expressions,
        (expression) => stringify(context, expression)),
      `,`) +
    `)`),
  ImportExpression: (context, node, specifier, source) => (
    `import ${specifier === null ? "*" : specifier} from ${global_JSON_stringify(source)}`),
  ExportExpression: (context, node, specifier, expression) => (
    Throw.assert(specifier !== null, null, `Null export specifier`),
    `export ${specifier}${stringify(context, expression)}`),
  UnaryExpression: (context, node, operator, expression) => `${operator}${stringify(context, expression)}`,
  BinaryExpression: (context, node, operator, expression1, expression2) => `(${stringify(context, expression1)} ${operator}${stringify(context, expression2)})`,
  ObjectExpression: (context, node, expression, properties) => (
    `{__proto__:` +
    stringify(context, expression) +
    ArrayLite.join(
      ArrayLite.map(
        properties,
        ({0:expression1, 1:expression2}) => `,[${stringify(context, expression1)}]:${stringify(context, expression2)}`),
      "") +
    `}`)};

/////////////
// Exports //
/////////////

exports.stringify = (node, options) => stringify(
  global_Object_assign(
    {
      newline: "\n",
      indent: "  ",
      depth: 0},
    options),
  node);
