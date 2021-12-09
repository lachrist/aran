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

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../../tree.js");
const Generate = require("../generate.js");
const Result = require("./result.js");

export const matchPrimitive = (path, primitive1, primitive2) => (
  primitive1 === primitive2 ?
  makeStructuralMismatchResult(path, primitive1, primitive2) :
  makeEmptyResult(),
);

const default_callback = generateThrowError("could not match node");
const generateMatchNode = (callbacks) => (path, node1, node2) => {
  const type1 = getNodeType(node1);
  const type2 = getNodeType(node2);
  if (type1 !== type2) {
    return makeStructuralMismatchResult(path, type1, type2);
  }
  const child_path = `${path}(${type1})`
  return reduce(
    allignNode(child_path, node1, node2, callbacks, default_callback),
    (result1, result2) => combineResult(child_path, result1, result2),
    makeEmptyResult(),
  );
};

const matchProgram = generateMatchNode({
  __proto__: null,
  // Program //
  ScriptProgram: (
    path,
    _node1,
    _node2,
    statements1,
    statements2,
  ) => [matchAllStatement(`${path}.body`, statements, statements)],
  ModuleProgram: (
    path,
    _node1,
    _node2,
    links1,
    links2,
    block1,
    block2,
  ) => [
    matchAllLink(`${path}.links`, links1, links2),
    matchBlock(`${path}.body`, block, block),
  ],
  EvalProgram: (
    path,
    _node1,
    _node2,
    enclaves1,
    variables1,
    block1,
    enclaves2,
    variables1,
    block2,
  ) => [
    matchAllPrimitive(`${path}.enclaves`, enclaves1, enclaves2),
    bindAllVariable(
      `${path}.variables`,
      variables1,
      variables2,
      matchBlock(`${path}.body`, block1, block2),
    ),
  ]
});

const matchLink = generateMatchNode({
  __proto__: null,
  ImportLink: (path, _node1, _node2, specifier1, source1, specifier2, source2) => [
    matchPrimitive(`${path}.specifier`, specifier1, specifier2),
    matchPrimitive(`${path}.source`, source1, source2),
  ],
  ExportLink: (path, _node1, _node2, specifier1, specifier2) => [matchPrimitive(
    `${path}.specifier`,
    specifier1,
    specifier2,
  )],
  AggregateLink: (
    path,
    _node1,
    _node2,
    source1,
    specifier11,
    specifier12,
    source2,
    specifier21,
    specifier22,
  ) => [
    matchPrimitive(
      `${path}.source`,
      source1,
      source2,
    ),
    matchPrimitive(
      `${path}.imported`,
      specifier11,
      specifier21,
    ),
    matchPrimitive(
      `${path}.imported`,
      specifier21,
      specifier22,
    ),
  ],
});

const matchBlock = generateMatchNode({
  __proto__: null,
  Block: (path, _node1, _node2, labels1, variables1, statements1, labels2, variables2, statements2) => [
    bindAllLabel(
      `${path}.labels`,
      labels1,
      labels2,
      bindAllVariable(
        `${path}.variables`,
        variables1,
        variables2,
        matchAllStatement(`${path}.body`, statements1, statement2),
      ),
    ),
  ],
});

const matchStatement = generateMatchNode({
  __proto__: null,
  EffectStatement: (path, _node1, _node2, effect1, effect2) => [matchEffect(
    `${path}.effect`,
    effect1,
    effect2,
  )],
  DeclareEnclaveStatement: (
    path,
    _node1,
    _node2,
    kind1,
    identifier1,
    expression1,
    kind2,
    identifier2,
    expression2,
  ) => [
    matchPrimitive(`${path}.kind`, kind1, kind2),
    matchPrimitive(`${path}.id`, identifier1, identifier2),
    matchExpression(`${path}.init`, expression1, expression2),
  ],
  ReturnStatement: (path, _node1, _node2, expression1, expression2) => [
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  BreakStatement: (path, _node1, _node2, label1, label2) => [
    makeSingleLabelResult(label1, labels),
  ],
  DebuggerStatement: (path, _node1, _node2) => [],
  BlockStatement: (path, _node1, _node2, block1, block2) => [
    matchBlock(`${path}.body`, block1, block2),
  ],
  IfStatement: (
    path,
    _node1,
    _node2,
    expression1,
    block11,
    block12,
    expression2,
    block21,
    block22,
  ) => [
    matchExpression(`${path}.test`, expression1, expression2),
    matchBlock(`${path}.consequent`, block11, block21),
    matchBlock(`${path}.alternate`, block21, block22),
  ],
  WhileStatement: (
    path,
    _node1,
    _node2,
    expression1,
    block1,
    expression2,
    block2,
  ) => [
    matchExpression(`${path}.test`, expression1, expression2),
    matchBlock(`${path}.consequent`, block1, block2),
  ],
  TryStatement: (
    path,
    node1,
    node2,
    branch11,
    branch12,
    branch13,
    branch21,
    branch22,
    branch23,
  ) => [
    matchExpression(`${path}.body`, block11, block21),
    matchBlock(`${path}.handler`, block12, block22),
    matchBlock(`${path}.finalizer`, block13, block23),
  ],
});

const matchEffect = generateMatchNode({
  __proto__: null,
  WriteEffect: (
    path,
    _node1,
    _node2,
    identifier1,
    expression1,
    identifier2,
    expression2,
  ) => [
    makeSingleVariableResult(identifier1, identifier2),
    matchExpression(`${path}.right`, expression1, expression2),
  ],
  WriteEnclaveEffect: (
    path,
    _node1,
    _node2,
    identifier1,
    expression1,
    identifier2,
    expression2,
  ) => [
    matchPrimitive(`${path}.left`, identifier1, identifier2),
    matchExpression(`${path}.right`, expression1, expression2),
  ],
  ExportEffect: (
    path,
    _node1,
    _node2,
    specifier1,
    expression1,
    specifier2,
    expression2,
  ) => [
    matchPrimitive(`${path}.specifier`, specifier1, specifier2),
    matchExpression(`${path}.right`, expression1, expression2),
  ],
  SetSuperEnclaveExpression: (
    path,
    _node1,
    _node2,
    expression11,
    expression12,
    expression21,
    expression22,
  ) => [
    matchExpression(`${path}.property`, expression11, expression21),
    matchExpression(`${path}.right`, expression12, expression22),
  ],
  SequenceEffect: (path, _node1, _node2, effect11, effect12, effect21, effect22) => [
    matchEffect(`${path}.first`, effect11, effect21),
    matchffect(`${path}.second`, effect21, effect22),
  ],
  ConditionalEffect: (path, _node1, _node2, expression1, effct11, effect12, expression2, effect21, effect22) => [
    matchExpression(`${path}.test`, expression1, expression2),
    matchEffect(`${path}.first`, effect11, effect21),
    matchffect(`${path}.second`, effect21, effect22),
  ],
});

const matchExpression = generateMatchNode({
  __proto__: null,
  PrimitiveExpression: (path, _node1, _node2, primitive1, primitive2) => [
    matchPrimitive(`${path}.value`, primitive1, primitive2),
  ],
  IntrinsicExpression: (path, _node1, _node2, intrinsic1, intrinsic2) => [
    matchPrimitive(`${path}.name`, intrinsic1, intrinsic2),
  ],
  ClosureExpression: (
    path,
    _node1,
    _node2,
    sort1,
    asynchronous1,
    generator1,
    block1,
    sort2,
    asynchronous2,
    generator2,
    block2,
  ) => [
    matchPrimitive(`${path}.kind`, kind1, kind2),
    matchPrimitive(`${path}.asynchronous`, asynchronous1, asynchronous2),
    matchPrimitive(`${path}.generator`, generator1, generator2),
    matchBlock(`${path}.body`, block1, block2),
  ],
  ReadExpression: (path, _node1, _node2, identifier1, identifier2) => [
    makeSingleVariableResult(identifier1, identifier2),
  ],
  ReadEnclaveExpression: (
    path,
    _node1,
    _node2,
    variable1,
    variable2,
  ) => [matchPrimitive(`${path}.name`, variable1, variable2)],
  TypeofEnclaveExpression: (
    path,
    node1,
    node2,
    variable1,
    variable2,
  ) => [matchPrimitive(`${path}.name`, variable1, variable2)],
  CallSuperEnclaveExpression: (path, _node1, _node2, expression1, expression2) => [
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  GetSuperEnclaveExpression: (path, _node1, _node2, expression1, expression2) => [
    matchExpression(`${path}.property`, expression1, expression2),
  ],
  SequenceExpression: (
    path,
    _node1,
    _node2,
    effect1,
    expression1,
    effect2,
    expression2,
  ) => [
    matchEffect(`${path}.first`, effect1, effect2),
    matchExpression(`${path}.second`, expression1, expression2),
  ],
  ConditionalExpression: (
    path,
    _node1,
    _node2,
    expression11,
    expression12,
    expression13,
    expression21,
    expression22,
    expression23,
  ) => [
    matchExpression(`${path}.test`, expression11, expression21),
    matchExpression(`${path}.consequent`, expression12, expression22),
    matchExpression(`${path}.alternate`, expression13, expression23),
  ],
  ThrowExpression: (path, _node1, _node2, expression1, expression2) => [
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  YieldExpression: (
    path,
    _node1,
    _node2,
    delegate1,
    expression1,
    delegate2,
    expression2,
  ) => [
    matchPrimitive(`${path}.delegate`, delegate1, delegate2),
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  AwaitExpression: (path, _node1, _node2, expression1, expression2) => []
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  EvalExpression: (
    path,
    _node1,
    _node2,
    enclaves1,
    variables1,
    expression1,
    enclaves2,
    variables2,
    expression2,
  ) => [
    matchAllPrimitive(`${path}.enclaves`, enclaves1, enclaves2),
    matchAllVariable(`${path}.variables`, variables1, variables2),
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  ApplyExpression: (
    path,
    _node1,
    _node2,
    expression11,
    expression12,
    expressions1,
    expression21,
    expression22,
    expressions2,
  ) => [
    matchExpression(`${path}.callee`, expression11, expression21),
    matchExpression(`${path}.this`, expression12, expression22),
    matchAllExpression(`${path}.arguments`, expressions1, expression2),
  ],
  ConstructExpression: (
    path,
    _node1,
    _node2,
    expression1,
    expressions1,
    expression2,
    expressions2,
  ) => [
    matchExpression(`${path}.callee`, expression1, expression2),
    matchAllExpression(`${path}.arguments`, expressions1, expressions2),
  ],
  StaticImportExpression: (
    path,
    _node1,
    _node2,
    source1,
    specifier1,
    source2,
    specifier2,
  ) => [
    matchPrimitive(`${path}.source`, source1, source2),
    matchPrimitive(`${path}.specifier`, specifier1, specifier2),
  ],
  DynamicImportExpression: (path, _node1, _node2, expression1, expression2) =>
    [matchExpression(`${path}.source`, expression1, expression2)],
  UnaryExpression: (
    path,
    _node1,
    _node2,
    operator1,
    expression1,
    operator2,
    expression2,
  ) => [
    matchPrimitive(`${path}.operator`, operator1, operator2),
    matchExpression(`${path}.argument`, expression1, expression2),
  ],
  BinaryExpression: (
    path,
    node1,
    node2,
    operator1,
    expression11,
    expression12,
    operator2,
    expression21,
    expression22,
  ) => [
    matchPrimitive(`${path}.operator`, operator1, operator2),
    matchExpression(`${path}.left`, expression11, expression21),
    matchExpression(`${path}.right`, expression12, expression22),
  ],
  ObjectExpression: (
    path,
    _node1,
    _node2,
    expression1,
    properties1,
    expression2,
    properties2,
  ) => {
    const {0:keys1, 1:values1} = unzip(properties1);
    const {0:keys2, 1:values2} = unzip(properties2);
    return [
      matchExpression(`${path}.prototype`, expression1, expression2),
      matchAllExpression(`${path}.keys`, keys1, keys2),
      matchAllExpression(`${path}.values`, values1, values2),
    ],
  },
};

const generateCombineAll = (combine) => (path, array1, array2, result) => combineResult(
  path,
  matchPrimitive(`${path}.length`, array1.length, array2.length),
  reduce(
    zip(array1, array2),
    (result, pair, index) => combine(`${path}[String(index)]`, pair[0], pair[1], result),
    result,
  ),
);
const bindAllLabel = generateCombineAll(bindResultLabel);
const bindAllVariable = generateCombineAll(bindResultVariable);

const generateMatchAll = (match) => (path, array1, array2) => combineResult(
  path,
  matchPrimitive(`${path}.length`, array1.length, array2.length),
  reduce(
    zip(array1, array2),
    (result, pair, index) => combineResult(
      path,
      result,
      match(`${path}[String(index)]`, pair[0], pair[1]),
    ),
    makeEmptyResult(),
  ),
);
const matchAllPrimitive = generateMatchAll(matchPrimitive);
const matchAllExpression = generateMatchAll(matchExpression);
const matchAllStatement = generateMatchAll(matchStatement);
const matchAllLink = generateMatchAll(matchLink);
