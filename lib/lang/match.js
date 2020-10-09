"use strict";

const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;
const global_Error = global.Error;
const global_Math = global.Math;
const global_Date = global.Date;

const Tree = require("../tree.js");
const Generate = require("./generate.js");
const ArrayLite = require("array-lite");
const Fs = require("fs");
const Os = require("os");
const Path = require("path");
const ChildProcess = require("child_process");
const global_Reflect_apply = global.Reflect.apply;
const global_console_error = global.console.error;
const global_console = global.console;

const EMPTY = () => ({__proto__:null});

const get_tmp_path = () => Path.join(
  Os.tmpdir(),
  `aran-match-${global_Date.now()}-${global_Math.floor(10e10 * global_Math.random())}`);

const unlink = (path) => {
  try {
    Fs.unlinkSync(path);
  } catch (error) {
    /* istanbul ignore next */
    global_Reflect_apply(global_console_error, global_console, [error]);
  }
};

const proceed = (mapping, node1, node2, generate, callback) => {
  if (typeof mapping !== "string") {
    return callback(true, mapping);
  }
  const path1 = get_tmp_path();
  const path2 = get_tmp_path();
  try {
    Fs.writeFileSync(path1, generate(node1), "utf8");
    Fs.writeFileSync(path2, generate(node2), "utf8");
    // `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`
    // `paste ${path1} ${path2} | expand -t ${global_Math_floor(process.stdout.columns / 2)}`
    // `diff --side-by-side --with=${process.stdout.columns} ${path1} ${path2}`
    return callback(false, mapping + "\n" + ChildProcess.execSync(`pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`, {
      __proto__: null,
      encoding: "utf8"
    }));
  } finally {
    unlink(path1);
    unlink(path2);
  }
};

exports._expression = (expression1, expression2, callback) => proceed(
  Tree._allign_expression(expression_callback_object, "expression", expression1, expression2),
  expression1,
  expression2,
  Generate._expression,
  callback);

exports._statement = (statement1, statement2, callback) => proceed(
  Tree._allign_statement(statement_callback_object, "statement", statement1, statement2),
  statement1,
  statement2,
  Generate._statement,
  callback);

exports._block = (block1, block2, callback) => proceed(
  Tree._allign_block(block_callback_object, "block", block1, block2),
  block1,
  block2,
  Generate._block,
  callback);

const combine = (path, mappings) => {
  const mapping = {__proto__:null};
  for (let index = 0; index < mappings.length; index++) {
    if (typeof mappings[index] === "string") {
      return mappings[index];
    }
    for (let identifier in mappings[index]) {
      if (identifier in mapping && mapping[identifier] !== mappings[index][identifier]) {
        return `Combination mismatch at ${path} between ${mapping[identifier]} and ${mappings[index][identifier]} for ${identifier}`;
      }
      mapping[identifier] = mappings[index][identifier];
    }
  }
  return mapping;
};

const bind = (path, identifiers1, identifiers2, mapping) => {
  if (typeof mapping === "string") {
    return mapping;
  }
  mapping = global_Object_assign({__proto__:null}, mapping);
  for (let identifier in mapping) {
    const bounded = ArrayLite.has(identifiers1, identifier);
    if (bounded !== ArrayLite.has(identifiers2, mapping[identifier])) {
      return `Binding mismatch at ${path} between ${identifier} and ${mapping[identifier]}`;
    }
    if (bounded) {
      delete mapping[identifier];
    }
  }
  return mapping;
};

const print = (primitive) => (
  typeof primitive === "string" ?
  global_JSON_stringify(primitive) :
  global_String(primitive));

const check = (path, primitive1, primitive2, argument, callback) => (
  primitive1 !== primitive2 ?
  `Structural mismatch at ${path} between ${print(primitive1)} and ${print(primitive2)}` :
  callback(argument));

const check_all = (path, primitives1, primitives2, argument, callback, _next) => (
  _next = (index) => (
    index === primitives1.length ?
    callback(argument) :
    check(
      path + "-" + index,
      primitives1[index],
      primitives2[index],
      index + 1,
      _next)),
  check(
    path + "-length",
    primitives1.length,
    primitives2.length,
    0,
    _next));

const is_parameter = (identifier) => (
  identifier === "error" ||
  identifier === "new.target" ||
  identifier === "this" ||
  identifier === "arguments" ||
  identifier === "callee");

const type_mismatch = (path, node1, node2, type1, type2) => `Type mismatch at ${path} between ${type1} and ${type2}`;

const block_callback_object = {
  __type_mismatch__: type_mismatch,
  BLOCK: (path, block1, block2, identifiers1, statements1, identifiers2, statements2) => check(
    path + ".block-header-length",
    identifiers1.length,
    identifiers2.length,
    null,
    () => check(
      path + ".block-body-length",
      statements1.length,
      statements2.length,
      null,
      () => bind(
        path + ".block-header",
        identifiers1,
        identifiers2,
        combine(
          path + ".block-body",
          ArrayLite.map(
            statements1,
            (_, index) => Tree._allign_statement(
              statement_callback_object,
              path + ".block-body-" + index,
              statements1[index],
              statements2[index]))))))};

const statement_callback_object = {
  __type_mismatch__: type_mismatch,
  Lift: (path, statement1, statement2, expression1, expression2) => Tree._allign_expression(
    expression_callback_object,
    path + ".lift-expression",
    expression1,
    expression2),
  Return: (path, statement1, statement2, expression1, expression2) => Tree._allign_expression(
    expression_callback_object,
    path + ".return-argument",
    expression1,
    expression2),
  Break: (path, statement1, statement2, label1, label2) => check(path + ".break-label", label1, label2, null, EMPTY),
  Continue: (path, statement1, statement2, label1, label2) => check(path + ".continue-label", label1, label2, null, EMPTY),
  Debugger: (path, statement1, statement2) => ({__proto__:null}),
  Lone: (path, statement1, statement2, labels1, block1, labels2, block2) => check_all(
    path + ".lone-labels",
    labels1,
    labels2,
    null,
    () => Tree._allign_block(
      block_callback_object,
      path + ".lone-body",
      block1,
      block2)),
  If: (path, statement1, statement2, labels1, expression1, block11, block12, labels2, expression2, block21, block22) => check_all(
    path + ".if-labels",
    labels1,
    labels2,
    null,
    () => combine(
      path,
      [
        Tree._allign_expression(
          expression_callback_object,
          path + ".if-test",
          expression1,
          expression2),
        Tree._allign_block(
          block_callback_object,
          path + ".if-consequent",
          block11,
          block21),
        Tree._allign_block(
          block_callback_object,
          path + ".if-alternate",
          block12,
          block22)])),
  While: (path, statement1, statement2, labels1, expression1, block1, labels2, expression2, block2) => check_all(
    path + ".if-labels",
    labels1,
    labels2,
    null,
    () => combine(
      path,
      [
        Tree._allign_expression(
          expression_callback_object,
          path + ".while-test",
          expression1,
          expression2),
        Tree._allign_block(
          block_callback_object,
          path + ".while-body",
          block1,
          block2)])),
  Try: (path, statement1, statement2, labels1, block11, block12, block13, labels2, block21, block22, block23) => check_all(
    path + ".if-labels",
    labels1,
    labels2,
    null,
    () => combine(
      path,
      [
        Tree._allign_block(
          block_callback_object,
          path + ".try-body",
          block11,
          block21),
        Tree._allign_block(
          block_callback_object,
          path + ".try-catch",
          block12,
          block22),
        Tree._allign_block(
          block_callback_object,
          path + ".try-finally",
          block13,
          block23)]))};

const expression_callback_object = {
  __type_mismatch__: type_mismatch,
  primitive: (path, expression1, expression2, primitive1, primitive2) => check(path + ".primitive-body", primitive1, primitive2, null, EMPTY),
  builtin: (path, expression1, expression2, builtin1, builtin2) => check(path + ".builtin-body", builtin1, builtin2, null, EMPTY),
  arrow: (path, expression1, expression2, block1, block2) => Tree._allign_block(
    block_callback_object,
    path + ".arrow-body",
    block1,
    block2),
  function: (path, expression1, expression2, block1, block2) => Tree._allign_block(
    block_callback_object,
    path + ".function-body",
    block1,
    block2),
  method: (path, expression1, expression2, block1, block2) => Tree._allign_block(
    block_callback_object,
    path + ".method-body",
    block1,
    block2),
  constructor: (path, expression1, expression2, block1, block2) => Tree._allign_block(
    block_callback_object,
    path + ".constructor-body",
    block1,
    block2),
  read: (path, expression1, expression2, identifier1, identifier2) => (
    (
      is_parameter(identifier1) ||
      is_parameter(identifier2)) ?
    check(path + ".read-identifier", identifier1, identifier2, null, EMPTY) :
    {
      __proto__: null,
      [identifier1]: identifier2}),
  write: (path, expression1, expression2, identifier1, expression11, identifier2, expression21, _callback) => (
    (
      is_parameter(identifier1) ||
      is_parameter(identifier2)) ?
    check(
      path + ".write-identifier",
      identifier1,
      identifier2,
      null,
      () => Tree._allign_expression(
        expression_callback_object,
        path + ".write-right",
        expression11,
        expression21)) :
    combine(
      path,
      [
        {
          __proto__: null,
          [identifier1]: identifier2},
        Tree._allign_expression(
          expression_callback_object,
          path + ".write-right",
          expression11,
          expression21)])),
  sequence: (path, expression1, expression2, expression11, expression12, expression21, expression22) => combine(
    path,
    [
      Tree._allign_expression(
        expression_callback_object,
        path + ".sequence-first",
        expression11,
        expression21),
      Tree._allign_expression(
        expression_callback_object,
        path + ".sequence-second",
        expression12,
        expression22)]),
  conditional: (path, expression1, expression2, expression11, expression12, expression13, expression21, expression22, expression23) => combine(
    path,
    [
      Tree._allign_expression(
        expression_callback_object,
        path + ".conditional-test",
        expression11,
        expression21),
      Tree._allign_expression(
        expression_callback_object,
        path + ".conditional-consequent",
        expression12,
        expression22),
      Tree._allign_expression(
        expression_callback_object,
        path + ".conditional-alternative",
        expression13,
        expression23)]),
  throw: (path, expression1, expression2, expression11, expression21) => Tree._allign_expression(
    expression_callback_object,
    path + ".throw-argument",
    expression11,
    expression21),
  eval: (path, expression1, expression2, expression11, expression21) => Tree._allign_expression(
    expression_callback_object,
    path + ".eval-argument",
    expression11,
    expression21),
  apply: (path, expression1, expression2, expression11, expression12, expressions1, expression21, expression22, expressions2) => check(
    path + ".apply-arguments-length",
    expressions1.length,
    expressions2.length,
    null,
    () => combine(
      path,
      ArrayLite.concat(
        [
          Tree._allign_expression(
            expression_callback_object,
            path + ".apply-callee",
            expression11,
            expression21),
          Tree._allign_expression(
            expression_callback_object,
            path + ".apply-this",
            expression12,
            expression22)],
        ArrayLite.map(
          expressions1,
          (_, index) => Tree._allign_expression(
            expression_callback_object,
            path + ".apply-arguments-" + index,
            expressions1[index],
            expressions2[index]))))),
  construct: (path, expression1, expression2, expression11, expressions1, expression21, expressions2) => check(
    path + ".construct-arguments-length",
    expressions1.length,
    expressions2.length,
    null,
    () => combine(
      path,
      ArrayLite.concat(
        [
          Tree._allign_expression(
            expression_callback_object,
            path + ".construct-callee",
            expression11,
            expression21)],
        ArrayLite.map(
          expressions1,
          (_, index) => Tree._allign_expression(
            expression_callback_object,
            path + ".construct-argument-" + index,
            expressions1[index],
            expressions2[index]))))),
  unary: (path, expression1, expression2, operator1, expression11, operator2, expression21) => check(
    path + ".unary-operator",
    operator1,
    operator2,
    null,
    () => Tree._allign_expression(
      expression_callback_object,
      path + ".unary-argument",
      expression11,
      expression21)),
  binary: (path, expression1, expression2, operator1, expression11, expression12, operator2, expression21, expression22) => check(
    path + ".binary-operator",
    operator1,
    operator2,
    null,
    () => combine(
      path,
      [
        Tree._allign_expression(
          expression_callback_object,
          path + ".binary-left",
          expression11,
          expression21),
        Tree._allign_expression(
          expression_callback_object,
          path + ".binary-right",
          expression12,
          expression22)])),
  object: (path, expression1, expression2, expression11, properties1, expression21, properties2) => check(
    path + ".object-properties-length",
    properties1.length,
    properties2.length,
    null,
    () => combine(
      path,
      ArrayLite.concat(
        [
          Tree._allign_expression(
            expression_callback_object,
            path + ".object-prototype",
            expression11,
            expression21)],
        ArrayLite.map(
          properties1,
          (_, index) => combine(
            path,
            [
              Tree._allign_expression(
                expression_callback_object,
                path + ".object-properties-" + index + "-key",
                properties1[index][0],
                properties2[index][0]),
              Tree._allign_expression(
                expression_callback_object,
                path + ".object-properties-" + index + "-value",
                properties1[index][1],
                properties2[index][1])])))))};
