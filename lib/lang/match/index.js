"use strict";

const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;
const global_Math_floor = global.Math.floor;
const global_Math_random = global.Math.random;
const global_Date_now = global.Date.now;
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
  `aran-match-${global_Date_now()}-${global_Math_floor(10e10 * global_Math_random())}`);

const unlink = (path) => {
  try {
    Fs.unlinkSync(path); }
  catch (error) {
    /* istanbul ignore next */
    global_Reflect_apply(global_console_error, global_console, [error]); } };

const diff = (code1, code2) => {
  require("colors");
  const colorize = (added, removed) => {
    if (added) {
      return "green"; }
    if (removed) {
      return "red"; }
    return "grey"; };
  const parts = require("diff").diffWords(code1, code2);
  parts.forEach((part) => {
    process.stderr.write(part.value[colorize(part.added, part.removed)]); });
  process.stderr.write("\n"); }

exports.match = (node1, node2, callback, test = false) => Result.checkout(
  allign("root", node1, node2),
  (success, result) => {
    if (success) {
      return callback(true, result); }
    let path1;
    let path2;
    try {
      path1 = get_tmp_path();
      path2 = get_tmp_path();
      Fs.writeFileSync(path1, Generate.generate(node1), "utf8");
      Fs.writeFileSync(path2, Generate.generate(node2), "utf8");
      diff(Generate.generate(node1), Generate.generate(node2));
      // `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`
      // `paste ${path1} ${path2} | expand -t ${global_Math_floor(process.stdout.columns / 2)}`
      // `diff --side-by-side --with=${process.stdout.columns} ${path1} ${path2}`
      return callback(
        false,
        (
          result +
          "\n" +
          ChildProcess.execSync(
            `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`,
            {
              __proto__: null,
              encoding: "utf8"}))); }
    finally {
      unlink(path1);
      unlink(path2); } });

const allign = (path, node1, node2) => Tree.allign(path, node1, node2, callbacks);

const allign_all = (path, nodes1, nodes2) => Result.check(
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
    (result1, result2) => Result.combine(path, result1, result2),
    Result.Empty()));

const callbacks = {
  __type_mismatch__:  (path, node1, node2, type1, type2) => Result.check(
    path + ".type",
    type1,
    type2),
  // Program //
  Program: (path, node1, node2, preludes1, block1, preludes2, block2) => Result.combine(
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
  ImportLink: (path, node1, node2, specifier_1, source1, specifier_2, source2) => Result.check(
    path + ".import-specifier",
    specifier_1,
    specifier_2,
    () => Result.check(
      path + ".import-source",
      source1,
      source2,
      Result.Empty)),
  ExportLink: (path, node1, node2, specifier1, specifier2) => Result.check(
    path + ".export-specifier",
    specifier1,
    specifier2,
    Result.Empty),
  AggregateLink: (path, node1, node2, nullabe_specifier_11, source1, nullabe_specifier_12, nullabe_specifier_21, source2, nullabe_specifier_22) => Result.check(
    path + ".aggregate-import-specifier",
    nullabe_specifier_11,
    nullabe_specifier_21,
    () => Result.check(
      path + ".aggregate-import-source",
      source1,
      source2,
      () => Result.check(
        path + ".aggregate-export-specifier",
        nullabe_specifier_12,
        nullabe_specifier_22,
        Result.Empty))),
  // LabelBlock //
  LabelBlock: (path, node1, node2, labels1, block1, labels2, block2) => Result.bindLabel(
    path + ".label-block-head",
    labels1,
    labels2,
    allign(
      path + ".label-block-body",
      block1,
      block2)),
  // Block //
  Block: (path, node1, node2, identifiers1, statements1, expression1, identifiers2, statements2, expression2) => Result.bindIdentifier(
    path + ".block-identifiers",
    identifiers1,
    identifiers2,
    Result.combine(
      path,
      allign_all(
        path + ".block-body",
        statements1,
        statements2),
      allign(
        path + ".block-completion",
        expression1,
        expression2))),
  // Statement //
  ExpressionStatement: (path, node1, node2, expression1, expression2) => allign(
    path + ".lift-expression",
    expression1,
    expression2),
  DeclareEnclaveStatement: (path, node1, node2, kind1, identifier1, expression1, kind2, identifier2, expression2) => Result.check(
    path + ".enclave-declare-kind",
    kind1,
    kind2,
    () => Result.check(
      path + ".enclave-declare-identifier",
      identifier1,
      identifier2,
      () => allign(
        path + ".enclave-declare-expression",
        expression1,
        expression2))),
  ReturnStatement: (path, node1, node2, expression1, expression2) => allign(
    path + ".return-argument",
    expression1,
    expression2),
  BreakStatement: (path, node1, node2, label1, label2) => Result.SingleLabel(
    path + ".label",
    label1,
    label2),
  DebuggerStatement: (path, node1, node2) => Result.Empty(),
  BlockStatement: (path, node1, node2, label_block_1, label_block_2) => allign(
    path + ".lone-body",
    label_block_1,
    label_block_2),
  IfStatement: (path, node1, node2, expression1, label_block_11, label_block_12, expression2, label_block_21, label_block_22) => Result.combine(
    path,
    allign(
      path + ".if-test",
      expression1,
      expression2),
    Result.combine(
      path,
      allign(
        path + ".if-consequent",
        label_block_11,
        label_block_21),
      allign(
        path + ".if-alternate",
        label_block_12,
        label_block_22))),
  WhileStatement: (path, node1, node2, expression1, label_block_1, expression2, label_block_2) => Result.combine(
    path,
    allign(
      path + ".while-test",
      expression1,
      expression2,
      callbacks),
    allign(
      path + ".while-body",
      label_block_1,
      label_block_2)),
  TryStatement: (path, node1, node2, label_block_11, label_block_12, label_block_13, label_block_21, label_block_22, label_block_23) => Result.combine(
    path,
    allign(
      path + ".try-body",
      label_block_11,
      label_block_21),
    Result.combine(
      path,
      allign(
        path + ".try-catch",
        label_block_12,
        label_block_22),
      allign(
        path + ".try-finally",
        label_block_13,
        label_block_23))),
  // Expression //
  PrimitiveExpression: (path, node1, node2, primitive1, primitive2) => Result.check(
    path + ".primitive-body",
    primitive1,
    primitive2,
    Result.Empty),
  IntrinsicExpression: (path, node1, node2, intrinsic1, intrinsic2) => Result.check(
    path + ".intrinsic-body",
    intrinsic1,
    intrinsic2,
    Result.Empty),
  ClosureExpression: (path, node1, node2, sort1, asynchronous1, generator1, block1, sort2, asynchronous2, generator2, block2) => Result.check(
    path + ".closure-sort",
    sort1,
    sort2,
    () => Result.check(
      path + ".closure-asynchronous",
      asynchronous1,
      asynchronous2,
      () => Result.check(
        path + ".closure-generator",
        generator1,
        generator2,
        () => allign(
          path + ".closure-body",
          block1,
          block2)))),
  ReadExpression: (path, node1, node2, identifier1, identifier2) => Result.SingleIdentifier(
    path + ".read-identifier",
    identifier1,
    identifier2),
  WriteExpression: (path, node1, node2, identifier1, expression1, identifier2, expression2, _callback) => Result.combine(
    path,
    Result.SingleIdentifier(
      path +  + ".write-left",
      identifier1,
      identifier2),
    allign(
      path + ".write-right",
      expression1,
      expression2)),
  ExportExpression: (path, node1, node2, specifier1, expression1, specifier2, expression2) => Result.check(
    path + ".export-specifier",
    specifier1,
    specifier2,
    () => allign(
      path + ".export-right",
      expression1,
      expression2)),
  ReadEnclaveExpression: (path, node1, node2, enclave_read_identifier_1, enclave_read_identifier_2) => Result.check(
    path + ".enclave-read-specifier",
    enclave_read_identifier_1,
    enclave_read_identifier_2,
    Result.Empty),
  TypeofEnclaveExpression: (path, node1, node2, enclave_read_identifier_1, enclave_read_identifier_2) => Result.check(
    path + ".enclave-typeof-specifier",
    enclave_read_identifier_1,
    enclave_read_identifier_2,
    Result.Empty),
  WriteEnclaveExpression: (path, node1, node2, strict1, enclave_write_identifier_1, expression1, strict2, enclave_write_identifier_2, expression2, _callback) => Result.check(
    path + ".enclave-write-strict",
    strict1,
    strict2,
    () => Result.check(
      path + ".enclave-write-identifier",
      enclave_write_identifier_1,
      enclave_write_identifier_2,
      () => allign(
        path + ".enclave-write-right",
        expression1,
        expression2))),
  SuperCallEnclaveExpression: (path, node1, node2, expression1, expression2) => allign(
    path + ".enclave-super-call-arguments",
    expression1,
    expression2),
  SuperMemberEnclaveExpression: (path, node1, node2, expression1, expression2) => allign(
    path + ".enclave-super-member-key",
    expression1,
    expression2),
  SequenceExpression: (path, node1, node2, expression11, expression12, expression21, expression22) => Result.combine(
    path,
    allign(
      path + ".sequence-first",
      expression11,
      expression21),
    allign(
      path + ".sequence-second",
      expression12,
      expression22)),
  ConditionalExpression: (path, node1, node2, expression11, expression12, expression13, expression21, expression22, expression23) => Result.combine(
    path,
    allign(
      path + ".conditional-test",
      expression11,
      expression21),
    Result.combine(
      path,
      allign(
        path + ".conditional-consequent",
        expression12,
        expression22),
      allign(
        path + ".conditional-alternative",
        expression13,
        expression23))),
  ThrowExpression: (path, node1, node2, expression1, expression2) => allign(
    path + ".throw-argument",
    expression1,
    expression2),
  YieldExpression: (path, node1, node2, delegate1, expression1, delegate2, expression2) => Result.check(
    path + ".yield-delegate",
    delegate1,
    delegate2,
    () => allign(
      path + ".yield-argument",
      expression1,
      expression2)),
  AwaitExpression: (path, node1, node2, expression1, expression2) => allign(
    path + ".await-argument",
    expression1,
    expression2),
  EvalExpression: (path, node1, node2, expression1, expression2) => allign(
    path + ".eval-argument",
    expression1,
    expression2),
  ApplyExpression: (path, node1, node2, expression11, expression12, expressions1, expression21, expression22, expressions2) => Result.combine(
    path,
    allign(
      path + ".apply-callee",
      expression11,
      expression21),
    Result.combine(
      path,
      allign(
        path + ".apply-this",
        expression12,
        expression22),
      allign_all(
        path + ".apply-arguments",
        expressions1,
        expressions2))),
  ConstructExpression: (path, node1, node2, expression1, expressions1, expression2, expressions2) => Result.combine(
    path,
    allign(
      path + ".construct-callee",
      expression1,
      expression2),
    allign_all(
      path + ".construct-arguments",
      expressions1,
      expressions2)),
  ImportExpression: (path, node1, node2, specifier1, source1, specifier2, source2) => Result.check(
    path + ".import-specifier",
    specifier1,
    specifier2,
    () => Result.check(
      path + ".import-source",
      source1,
      source2,
      Result.Empty)),
  RequireExpression: (path, node1, node2, expression1, expression2) => allign(
    path + ".require-source",
    expression1,
    expression2),
  UnaryExpression: (path, node1, node2, operator1, expression1, operator2, expression2) => Result.check(
    path + ".unary-operator",
    operator1,
    operator2,
    () => allign(
      path + ".unary-argument",
      expression1,
      expression2)),
  BinaryExpression: (path, node1, node2, operator1, expression11, expression12, operator2, expression21, expression22) => Result.check(
    path + ".binary-operator",
    operator1,
    operator2,
    () => Result.combine(
      path,
      allign(
        path + ".binary-left",
        expression11,
        expression21),
      allign(
        path + ".binary-right",
        expression12,
        expression22))),
  ObjectExpression: (path, node1, node2, expression1, properties1, expression2, properties2) => Result.combine(
    path,
    allign(
      path + ".object-prototype",
      expression1,
      expression2),
    Result.check(
      path + ".object-properties-length",
      properties1.length,
      properties2.length,
      () => ArrayLite.reduce(
        ArrayLite.map(
          properties1,
          (_, index) => Result.combine(
            path,
            allign(
              path + ".object-properties-" + index + "-key",
              properties1[index][0],
              properties2[index][0]),
            allign(
              path + ".object-properties-" + index + "-value",
              properties1[index][1],
              properties2[index][1]))),
        (result1, result2) => Result.combine(path, result1, result2),
        Result.Empty())))};
