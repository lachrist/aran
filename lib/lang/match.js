"use strict";

const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;
const global_Math_floor = global.Math.floor;
const global_Math_random = global.Math.random;
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
  `aran-match-${global_Date.now()}-${global_Math_floor(10e10 * global_Math_random())}`);

const unlink = (path) => {
  try {
    Fs.unlinkSync(path);
  } catch (error) {
    /* istanbul ignore next */
    global_Reflect_apply(global_console_error, global_console, [error]);
  }
};

const diff = (code1, code2) => {
  require("colors");
  const parts = require("diff").diffWords(code1, code2);
  parts.forEach((part) => {
    const color = (
      part.added ?
      "green" :
      (
        part.removed ? "red" : "grey"));
    process.stderr.write(part.value[color]);});
  process.stderr.write("\n");
}

exports._match = (node1, node2, callback) => {
  const mapping = Tree._allign("root", node1, node2, callbacks);
  if (typeof mapping !== "string") {
    return callback(true, mapping);
  }
  const path1 = get_tmp_path();
  const path2 = get_tmp_path();
  try {
    Fs.writeFileSync(path1, Generate._generate(node1), "utf8");
    Fs.writeFileSync(path2, Generate._generate(node2), "utf8");
    diff(Generate._generate(node1), Generate._generate(node2));
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

const is_parameter = (identifier) => identifier === "input";

const callbacks = {
  __type_mismatch__:  (path, node1, node2, type1, type2) => `Type mismatch at ${path} between ${type1} and ${type2}`,
  // Program //
  _program: (path, node1, node2, preludes1, block1, preludes2, block2) => check(
    path + ".program-header-length",
    preludes1.length,
    preludes2.length,
    null,
    () => combine(
      path,
      [
        combine(
          path,
          ArrayLite.map(
            preludes1,
            (_, index) => Tree._allign(
              path + ".program-header-" + index,
              preludes1[index],
              preludes2[index],
              callbacks))),
        Tree._allign(
          path + ".program-body",
          block1,
          block2,
          callbacks)])),
  // Prelude //
  _import: (path, node1, node2, specifier_1, source1, specifier_2, source2) => check(
    path + ".import-specifier",
    specifier_1,
    specifier_2,
    null,
    () => check(
      path + "import-source",
      source1,
      source2,
      null,
      EMPTY)),
  _export: (path, node1, node2, specifier1, specifier2) => check(
    path + ".export-specifier",
    specifier1,
    specifier2,
    null,
    EMPTY),
  _aggregate: (path, node1, node2, nullabe_specifier_11, source1, nullabe_specifier_12, nullabe_specifier_21, source2, nullabe_specifier_22) => check(
    path + ".aggregate-import-specifier",
    nullabe_specifier_11,
    nullabe_specifier_21,
    null,
    () => check(
      path + ".aggregate-import-source",
      source1,
      source2,
      null,
      () => check(
        path + ".aggregate-export-specifier",
        nullabe_specifier_12,
        nullabe_specifier_22,
        null,
        EMPTY))),
  // Block //
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
            (_, index) => Tree._allign(
              path + ".block-body-" + index,
              statements1[index],
              statements2[index],
              callbacks)))))),
  // Statement //
  Lift: (path, statement1, statement2, expression1, expression2) => Tree._allign(
    path + ".lift-expression",
    expression1,
    expression2,
    callbacks),
  Return: (path, statement1, statement2, expression1, expression2) => Tree._allign(
    path + ".return-argument",
    expression1,
    expression2,
    callbacks),
  Break: (path, statement1, statement2, label1, label2) => check(path + ".break-label", label1, label2, null, EMPTY),
  Continue: (path, statement1, statement2, label1, label2) => check(path + ".continue-label", label1, label2, null, EMPTY),
  Debugger: (path, statement1, statement2) => ({__proto__:null}),
  Lone: (path, statement1, statement2, labels1, block1, labels2, block2) => check_all(
    path + ".lone-labels",
    labels1,
    labels2,
    null,
    () => Tree._allign(
      path + ".lone-body",
      block1,
      block2,
      callbacks)),
  If: (path, statement1, statement2, labels1, expression1, block11, block12, labels2, expression2, block21, block22) => check_all(
    path + ".if-labels",
    labels1,
    labels2,
    null,
    () => combine(
      path,
      [
        Tree._allign(
          path + ".if-test",
          expression1,
          expression2,
          callbacks),
        Tree._allign(
          path + ".if-consequent",
          block11,
          block21,
          callbacks),
        Tree._allign(
          path + ".if-alternate",
          block12,
          block22,
          callbacks)])),
  While: (path, statement1, statement2, labels1, expression1, block1, labels2, expression2, block2) => check_all(
    path + ".if-labels",
    labels1,
    labels2,
    null,
    () => combine(
      path,
      [
        Tree._allign(
          path + ".while-test",
          expression1,
          expression2,
          callbacks),
        Tree._allign(
          path + ".while-body",
          block1,
          block2,
          callbacks)])),
  Try: (path, statement1, statement2, labels1, block11, block12, block13, labels2, block21, block22, block23) => check_all(
    path + ".if-labels",
    labels1,
    labels2,
    null,
    () => combine(
      path,
      [
        Tree._allign(
          path + ".try-body",
          block11,
          block21,
          callbacks),
        Tree._allign(
          path + ".try-catch",
          block12,
          block22,
          callbacks),
        Tree._allign(
          path + ".try-finally",
          block13,
          block23,
          callbacks)])),
  // Expression //
  primitive: (path, expression1, expression2, primitive1, primitive2) => check(
    path + ".primitive-body",
    primitive1,
    primitive2,
    null,
    EMPTY),
  intrinsic: (path, expression1, expression2, intrinsic1, intrinsic2) => check(
    path + ".intrinsic-body",
    intrinsic1,
    intrinsic2,
    null,
    EMPTY),
  arrow: (path, expression1, expression2, block1, block2) => Tree._allign(
    path + ".arrow-body",
    block1,
    block2,
    callbacks),
  function: (path, expression1, expression2, block1, block2) => Tree._allign(
    path + ".function-body",
    block1,
    block2,
    callbacks),
  method: (path, expression1, expression2, block1, block2) => Tree._allign(
    path + ".method-body",
    block1,
    block2,
    callbacks),
  constructor: (path, expression1, expression2, block1, block2) => Tree._allign(
    path + ".constructor-body",
    block1,
    block2,
    callbacks),
  read: (path, expression1, expression2, identifier1, identifier2) => (
    (
      is_parameter(identifier1) ||
      is_parameter(identifier2)) ?
    check(path + ".read-identifier", identifier1, identifier2, null, EMPTY) :
    {
      __proto__: null,
      [identifier1]: identifier2}),
  enclave_read: (path, expression1, expression2, enclave_read_identifier_1, enclave_read_identifier_2) => check(
    path + ".enclave-read-specifier",
    enclave_read_identifier_1,
    enclave_read_identifier_2,
    null,
    EMPTY),
  enclave_typeof: (path, expression1, expression2, enclave_read_identifier_1, enclave_read_identifier_2) => check(
    path + ".enclave-typeof-specifier",
    enclave_read_identifier_1,
    enclave_read_identifier_2,
    null,
    EMPTY),
  export: (path, node1, node2, specifier1, expression1, specifier2, expression2) => check(
    path + ".export-specifier",
    specifier1,
    specifier2,
    null,
    () => Tree._allign(
      path + ".export-right",
      expression1,
      expression2,
      callbacks)),
  enclave_write: (path, node1, node2, strict1, enclave_write_identifier_1, expression1, strict2, enclave_write_identifier_2, expression2, _callback) => check(
    path + ".enclave-write-strict",
    strict1,
    strict2,
    null,
    () => check(
      path + ".enclave-write-identifier",
      enclave_write_identifier_1,
      enclave_write_identifier_2,
      null,
      () => Tree._allign(
        path + ".enclave-write-right",
        expression1,
        expression2,
        callbacks))),
  write: (path, expression1, expression2, identifier1, expression11, identifier2, expression21, _callback) => (
    (
      is_parameter(identifier1) ||
      is_parameter(identifier2)) ?
    check(
      path + ".write-identifier",
      identifier1,
      identifier2,
      null,
      () => Tree._allign(
        path + ".write-right",
        expression11,
        expression21,
        callbacks)) :
    combine(
      path,
      [
        {
          __proto__: null,
          [identifier1]: identifier2},
        Tree._allign(
          path + ".write-right",
          expression11,
          expression21,
          callbacks)])),
  sequence: (path, expression1, expression2, expression11, expression12, expression21, expression22) => combine(
    path,
    [
      Tree._allign(
        path + ".sequence-first",
        expression11,
        expression21,
        callbacks),
      Tree._allign(
        path + ".sequence-second",
        expression12,
        expression22,
        callbacks)]),
  conditional: (path, expression1, expression2, expression11, expression12, expression13, expression21, expression22, expression23) => combine(
    path,
    [
      Tree._allign(
        path + ".conditional-test",
        expression11,
        expression21,
        callbacks),
      Tree._allign(
        path + ".conditional-consequent",
        expression12,
        expression22,
        callbacks),
      Tree._allign(
        path + ".conditional-alternative",
        expression13,
        expression23,
        callbacks)]),
  throw: (path, expression1, expression2, expression11, expression21) => Tree._allign(
    path + ".throw-argument",
    expression11,
    expression21,
    callbacks),
  eval: (path, expression1, expression2, expression11, expression21) => Tree._allign(
    path + ".eval-argument",
    expression11,
    expression21,
    callbacks),
  apply: (path, expression1, expression2, expression11, expression12, expressions1, expression21, expression22, expressions2) => check(
    path + ".apply-arguments-length",
    expressions1.length,
    expressions2.length,
    null,
    () => combine(
      path,
      ArrayLite.concat(
        [
          Tree._allign(
            path + ".apply-callee",
            expression11,
            expression21,
            callbacks),
          Tree._allign(
            path + ".apply-this",
            expression12,
            expression22,
            callbacks)],
        ArrayLite.map(
          expressions1,
          (_, index) => Tree._allign(
            path + ".apply-arguments-" + index,
            expressions1[index],
            expressions2[index],
            callbacks))))),
  construct: (path, expression1, expression2, expression11, expressions1, expression21, expressions2) => check(
    path + ".construct-arguments-length",
    expressions1.length,
    expressions2.length,
    null,
    () => combine(
      path,
      ArrayLite.concat(
        [
          Tree._allign(
            path + ".construct-callee",
            expression11,
            expression21,
            callbacks)],
        ArrayLite.map(
          expressions1,
          (_, index) => Tree._allign(
            path + ".construct-argument-" + index,
            expressions1[index],
            expressions2[index],
            callbacks))))),
  import: (path, expression1, expression2, specifier_1, source1, specifier_2, source2) => check(
    path + ".import-specifier",
    specifier_1,
    specifier_2,
    null,
    () => check(
      path + ".import-source",
      source1,
      source2,
      null,
      EMPTY)),
  require: (path, expression1, expression2, expression11, expression21) => Tree._allign(
    path + ".require-source",
    expression11,
    expression21,
    callbacks),
  unary: (path, expression1, expression2, operator1, expression11, operator2, expression21) => check(
    path + ".unary-operator",
    operator1,
    operator2,
    null,
    () => Tree._allign(
      path + ".unary-argument",
      expression11,
      expression21,
      callbacks)),
  binary: (path, expression1, expression2, operator1, expression11, expression12, operator2, expression21, expression22) => check(
    path + ".binary-operator",
    operator1,
    operator2,
    null,
    () => combine(
      path,
      [
        Tree._allign(
          path + ".binary-left",
          expression11,
          expression21,
          callbacks),
        Tree._allign(
          path + ".binary-right",
          expression12,
          expression22,
          callbacks)])),
  object: (path, expression1, expression2, expression11, properties1, expression21, properties2) => check(
    path + ".object-properties-length",
    properties1.length,
    properties2.length,
    null,
    () => combine(
      path,
      ArrayLite.concat(
        [
          Tree._allign(
            path + ".object-prototype",
            expression11,
            expression21,
            callbacks)],
        ArrayLite.map(
          properties1,
          (_, index) => combine(
            path,
            [
              Tree._allign(
                path + ".object-properties-" + index + "-key",
                properties1[index][0],
                properties2[index][0],
                callbacks),
              Tree._allign(
                path + ".object-properties-" + index + "-value",
                properties1[index][1],
                properties2[index][1],
                callbacks)])))))};
