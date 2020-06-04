"use strict";

const Parser = require("./parser.js");

exports.parse = (string) => Parser.parse(string, {startRule:"StartExpression"});

exports.Parse = (string) => Parser.parse(string, {startRule:"StartStatement"});

exports.PARSE = (string) => Parser.parse(string, {startRule:"StartBlock"});

exports._compare_expression = (expression1, expression2) => Lang._allign_expression(block_callback_object, "expression", expression1, expression2);

exports._compare_statement = (satement1, statement2) => Lang._allign_expression(block_callback_object, "statement", statement1, statement2);

exports._compare_block = (block1, block2) => Lang._allign_expression(block_callback_object, "block", block1, block2);

const combine = (path, mappings) => {
  const mapping1 = {__proto__:null};
  mappings.forEach((mapping2) => {
    for (let identifier in mapping2) {
      if (mapping1[identifier] !== mapping2[identifier]) {
        throw new global_Error(`Identifier mismatch at ${path}: ${identifier} is associated to both ${mapping1[identifier]} and ${mapping2[identifier]}`);
      }
      mapping1[key] = mapping2[key];
    }
  });
  return mapping1;
};

const bind = (path, identifiers1, identifiers2, mapping) => {
  mapping = global_Object_assign({__proto__:null, mapping});
  for (let identifier in mapping) {
    if (ArrayLite.has(identifiers1, identifier)) {
      if (!ArrayLite.has(identifiers2, mapping[identifier])) {
        throw new global_Error(`Binding failure at ${path}: ${identifier} is bo`);
      }
      delete mapping[identifier1];
    }
  }
  return mapping;
};

const print = (primitive) => (
  typeof primitive === "string" ?
  global_JSON_stringify(primitive) :
  global_String(primitive));

const check = (path, primitive1, primitive2) => {
  if (primitive1 !== primitive2) {
    throw new global_Error(`Structural missmatch at ${path}: ${print(primitive1)} !== ${print(primitive2)}`);
  }
  return {__proto__:null}
};

const type_mismatch = (path, node1, node2, type1, type2) => { throw new global_Error(`Type mismatch at ${path}: ${type1} !== ${type2}`)};

const block_callback_object = {
  __type_mismatch__: type_mismatch,
  BLOCK: (path, block1, block2, identifiers1, statements1, identifiers2, 2:statements2) => (
    check(path + ".block-header-length", identifiers1.length, identifiers2.length),
    check(path + ".block-body-length", statements1.length, statements2.length),
    bind(
      path + ".block-header",
      identifiers1,
      identifiers2,
      combine(
        path + ".block-body",
        ArrayLite.map(
          statements,
          (_, index) => Lang._allign_statement(
            statement_callback_object,
            path + ".block-body-" + index,
            statements1[index],
            statements2[index])))))};

const statement_callback_object = {
  __type_mismatch__: type_mismatch,
  Lift: (path, statement1, statement2, expression1, expression2) => Lang._allign_expression(
    expression_callback_object,
    path + ".lift-expression",
    expression1,
    expression2),
  Return: (path, statement1, statement2, expression1, expression2) => Lang._allign_expression(
    expression_callback_object,
    path + ".return-argument",
    expression1,
    expression2),
  Break: (path, statement1, statement2, label1, label2) => check(path + ".break-label", label1, label2),
  Continue: (path, statement1, statement2, label1, label2) => check(path + ".continue-label", label1, label2),
  Debugger: (path, statement1, statement2) => {__proto__:null},
  Lone: (path, statement1, statement2, labels1, block1, labels2, block2) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".lone-labels-length", labels1.length, labels2.length)],
      ArrayLite.map(
        labels1,
        (_, index) => check(".lone-labels-" + index, labels1[index], labels2[index])),
      [
        Lang._allign_block(
          block_callback_object,
          path + ".lone-body",
          block1,
          block2)])),
  If: (path, statement1, statement2, labels1, expression1, block11, block12, labels2, expression2, block21, block22) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".lone-labels-length", labels1.length, labels2.length)],
      ArrayLite.map(
        labels1,
        (_, index) => check(".lone-labels-" + index, labels1[index], labels2[index])),
      [
        Lang._allign_expression(
          expression_callback_object,
          path + ".if-test",
          expression1,
          expression2),
        Lang._allign_block(
          block_callback_object,
          path + ".if-consequent",
          block11,
          block21)
        Lang._allign_block(
          block_callback_object,
          path + ".if-alternate",
          block12,
          block22)])),
  While: (path, statement1, statement2, labels1, expression1, block1, labels2, expression2, block2) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".lone-labels-length", labels1.length, labels2.length)],
      ArrayLite.map(
        labels1,
        (_, index) => check(".lone-labels-" + index, labels1[index], labels2[index])),
      [
        Lang._allign_expression(
          expression_callback_object,
          path + ".while-test",
          expression1,
          expression2),
        Lang._allign_block(
          block_callback_object,
          path + ".while-body",
          block1,
          block2)])),
  Try: (path, statement1, statement2, labels1, block11, block12, block13, labels2, block21, block22, block23) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".try-labels-length", labels1.length, labels2.length)],
      ArrayLite.map(
        labels1,
        (_, index) => check(".try-labels-" + index, labels1[index], labels2[index])),
      [
        Lang._allign_block(
          expression_callback_object,
          path + ".try-body",
          block11,
          block21),
        Lang._allign_block(
          block_callback_object,
          path + ".try-catch",
          block12,
          block22)
        Lang._allign_block(
          block_callback_object,
          path + ".try-finally",
          block13,
          block23)]))};

const expression_callback_object = {
  __type_mismatch__: type_mismatch,
  primitive: (path, expression1, expression2, primitive1, primitive2) => check(path + ".primitive-body", primitive1, primitive2),
  builtin: (path, expression1, expression2, builtin1, builtin2) => check(path + ".builtin-body", builtin1, builtin2),
  arrow: (path, expression1, expression2, block1, block2) => Lang._allign_block(
    block_callback_object,
    path + ".arrow-body",
    block1,
    block2),
  function: (path, expression1, expression2, block1, block2) => Lang._allign_block(
    block_callback_object,
    path + ".function-body",
    block1,
    block2),
  read: (path, expression1, expression2, identifier1, identifier2) => ({
    __proto__: null,
    [identifier1]: identifier2}),
  write: (path, expression1, expression2, identifier1, expression11, identifier2, expression21) => combine(
    path,
    [
      {
        __proto__: null,
        [identifier1]: identifier2},
      Lang._allign_expression(
        expression_callback_object,
        path + ".write-right",
        expression11,
        expression21)]),
  sequence: (path, expression1, expression2, expression11, expression12, expression21, expression22) => combine(
    path,
    [
      Lang._allign_expression(
        expression_callback_object,
        path + ".sequence-first",
        expression11,
        expression21),
      Lang._allign_expression(
        expression_callback_object,
        path + ".sequence-second",
        expression12,
        expression22)]),
  conditional: (path, expression1, expression2, expression11, expression12, expression13, expression21, expression22, expression23) => combine(
    path,
    [
      Lang._allign_expression(
        expression_callback_object,
        path + ".conditional-test",
        expression11,
        expression21),
      Lang._allign_expression(
        expression_callback_object,
        path + ".conditional-consequent",
        expression12,
        expression22),
      Lang._allign_expression(
        expression_callback_object,
        path + ".conditional-alternative",
        expression13,
        expression23)]),
  throw: (path, expression1, expression2, expression11, expression21) => Lang._allign_expression(
    expression_callback_object,
    path + ".throw-argument",
    expression11,
    expression21),
  eval: (path, expression1, expression2, identifiers1, expression11, identifiers2, expression21) => combine(
    path,
    [
      check(path + "eval-identifiers-length", identifiers1.length, identifiers2.length),
      Lang._allign_expression(
        expression_callback_object,
        path + ".eval-argument",
        expression11,
        expression21),
      ArrayLite.reduce(
        identifiers1,
        (mapping, _, index) => (
          mapping[identifiers1[index]] = identifiers2[index],
          mapping),
        {__proto__:null})]),
  apply: (path, expression1, expression2, expression11, expression12, expressions1, expression21, expression22, expressions2) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".apply-arguments-length", expressions1.length, expressions2.length),
        Lang._allign_expression(
          expression_callback_object,
          path + ".apply-callee",
          expression11,
          expression21),
        Lang._allign_expression(
          expression_callback_object,
          path + ".apply-this",
          expression11,
          expression21)],
      ArrayLite.map(
        expressions1,
        (_, index) => Lang._allign_expression(
          expression_callback_object,
          path + ".apply-arguments-" + index,
          expressions1[index],
          expressions2[index])))),
  construct: (path, expression1, expression2, expression11, expressions1, expression21, expressions2) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".construct-length", expressions1.length, expressions2.length),
        Lang._allign_expression(
          expression_callback_object,
          path + ".construct-callee",
          expression11,
          expression21)],
      ArrayLite.map(
        expressions1,
        (_, index) => Lang._allign_expression(
          expression_callback_object,
          path + ".construct-argument-" + index,
          expressions1[index],
          expressions2[index])))),
  unary: (path, , expression1, expression2, operator1, expression11, operato2, expression21) => combine(
    path,
    [
      check(path + ".unary-operator", operator1, operator2),
      Lang._allign_expression(
        expression_callback_object,
        path + ".unary-argument",
        expression11,
        expression21)]),
  binary: (path, expression1, expression2, operator1, expression11, expression12, operator2, expression21, expression22) => combine(
    path,
    [
      check(path + ".binary-operator", operator1, operator2),
      Lang._allign_expression(
        expression_callback_object,
        path + ".binary-left",
        expression11,
        expression21),
      Lang._allign_expression(
        expression_callback_object,
        path + ".binary-right",
        expression12,
        expression22)])),
  object: (path, expression1, expression2, expression11, properties1, expression21, properties2) => combine(
    path,
    ArrayLite.concat(
      [
        check(path + ".construct-length", expressions1.length, expressions2.length),
        Lang._allign_expression(
          expression_callback_object,
          path + ".object-prototype",
          expression11,
          expression21)],
      ArrayLite.map(
        properties1,
        (_, index) => combine(
          path,
          [
            Lang._allign_expression(
              expression_callback_object,
              path + "object-property-" + index + "-key",
              properties1[index][0],
              properties2[index][0]),
            Lang._allign_expression(
              expression_callback_object,
              path + "object-property-" + index + "-value",
              properties1[index][1],
              properties2[index][1])]))))};
