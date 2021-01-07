"use strict";

const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;
const global_Math_floor = global.Math.floor;
const global_Math_random = global.Math.random;
const global_Date = global.Date;
const global_Reflect_apply = global.Reflect.apply;
const global_console_error = global.console.error;
const global_console = global.console;

const Fs = require("fs");
const Os = require("os");
const Path = require("path");
const ChildProcess = require("child_process");
const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Generate = require("../generate.js");
const Result = require("./result.js");

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

exports._match_test = (node1, node2, success, failure) => Result._checkout(
  allign("root", node1, node2),
  success,
  failure);

exports._match = (node1, node2, callback) => Result._checkout(
  allign("root", node1, node2),
  (mapping1, mapping2) => callback(true, null),
  (message) => {
    const path1 = get_tmp_path();
    const path2 = get_tmp_path();
    try {
      Fs.writeFileSync(path1, Generate._generate(node1), "utf8");
      Fs.writeFileSync(path2, Generate._generate(node2), "utf8");
      diff(Generate._generate(node1), Generate._generate(node2));
      // `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`
      // `paste ${path1} ${path2} | expand -t ${global_Math_floor(process.stdout.columns / 2)}`
      // `diff --side-by-side --with=${process.stdout.columns} ${path1} ${path2}`
      return callback(
        false,
        (
          message +
          "\n" +
          ChildProcess.execSync(
            `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`,
            {
              __proto__: null,
              encoding: "utf8"}))); }
    finally {
      unlink(path1);
      unlink(path2); } });

const allign = (path, node1, node2) => Tree._allign(path, node1, node2, callbacks);

const allign_all = (path, nodes1, nodes2) => Result._check(
  `${path}-length`,
  nodes1.length,
  nodes2.length,
  () => ArrayLite.reduce(
    ArrayLite.map(
      nodes1,
      (_, index) => allign(
        `${path}-${index}`,
        nodes1[index],
        nodes2[index])),
    (result1, result2) => Result._combine(path, result1, result2),
    Result._empty()));

const callbacks = {
  __type_mismatch__:  (path, node1, node2, type1, type2) => Result._check(
    path + ".type",
    type1,
    type2),
  // Program //
  _program: (path, node1, node2, preludes1, block1, preludes2, block2) => Result._combine(
    path,
    allign_all(
      path + ".program-header",
      preludes1,
      preludes2),
    allign(
      path + ".program-body",
      block1,
      block2)),
  // Prelude //
  _import: (path, node1, node2, specifier_1, source1, specifier_2, source2) => Result._check(
    path + ".import-specifier",
    specifier_1,
    specifier_2,
    () => Result._check(
      path + ".import-source",
      source1,
      source2,
      Result._empty)),
  _export: (path, node1, node2, specifier1, specifier2) => Result._check(
    path + ".export-specifier",
    specifier1,
    specifier2,
    Result._empty),
  _aggregate: (path, node1, node2, nullabe_specifier_11, source1, nullabe_specifier_12, nullabe_specifier_21, source2, nullabe_specifier_22) => Result._check(
    path + ".aggregate-import-specifier",
    nullabe_specifier_11,
    nullabe_specifier_21,
    () => Result._check(
      path + ".aggregate-import-source",
      source1,
      source2,
      () => Result._check(
        path + ".aggregate-export-specifier",
        nullabe_specifier_12,
        nullabe_specifier_22,
        Result._empty))),
  // Block //
  BLOCK: (path, block1, block2, labels1, identifiers1, statements1, labels2, identifiers2, statements2) => Result._bind_label(
    path + ".block-labels",
    labels1,
    labels2,
    Result._bind_identifier(
      path + ".block-identifiers",
      identifiers1,
      identifiers2,
      allign_all(
        path + ".block-body",
        statements1,
        statements2))),
  // Statement //
  Lift: (path, node1, node2, expression1, expression2) => allign(
    path + ".lift-expression",
    expression1,
    expression2),
  Return: (path, node1, node2, expression1, expression2) => allign(
    path + ".return-argument",
    expression1,
    expression2),
  Break: (path, node1, node2, label1, label2) => Result._single_label(
    path + ".label",
    label1,
    label2),
  Debugger: (path, node1, node2) => Result._empty(),
  Lone: (path, node1, node2, block1, block2) => allign(
    path + ".lone-body",
    block1,
    block2),
  If: (path, node1, node2, expression1, block11, block12, expression2, block21, block22) => Result._combine(
    path,
    allign(
      path + ".if-test",
      expression1,
      expression2),
    Result._combine(
      path,
      allign(
        path + ".if-consequent",
        block11,
        block21),
      allign(
        path + ".if-alternate",
        block12,
        block22))),
  While: (path, node1, node2, expression1, block1, expression2, block2) => Result._combine(
    path,
    allign(
      path + ".while-test",
      expression1,
      expression2,
      callbacks),
    allign(
      path + ".while-body",
      block1,
      block2)),
  Try: (path, node1, node2, block11, block12, block13, block21, block22, block23) => Result._combine(
    path,
    allign(
      path + ".try-body",
      block11,
      block21),
    Result._combine(
      path,
      allign(
        path + ".try-catch",
        block12,
        block22),
      allign(
        path + ".try-finally",
        block13,
        block23))),
  // Expression //
  primitive: (path, node1, node2, primitive1, primitive2) => Result._check(
    path + ".primitive-body",
    primitive1,
    primitive2,
    Result._empty),
  intrinsic: (path, node1, node2, intrinsic1, intrinsic2) => Result._check(
    path + ".intrinsic-body",
    intrinsic1,
    intrinsic2,
    Result._empty),
  closure: (path, node1, node2, sort1, asynchronous1, generator1, block1, sort2, asynchronous2, generator2, block2) => Result._check(
    path + ".closure-sort",
    sort1,
    sort2,
    () => Result._check(
      path + ".closure-asynchronous",
      asynchronous1,
      asynchronous2,
      () => Result._check(
        path + ".closure-generator",
        generator1,
        generator2,
        () => allign(
          path + ".closure-body",
          block1,
          block2)))),
  read: (path, node1, node2, identifier1, identifier2) => Result._single_identifier(
    path + ".read-identifier",
    identifier1,
    identifier2),
  write: (path, node1, node2, identifier1, expression1, identifier2, expression2, _callback) => Result._combine(
    path,
    Result._single_identifier(
      path +  + ".write-left",
      identifier1,
      identifier2),
    allign(
      path + ".write-right",
      expression1,
      expression2)),
  export: (path, node1, node2, specifier1, expression1, specifier2, expression2) => Result._check(
    path + ".export-specifier",
    specifier1,
    specifier2,
    () => allign(
      path + ".export-right",
      expression1,
      expression2)),
  enclave_read: (path, node1, node2, enclave_read_identifier_1, enclave_read_identifier_2) => Result._check(
    path + ".enclave-read-specifier",
    enclave_read_identifier_1,
    enclave_read_identifier_2,
    Result._empty),
  enclave_typeof: (path, node1, node2, enclave_read_identifier_1, enclave_read_identifier_2) => Result._check(
    path + ".enclave-typeof-specifier",
    enclave_read_identifier_1,
    enclave_read_identifier_2,
    Result._empty),
  enclave_write: (path, node1, node2, strict1, enclave_write_identifier_1, expression1, strict2, enclave_write_identifier_2, expression2, _callback) => Result._check(
    path + ".enclave-write-strict",
    strict1,
    strict2,
    () => Result._check(
      path + ".enclave-write-identifier",
      enclave_write_identifier_1,
      enclave_write_identifier_2,
      () => allign(
        path + ".enclave-write-right",
        expression1,
        expression2))),
  enclave_super_call: (path, node1, node2, expression1, expression2) => allign(
    path + ".enclave-super-call-arguments",
    expression1,
    expression2),
  enclave_super_member: (path, node1, node2, expression1, expression2) => allign(
    path + ".enclave-super-member-key",
    expression1,
    expression2),
  sequence: (path, node1, node2, expression11, expression12, expression21, expression22) => Result._combine(
    path,
    allign(
      path + ".sequence-first",
      expression11,
      expression21),
    allign(
      path + ".sequence-second",
      expression12,
      expression22)),
  conditional: (path, node1, node2, expression11, expression12, expression13, expression21, expression22, expression23) => Result._combine(
    path,
    allign(
      path + ".conditional-test",
      expression11,
      expression21),
    Result._combine(
      path,
      allign(
        path + ".conditional-consequent",
        expression12,
        expression22),
      allign(
        path + ".conditional-alternative",
        expression13,
        expression23))),
  throw: (path, node1, node2, expression1, expression2) => allign(
    path + ".throw-argument",
    expression1,
    expression2),
  yield: (path, node1, node2, delegate1, expression1, delegate2, expression2) => Result._check(
    path + ".yield-delegate",
    delegate1,
    delegate2,
    () => allign(
      path + ".yield-argument",
      expression1,
      expression2)),
  await: (path, node1, node2, expression1, expression2) => allign(
    path + ".await-argument",
    expression1,
    expression2),
  eval: (path, node1, node2, expression1, expression2) => allign(
    path + ".eval-argument",
    expression1,
    expression2),
  apply: (path, node1, node2, expression11, expression12, expressions1, expression21, expression22, expressions2) => Result._combine(
    path,
    allign(
      path + ".apply-callee",
      expression11,
      expression21),
    Result._combine(
      path,
      allign(
        path + ".apply-this",
        expression12,
        expression22),
      allign_all(
        path + ".apply-arguments",
        expressions1,
        expressions2))),
  construct: (path, node1, node2, expression1, expressions1, expression2, expressions2) => Result._combine(
    path,
    allign(
      path + ".construct-callee",
      expression1,
      expression2),
    allign_all(
      path + ".construct-arguments",
      expressions1,
      expressions2)),
  import: (path, node1, node2, specifier1, source1, specifier2, source2) => Result._check(
    path + ".import-specifier",
    specifier1,
    specifier2,
    () => Result._check(
      path + ".import-source",
      source1,
      source2,
      Result._empty)),
  require: (path, node1, node2, expression1, expression2) => allign(
    path + ".require-source",
    expression1,
    expression2),
  unary: (path, node1, node2, operator1, expression1, operator2, expression2) => Result._check(
    path + ".unary-operator",
    operator1,
    operator2,
    () => allign(
      path + ".unary-argument",
      expression1,
      expression2)),
  binary: (path, node1, node2, operator1, expression11, expression12, operator2, expression21, expression22) => Result._check(
    path + ".binary-operator",
    operator1,
    operator2,
    () => Result._combine(
      path,
      allign(
        path + ".binary-left",
        expression11,
        expression21),
      allign(
        path + ".binary-right",
        expression12,
        expression22))),
  object: (path, node1, node2, expression1, properties1, expression2, properties2) => Result._combine(
    path,
    allign(
      path + ".object-prototype",
      expression1,
      expression2),
    Result._check(
      path + ".object-properties-length",
      properties1.length,
      properties2.length,
      () => ArrayLite.reduce(
        ArrayLite.map(
          properties1,
          (_, index) => Result._combine(
            path,
            allign(
              path + ".object-properties-" + index + "-key",
              properties1[index][0],
              properties2[index][0]),
            allign(
              path + ".object-properties-" + index + "-value",
              properties1[index][1],
              properties2[index][1]))),
        (result1, result2) => Result._combine(path, result1, result2),
        Result._empty())))};
