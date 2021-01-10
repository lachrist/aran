"use strict";

const Throw = require("../throw.js");
const Tree = require("../tree.js");
const ArrayLite = require("array-lite");

const global_JSON_stringify = global.JSON.stringify;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_apply = global.Reflect.apply;
const global_String = global.String;

const INDENT = "  ";

const label_colon = (label) => `${label}: `;

const primitive_undefined_matcher = [
  "primitive",
  void 0];

const lift_matcher = [
  "Lift",
  (context, expression) => true];

const lone_matcher = [
  "Lone",
  (context, block) => true];

const program_matcher = [
  "_program",
  (context, identifiers) => true,
  (context, block) => true];

///////////
// Visit //
///////////

const generate = (newline, node) => (
  (
    Tree._match(null, node, lift_matcher) ||
    Tree._match(null, node, lone_matcher) ||
    Tree._match(null, node, program_matcher)) ?
  Tree._dispatch(newline, node, callbacks) :
  `${newline}${Tree._dispatch(newline + INDENT, node, callbacks)}`);

const callbacks = {
  __proto__: null,
  // Program //
  _program: (newline, node, preludes, block) => (
    ArrayLite.join(
      ArrayLite.map(
        preludes,
        (prelude) => generate(newline, prelude)),
      "") +
    generate(newline, block)),
  // Prelude //
  _import: (newline, node, specifier, source) => (
    `import ${(specifier === null ? "*" : specifier)} from ${global_JSON_stringify(source)};`),
  _export: (newline, node, specifier) => (
    Throw.assert(specifier !== null, null, `Null export specifier`),
    `export ${specifier};`),
  _aggregate: (newline, node, specifier1, source, specifier2) => (
    Throw.assert(
      (specifier1 === null) === (specifier2 === null),
      null,
      `Aggregate import/export specifier nullish mismatch`),
    `aggregate ${(specifier1 === null ? "*" : specifier1)} from ${global_JSON_stringify(source)}${(specifier2 === null ? `` : ` as ${specifier2}`)};`),
  // Block //
  BLOCK: (newline, node, labels, identifiers, statements) => (
    ArrayLite.join(
      ArrayLite.map(labels, label_colon),
      "") +
    `{` +
    (
      identifiers.length === 0 ?
      `` :
      ` let ${ArrayLite.join(identifiers, `, `)};`) +
    ArrayLite.join(
      ArrayLite.map(
        statements,
        (statement) => generate(newline, statement)),
      ``) +
    ` }`),
  // Statement //
  Lift: (newline, node, expression) => `${generate(newline, expression)};`,
  Return: (newline, node, expression) => `return${generate(newline, expression)};`,
  Break: (newline, node, label) => `break ${label};`,
  Debugger: (newline, node) => `debugger;`,
  Bundle: (newline, node, statements) => (
    `/* bundle */` +
    ArrayLite.join(
      ArrayLite.map(
        statements,
        (statement) => generate(newline, statement)),
      "")),
  Lone: (newline, node, block) => generate(newline, block),
  EnclaveDeclare: (newline, node, kind, identifier, expression) => `enclave ${kind} ${identifier} =${generate(newline, expression)};`,
  If: (newline, node, expression, block1, block2) => (
    `if (` +
    generate(newline, expression) +
    `)` +
    generate(newline, block1) +
    ` else` +
    generate(newline, block2)),
  While: (newline, node, expression, block) => (
    `while (` +
    generate(newline, expression) +
    `)` +
    generate(newline, block)),
  Try: (newline, node, block1, block2, block3) => (
    `try` +
    generate(newline, block1) +
    ` catch` +
    generate(newline, block2) +
    ` finally` +
    generate(newline, block3)),
  // Expression //
  primitive: (newline, node, primitive) => (
    primitive === void 0 ?
    `void 0` :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))),
  intrinsic: (newline, node, intrinsic) => (
    "#" +
    (
      global_Reflect_apply(
        global_RegExp_prototype_test,
        /^[$_a-zA-Z][$_a-zA-Z0-9]*(\.[$_a-zA-Z][$_a-zA-Z0-9]*)*$/,
        [intrinsic]) ?
      intrinsic :
      global_JSON_stringify(intrinsic))),
  closure: (newline, node, sort, asynchronous, generator, block) => `${asynchronous ? "async " : ""}${sort} ${generator ? "* " : ""}()${generate(newline, block)}`,
  read: (newline, node, identifier) => identifier,
  write: (newline, node, identifier, expression) => `${identifier} =${generate(newline, expression)}`,
  enclave_read: (newline, node, identifier) => `enclave ${identifier}`,
  enclave_typeof: (newline, node, identifier) => `enclave typeof ${identifier}`,
  enclave_write: (newline, node, strict, identifier, expression) => `enclave ${identifier} ${strict ? `!` : `?`}=${generate(newline, expression)}`,
  enclave_super_call: (newline, node, expression) => `enclave super(...${generate(newline, expression)})`,
  enclave_super_member: (newline, node, expression) => `enclave super[${generate(newline, expression)}]`,
  sequence: (newline, node, expression1, expression2) => `(${generate(newline, expression1)},${generate(newline, expression2)})`,
  conditional: (newline, node, expression1, expression2, expression3) => `(${generate(newline, expression1)} ?${generate(newline, expression2)} :${generate(newline, expression3)})`,
  throw: (newline, node, expression) => `throw${generate(newline, expression)}`,
  await: (newline, node, expression) => `await${generate(newline, expression)}`,
  yield: (newline, node, delegate, expression) => `yield${delegate ? " *" : ""}${generate(newline, expression)}`,
  eval: (newline, node, expression) => `eval${generate(newline, expression)}`,
  require: (newline, node, expression) => `require${generate(newline, expression)}`,
  apply: (newline, node, expression1, expression2, expressions) => (
    `(` +
    generate(newline, expression1) +
    `(` +
    (
      Tree._match(null, expression2, primitive_undefined_matcher) ?
      `` :
      (
        `@${generate(newline, expression2)}` +
        (expressions.length === 0 ? `` : `,`))) +
    ArrayLite.join(
      ArrayLite.map(
        expressions,
        (expression) => generate(newline, expression)),
      `,`) +
    `))`),
  construct: (newline, node, expression, expressions) => (
    `new` +
    generate(newline, expression) +
    `(` +
    ArrayLite.join(
      ArrayLite.map(
        expressions,
        (expression) => generate(newline, expression)),
      `,`) +
    `)`),
  import: (newline, node, specifier, source) => (
    `import ${specifier === null ? "*" : specifier} from ${global_JSON_stringify(source)}`),
  export: (newline, node, specifier, expression) => (
    Throw.assert(specifier !== null, null, `Null export specifier`),
    `export ${specifier}${generate(newline, expression)}`),
  unary: (newline, node, operator, expression) => `${operator}${generate(newline, expression)}`,
  binary: (newline, node, operator, expression1, expression2) => `(${generate(newline, expression1)} ${operator}${generate(newline, expression2)})`,
  object: (newline, node, expression, properties) => (
    `{__proto__:` +
    generate(newline, expression) +
    ArrayLite.join(
      ArrayLite.map(
        properties,
        ({0:expression1, 1:expression2}) => `,[${generate(newline, expression1)}]:${generate(newline, expression2)}`),
      "") +
    `}`)};

/////////////
// Exports //
/////////////

exports._generate = (node) => generate("\n", node);

exports._generate_indented = (node, indent) => generate("\n" + indent, node);
