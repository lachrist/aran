/* eslint-disable no-use-before-define */
import {zip, unzip, reduce, concat, map} from "array-lite";
import {generateThrowError} from "../../util.mjs";
import {allignNode, getNodeType} from "../ast/index.mjs";
import {
  makeEmptyResult,
  makeSingleLabelResult,
  makeSingleVariableResult,
  combineResult,
  bindResultVariable,
  bindResultLabel,
  makeStructuralMismatchResult,
  getResultErrorMessage,
} from "./result.mjs";

const {String} = globalThis;

const makeSinglePairVariableResult = (pair) =>
  makeSingleVariableResult(pair[0], pair[1]);

const visitPrimitive = (path, primitive1, primitive2) =>
  primitive1 === primitive2
    ? makeEmptyResult()
    : makeStructuralMismatchResult(path, primitive1, primitive2);

const default_callback = generateThrowError("could not visit node");
const generateVisitNode = (callbacks) => (path, node1, node2) => {
  const type1 = getNodeType(node1);
  const type2 = getNodeType(node2);
  if (type1 !== type2) {
    return makeStructuralMismatchResult(path, type1, type2);
  }
  const child_path = `${path}(${type1})`;
  return reduce(
    allignNode(child_path, node1, node2, callbacks, default_callback),
    (result1, result2) => combineResult(child_path, result1, result2),
    makeEmptyResult(),
  );
};

const visitProgram = generateVisitNode({
  __proto__: null,
  // Program //
  ScriptProgram: (path, _node1, _node2, statements1, statements2) => [
    visitAllStatement(`${path}.body`, statements1, statements2),
  ],
  ModuleProgram: (path, _node1, _node2, links1, block1, links2, block2) => [
    visitAllLink(`${path}.links`, links1, links2),
    visitBlock(`${path}.body`, block1, block2),
  ],
  EvalProgram: (
    path,
    _node1,
    _node2,
    enclaves1,
    variables1,
    block1,
    enclaves2,
    variables2,
    block2,
  ) => [
    visitAllPrimitive(`${path}.enclaves`, enclaves1, enclaves2),
    bindAllVariable(
      `${path}.variables`,
      variables1,
      variables2,
      visitBlock(`${path}.body`, block1, block2),
    ),
  ],
});

const visitLink = generateVisitNode({
  __proto__: null,
  ImportLink: (
    path,
    _node1,
    _node2,
    specifier1,
    source1,
    specifier2,
    source2,
  ) => [
    visitPrimitive(`${path}.specifier`, specifier1, specifier2),
    visitPrimitive(`${path}.source`, source1, source2),
  ],
  ExportLink: (path, _node1, _node2, specifier1, specifier2) => [
    visitPrimitive(`${path}.specifier`, specifier1, specifier2),
  ],
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
    visitPrimitive(`${path}.source`, source1, source2),
    visitPrimitive(`${path}.imported`, specifier11, specifier21),
    visitPrimitive(`${path}.imported`, specifier12, specifier22),
  ],
});

const visitBlock = generateVisitNode({
  __proto__: null,
  Block: (
    path,
    _node1,
    _node2,
    labels1,
    variables1,
    statements1,
    labels2,
    variables2,
    statements2,
  ) => [
    bindAllLabel(
      `${path}.labels`,
      labels1,
      labels2,
      bindAllVariable(
        `${path}.variables`,
        variables1,
        variables2,
        visitAllStatement(`${path}.body`, statements1, statements2),
      ),
    ),
  ],
});

const visitStatement = generateVisitNode({
  __proto__: null,
  EffectStatement: (path, _node1, _node2, effect1, effect2) => [
    visitEffect(`${path}.effect`, effect1, effect2),
  ],
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
    visitPrimitive(`${path}.kind`, kind1, kind2),
    visitPrimitive(`${path}.id`, identifier1, identifier2),
    visitExpression(`${path}.init`, expression1, expression2),
  ],
  ReturnStatement: (path, _node1, _node2, expression1, expression2) => [
    visitExpression(`${path}.argument`, expression1, expression2),
  ],
  BreakStatement: (_path, _node1, _node2, label1, label2) => [
    makeSingleLabelResult(label1, label2),
  ],
  DebuggerStatement: (_path, _node1, _node2) => [],
  BlockStatement: (path, _node1, _node2, block1, block2) => [
    visitBlock(`${path}.body`, block1, block2),
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
    visitExpression(`${path}.test`, expression1, expression2),
    visitBlock(`${path}.consequent`, block11, block21),
    visitBlock(`${path}.alternate`, block12, block22),
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
    visitExpression(`${path}.test`, expression1, expression2),
    visitBlock(`${path}.consequent`, block1, block2),
  ],
  TryStatement: (
    path,
    _node1,
    _node2,
    block11,
    block12,
    block13,
    block21,
    block22,
    block23,
  ) => [
    visitBlock(`${path}.body`, block11, block21),
    visitBlock(`${path}.handler`, block12, block22),
    visitBlock(`${path}.finalizer`, block13, block23),
  ],
});

const visitEffect = generateVisitNode({
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
    visitExpression(`${path}.right`, expression1, expression2),
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
    visitPrimitive(`${path}.left`, identifier1, identifier2),
    visitExpression(`${path}.right`, expression1, expression2),
  ],
  StaticExportEffect: (
    path,
    _node1,
    _node2,
    specifier1,
    expression1,
    specifier2,
    expression2,
  ) => [
    visitPrimitive(`${path}.specifier`, specifier1, specifier2),
    visitExpression(`${path}.right`, expression1, expression2),
  ],
  SetSuperEnclaveEffect: (
    path,
    _node1,
    _node2,
    expression11,
    expression12,
    expression21,
    expression22,
  ) => [
    visitExpression(`${path}.property`, expression11, expression21),
    visitExpression(`${path}.right`, expression12, expression22),
  ],
  SequenceEffect: (
    path,
    _node1,
    _node2,
    effect11,
    effect12,
    effect21,
    effect22,
  ) => [
    visitEffect(`${path}.first`, effect11, effect21),
    visitEffect(`${path}.second`, effect12, effect22),
  ],
  ConditionalEffect: (
    path,
    _node1,
    _node2,
    expression1,
    effect11,
    effect12,
    expression2,
    effect21,
    effect22,
  ) => [
    visitExpression(`${path}.test`, expression1, expression2),
    visitEffect(`${path}.first`, effect11, effect21),
    visitEffect(`${path}.second`, effect12, effect22),
  ],
  ExpressionEffect: (path, _node1, _node2, expression1, expression2) => [
    visitExpression(`${path}.expression`, expression1, expression2),
  ],
});

const visitExpression = generateVisitNode({
  __proto__: null,
  InputExpression: (_path, _node1, _node2) => [],
  PrimitiveExpression: (path, _node1, _node2, primitive1, primitive2) => [
    visitPrimitive(`${path}.value`, primitive1, primitive2),
  ],
  IntrinsicExpression: (path, _node1, _node2, intrinsic1, intrinsic2) => [
    visitPrimitive(`${path}.name`, intrinsic1, intrinsic2),
  ],
  ClosureExpression: (
    path,
    _node1,
    _node2,
    kind1,
    asynchronous1,
    generator1,
    block1,
    kind2,
    asynchronous2,
    generator2,
    block2,
  ) => [
    visitPrimitive(`${path}.kind`, kind1, kind2),
    visitPrimitive(`${path}.asynchronous`, asynchronous1, asynchronous2),
    visitPrimitive(`${path}.generator`, generator1, generator2),
    // We do not have to unbind labels because there
    // should be no unbound labels in closure' body.
    visitBlock(`${path}.body`, block1, block2),
  ],
  ReadExpression: (_path, _node1, _node2, identifier1, identifier2) => [
    makeSingleVariableResult(identifier1, identifier2),
  ],
  ReadEnclaveExpression: (path, _node1, _node2, variable1, variable2) => [
    visitPrimitive(`${path}.name`, variable1, variable2),
  ],
  TypeofEnclaveExpression: (path, _node1, _node2, variable1, variable2) => [
    visitPrimitive(`${path}.name`, variable1, variable2),
  ],
  CallSuperEnclaveExpression: (
    path,
    _node1,
    _node2,
    expression1,
    expression2,
  ) => [visitExpression(`${path}.argument`, expression1, expression2)],
  GetSuperEnclaveExpression: (
    path,
    _node1,
    _node2,
    expression1,
    expression2,
  ) => [visitExpression(`${path}.property`, expression1, expression2)],
  SequenceExpression: (
    path,
    _node1,
    _node2,
    effect1,
    expression1,
    effect2,
    expression2,
  ) => [
    visitEffect(`${path}.first`, effect1, effect2),
    visitExpression(`${path}.second`, expression1, expression2),
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
    visitExpression(`${path}.test`, expression11, expression21),
    visitExpression(`${path}.consequent`, expression12, expression22),
    visitExpression(`${path}.alternate`, expression13, expression23),
  ],
  ThrowExpression: (path, _node1, _node2, expression1, expression2) => [
    visitExpression(`${path}.argument`, expression1, expression2),
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
    visitPrimitive(`${path}.delegate`, delegate1, delegate2),
    visitExpression(`${path}.argument`, expression1, expression2),
  ],
  AwaitExpression: (path, _node1, _node2, expression1, expression2) => [
    visitExpression(`${path}.argument`, expression1, expression2),
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
  ) =>
    concat(
      [
        visitAllPrimitive(`${path}.enclaves`, enclaves1, enclaves2),
        visitPrimitive(
          `${path}.variables.length`,
          variables1.length,
          variables2.length,
        ),
      ],
      map(zip(variables1, variables2), makeSinglePairVariableResult),
      [visitExpression(`${path}.argument`, expression1, expression2)],
    ),
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
    visitExpression(`${path}.callee`, expression11, expression21),
    visitExpression(`${path}.this`, expression12, expression22),
    visitAllExpression(`${path}.arguments`, expressions1, expressions2),
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
    visitExpression(`${path}.callee`, expression1, expression2),
    visitAllExpression(`${path}.arguments`, expressions1, expressions2),
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
    visitPrimitive(`${path}.source`, source1, source2),
    visitPrimitive(`${path}.specifier`, specifier1, specifier2),
  ],
  DynamicImportExpression: (path, _node1, _node2, expression1, expression2) => [
    visitExpression(`${path}.source`, expression1, expression2),
  ],
  UnaryExpression: (
    path,
    _node1,
    _node2,
    operator1,
    expression1,
    operator2,
    expression2,
  ) => [
    visitPrimitive(`${path}.operator`, operator1, operator2),
    visitExpression(`${path}.argument`, expression1, expression2),
  ],
  BinaryExpression: (
    path,
    _node1,
    _node2,
    operator1,
    expression11,
    expression12,
    operator2,
    expression21,
    expression22,
  ) => [
    visitPrimitive(`${path}.operator`, operator1, operator2),
    visitExpression(`${path}.left`, expression11, expression21),
    visitExpression(`${path}.right`, expression12, expression22),
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
    const {0: keys1, 1: values1} = unzip(properties1);
    const {0: keys2, 1: values2} = unzip(properties2);
    return [
      visitExpression(`${path}.prototype`, expression1, expression2),
      visitAllExpression(`${path}.keys`, keys1, keys2),
      visitAllExpression(`${path}.values`, values1, values2),
    ];
  },
});

const generateCombineAll =
  (combine) => (path, array1, array2, initial_result) =>
    combineResult(
      path,
      visitPrimitive(`${path}.length`, array1.length, array2.length),
      reduce(
        zip(array1, array2),
        (result, pair, index) =>
          combine(`${path}[${String(index)}]`, pair[0], pair[1], result),
        initial_result,
      ),
    );
const bindAllLabel = generateCombineAll(bindResultLabel);
const bindAllVariable = generateCombineAll(bindResultVariable);

const generateVisitAll = (visit) => (path, array1, array2) =>
  combineResult(
    path,
    visitPrimitive(`${path}.length`, array1.length, array2.length),
    reduce(
      zip(array1, array2),
      (result, pair, index) =>
        combineResult(
          path,
          result,
          visit(`${path}[${String(index)}]`, pair[0], pair[1]),
        ),
      makeEmptyResult(),
    ),
  );
const visitAllPrimitive = generateVisitAll(visitPrimitive);
const visitAllExpression = generateVisitAll(visitExpression);
const visitAllStatement = generateVisitAll(visitStatement);
const visitAllLink = generateVisitAll(visitLink);

const generateAllign = (visit) => (node1, node2) =>
  getResultErrorMessage(visit("", node1, node2));

export const allignProgram = generateAllign(visitProgram);
export const allignStatement = generateAllign(visitStatement);
export const allignLink = generateAllign(visitLink);
export const allignBlock = generateAllign(visitBlock);
export const allignEffect = generateAllign(visitEffect);
export const allignExpression = generateAllign(visitExpression);
