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
  (context, identifiers) => true,
  (context, block) => true];

const script_program_matcher = [
  "ScriptProgram",
  (context, block) => true];

const module_program_matcher = [
  "ModuleProgram",
  (context, links) => true,
  (context, block) => true];

///////////
// Visit //
///////////

const generate = (context, node) => (
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

const paragraphize = (identifier) => ` §${identifier}`;

const callbacks = {
  __proto__: null,
  // Program //
  ScriptProgram: (context, node, block) => (
    `script;` +
    generate(context, block)),
  EvalProgram: (context, node, identifiers, block) => (
    `eval${ArrayLite.join(ArrayLite.map(identifiers, paragraphize), "")};` +
    generate(context, block)),
  ModuleProgram: (context, node, links, block) => (
    `module;` +
    ArrayLite.join(
      ArrayLite.map(
        links,
        (link) => generate(context, link)),
      "") +
    generate(context, block)),
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
    generate(context, statement) +
    ` }`),
  // Branch //
  Branch: (context, node, labels, block) => `${ArrayLite.join(ArrayLite.map(labels, colon), " ")}${generate(context, block)}`,
  // Statement //
  ExpressionStatement: (context, node, expression) => `${generate(context, expression)};`,
  CompletionStatement: (context, node, expression) => `completion${generate(context, expression)};`,
  ReturnStatement: (context, node, expression) => `return${generate(context, expression)};`,
  BreakStatement: (context, node, label) => `break ${label};`,
  DebuggerStatement: (context, node) => `debugger;`,
  ListStatement: (context, node, statements) => ArrayLite.join(
    ArrayLite.map(
      statements,
      (statement) => generate(context, statement)),
    ""),
  BranchStatement: (context, node, branch) => generate(context, branch),
  DeclareEnclaveStatement: (context, node, kind, identifier, expression) => `enclave ${kind} ${identifier} =${generate(context, expression)};`,
  IfStatement: (context, node, expression, branch1, branch2) => (
    `if (` +
    generate(context, expression) +
    `)` +
    generate(context, branch1) +
    ` else` +
    generate(context, branch2)),
  WhileStatement: (context, node, expression, label_block) => (
    `while (` +
    generate(context, expression) +
    `)` +
    generate(context, label_block)),
  TryStatement: (context, node, branch1, branch2, branch3) => (
    `try` +
    generate(context, branch1) +
    ` catch` +
    generate(context, branch2) +
    ` finally` +
    generate(context, branch3)),
  // Expression //
  PrimitiveExpression: (context, node, primitive) => (
    primitive === void 0 ?
    `void 0` :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))),
  IntrinsicExpression: (context, node, intrinsic) => `#${intrinsic}`,
  ClosureExpression: (context, node, sort, asynchronous, generator, block) => `${asynchronous ? "async " : ""}${sort} ${generator ? "* " : ""}()${generate(context, block)}`,
  ReadExpression: (context, node, identifier) => identifier,
  WriteExpression: (context, node, identifier, expression) => `${identifier} =${generate(context, expression)}`,
  ReadEnclaveExpression: (context, node, identifier) => `enclave ${identifier}`,
  TypeofEnclaveExpression: (context, node, identifier) => `enclave typeof ${identifier}`,
  WriteEnclaveExpression: (context, node, strict, identifier, expression) => `enclave ${identifier} ${strict ? `!` : `?`}=${generate(context, expression)}`,
  CallSuperEnclaveExpression: (context, node, expression) => `enclave super(...${generate(context, expression)})`,
  MemberSuperEnclaveExpression: (context, node, expression) => `enclave super[${generate(context, expression)}]`,
  SequenceExpression: (context, node, expression1, expression2) => `(${generate(context, expression1)},${generate(context, expression2)})`,
  ConditionalExpression: (context, node, expression1, expression2, expression3) => `(${generate(context, expression1)} ?${generate(context, expression2)} :${generate(context, expression3)})`,
  ThrowExpression: (context, node, expression) => `throw${generate(context, expression)}`,
  AwaitExpression: (context, node, expression) => `await${generate(context, expression)}`,
  YieldExpression: (context, node, delegate, expression) => `yield${delegate ? " *" : ""}${generate(context, expression)}`,
  EvalExpression: (context, node, identifiers, expression) => `eval${ArrayLite.join(ArrayLite.map(identifiers, paragraphize), "")}${generate(context, expression)}`,
  RequireExpression: (context, node, expression) => `require${generate(context, expression)}`,
  ApplyExpression: (context, node, expression1, expression2, expressions) => (
    `(` +
    generate(context, expression1) +
    `(` +
    (
      Tree.match(null, expression2, undefined_primitive_expression_matcher) ?
      `` :
      (
        `@${generate(context, expression2)}` +
        (expressions.length === 0 ? `` : `,`))) +
    ArrayLite.join(
      ArrayLite.map(
        expressions,
        (expression) => generate(context, expression)),
      `,`) +
    `))`),
  ConstructExpression: (context, node, expression, expressions) => (
    `new` +
    generate(context, expression) +
    `(` +
    ArrayLite.join(
      ArrayLite.map(
        expressions,
        (expression) => generate(context, expression)),
      `,`) +
    `)`),
  ImportExpression: (context, node, specifier, source) => (
    `import ${specifier === null ? "*" : specifier} from ${global_JSON_stringify(source)}`),
  ExportExpression: (context, node, specifier, expression) => (
    Throw.assert(specifier !== null, null, `Null export specifier`),
    `export ${specifier}${generate(context, expression)}`),
  UnaryExpression: (context, node, operator, expression) => `${operator}${generate(context, expression)}`,
  BinaryExpression: (context, node, operator, expression1, expression2) => `(${generate(context, expression1)} ${operator}${generate(context, expression2)})`,
  ObjectExpression: (context, node, expression, properties) => (
    `{__proto__:` +
    generate(context, expression) +
    ArrayLite.join(
      ArrayLite.map(
        properties,
        ({0:expression1, 1:expression2}) => `,[${generate(context, expression1)}]:${generate(context, expression2)}`),
      "") +
    `}`)};

/////////////
// Exports //
/////////////

exports.generate = (node, options) => generate(
  global_Object_assign(
    {
      newline: "\n",
      indent: "  ",
      depth: 0},
    options),
  node);
