/* eslint-disable no-use-before-define */
import {zip, unzip, reduce, concat, map} from "array-lite";
import {generateThrowError} from "../util.mjs";
import {allignNode, getNodeType, getNodeAnnotation} from "../ast/index.mjs";
import {
  appendErrorSegment,
  appendErrorPrecision,
  setErrorMessage,
  setErrorAnnotationPair,
  setErrorValuePair,
} from "./error.mjs";
import {
  makeEmptyResult,
  makeSingleLabelResult,
  makeSingleVariableResult,
  combineResult,
  bindResultVariable,
  bindResultLabel,
} from "./result.mjs";

const {String} = globalThis;

const makeSinglePairVariableResult = (pair) =>
  makeSingleVariableResult(pair[0], pair[1]);

const visitPrimitive = (error, primitive1, primitive2) =>
  makeEmptyResult(
    primitive1 === primitive2
      ? null
      : setErrorValuePair(
          setErrorMessage(error, "Primitive mismatch"),
          primitive1,
          primitive2,
        ),
  );

const default_callback = generateThrowError("could not visit node");
const generateVisitNode = (callbacks) => (error, node1, node2) => {
  const type1 = getNodeType(node1);
  const type2 = getNodeType(node2);
  if (type1 !== type2) {
    return makeEmptyResult(
      setErrorValuePair(
        setErrorMessage(error, "Structural mismatch"),
        type1,
        type2,
      ),
    );
  }
  const child_error = setErrorAnnotationPair(
    appendErrorPrecision(error, type1),
    getNodeAnnotation(node1),
    getNodeAnnotation(node2),
  );
  return reduce(
    allignNode(child_error, node1, node2, callbacks, default_callback),
    (result1, result2) => combineResult(child_error, result1, result2),
    makeEmptyResult(null),
  );
};

export const visitProgram = generateVisitNode({
  __proto__: null,
  // Program //
  ScriptProgram: (
    error,
    _annotation1,
    statements1,
    _annotation2,
    statements2,
  ) => [
    visitAllStatement(
      appendErrorSegment(error, "body"),
      statements1,
      statements2,
    ),
  ],
  ModuleProgram: (
    error,
    _annotation1,
    links1,
    block1,
    _annotation2,
    links2,
    block2,
  ) => [
    visitAllLink(appendErrorSegment(error, "links"), links1, links2),
    visitBlock(appendErrorSegment(error, "body"), block1, block2),
  ],
  EvalProgram: (
    error,
    _annotation1,
    enclaves1,
    variables1,
    block1,
    _annotation2,
    enclaves2,
    variables2,
    block2,
  ) => [
    visitAllPrimitive(
      appendErrorSegment(error, "enclaves"),
      enclaves1,
      enclaves2,
    ),
    bindAllVariable(
      appendErrorSegment(error, "variables"),
      variables1,
      variables2,
      visitBlock(appendErrorSegment(error, "body"), block1, block2),
    ),
  ],
});

export const visitLink = generateVisitNode({
  __proto__: null,
  ImportLink: (
    error,
    _annotation1,
    specifier1,
    source1,
    _annotation2,
    specifier2,
    source2,
  ) => [
    visitPrimitive(
      appendErrorSegment(error, "specifier"),
      specifier1,
      specifier2,
    ),
    visitPrimitive(appendErrorSegment(error, "source"), source1, source2),
  ],
  ExportLink: (error, _annotation1, specifier1, _annotation2, specifier2) => [
    visitPrimitive(
      appendErrorSegment(error, "specifier"),
      specifier1,
      specifier2,
    ),
  ],
  AggregateLink: (
    error,
    _annotation1,
    source1,
    specifier11,
    specifier12,
    _annotation2,
    source2,
    specifier21,
    specifier22,
  ) => [
    visitPrimitive(appendErrorSegment(error, "source"), source1, source2),
    visitPrimitive(
      appendErrorSegment(error, "imported"),
      specifier11,
      specifier21,
    ),
    visitPrimitive(
      appendErrorSegment(error, "exported"),
      specifier12,
      specifier22,
    ),
  ],
});

export const visitBlock = generateVisitNode({
  __proto__: null,
  Block: (
    error,
    _annotation1,
    labels1,
    variables1,
    statements1,
    _annotation2,
    labels2,
    variables2,
    statements2,
  ) => [
    bindAllLabel(
      appendErrorSegment(error, "labels"),
      labels1,
      labels2,
      bindAllVariable(
        appendErrorSegment(error, "variables"),
        variables1,
        variables2,
        visitAllStatement(
          appendErrorSegment(error, "body"),
          statements1,
          statements2,
        ),
      ),
    ),
  ],
});

export const visitStatement = generateVisitNode({
  __proto__: null,
  EffectStatement: (error, _annotation1, effect1, _annotation2, effect2) => [
    visitEffect(appendErrorSegment(error, "body"), effect1, effect2),
  ],
  DeclareEnclaveStatement: (
    error,
    _annotation1,
    kind1,
    identifier1,
    expression1,
    _annotation2,
    kind2,
    identifier2,
    expression2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "kind"), kind1, kind2),
    visitPrimitive(appendErrorSegment(error, "id"), identifier1, identifier2),
    visitExpression(
      appendErrorSegment(error, ".init"),
      expression1,
      expression2,
    ),
  ],
  ReturnStatement: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".argument"),
      expression1,
      expression2,
    ),
  ],
  BreakStatement: (_error, _annotation1, label1, _annotation2, label2) => [
    makeSingleLabelResult(label1, label2),
  ],
  DebuggerStatement: (_error, _annotation1, _annotation2) => [],
  BlockStatement: (error, _annotation1, block1, _annotation2, block2) => [
    visitBlock(appendErrorSegment(error, ".body"), block1, block2),
  ],
  IfStatement: (
    error,
    _annotation1,
    expression1,
    block11,
    block12,
    _annotation2,
    expression2,
    block21,
    block22,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".test"),
      expression1,
      expression2,
    ),
    visitBlock(appendErrorSegment(error, ".consequent"), block11, block21),
    visitBlock(appendErrorSegment(error, ".alternate"), block12, block22),
  ],
  WhileStatement: (
    error,
    _annotation1,
    expression1,
    block1,
    _annotation2,
    expression2,
    block2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".test"),
      expression1,
      expression2,
    ),
    visitBlock(appendErrorSegment(error, ".consequent"), block1, block2),
  ],
  TryStatement: (
    error,
    _annotation1,
    block11,
    block12,
    block13,
    _annotation2,
    block21,
    block22,
    block23,
  ) => [
    visitBlock(appendErrorSegment(error, ".body"), block11, block21),
    visitBlock(appendErrorSegment(error, ".handler"), block12, block22),
    visitBlock(appendErrorSegment(error, ".finalizer"), block13, block23),
  ],
});

export const visitEffect = generateVisitNode({
  __proto__: null,
  WriteEffect: (
    error,
    _annotation1,
    identifier1,
    expression1,
    _annotation2,
    identifier2,
    expression2,
  ) => [
    makeSingleVariableResult(identifier1, identifier2),
    visitExpression(
      appendErrorSegment(error, ".right"),
      expression1,
      expression2,
    ),
  ],
  WriteEnclaveEffect: (
    error,
    _annotation1,
    identifier1,
    expression1,
    _annotation2,
    identifier2,
    expression2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "left"), identifier1, identifier2),
    visitExpression(
      appendErrorSegment(error, ".right"),
      expression1,
      expression2,
    ),
  ],
  StaticExportEffect: (
    error,
    _annotation1,
    specifier1,
    expression1,
    _annotation2,
    specifier2,
    expression2,
  ) => [
    visitPrimitive(
      appendErrorSegment(error, "specifier"),
      specifier1,
      specifier2,
    ),
    visitExpression(
      appendErrorSegment(error, ".right"),
      expression1,
      expression2,
    ),
  ],
  SetSuperEnclaveEffect: (
    error,
    _annotation1,
    expression11,
    expression12,
    _annotation2,
    expression21,
    expression22,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".property"),
      expression11,
      expression21,
    ),
    visitExpression(
      appendErrorSegment(error, ".right"),
      expression12,
      expression22,
    ),
  ],
  SequenceEffect: (
    error,
    _annotation1,
    effect11,
    effect12,
    _annotation2,
    effect21,
    effect22,
  ) => [
    visitEffect(appendErrorSegment(error, ".first"), effect11, effect21),
    visitEffect(appendErrorSegment(error, ".second"), effect12, effect22),
  ],
  ConditionalEffect: (
    error,
    _annotation1,
    expression1,
    effect11,
    effect12,
    _annotation2,
    expression2,
    effect21,
    effect22,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".test"),
      expression1,
      expression2,
    ),
    visitEffect(appendErrorSegment(error, ".first"), effect11, effect21),
    visitEffect(appendErrorSegment(error, ".second"), effect12, effect22),
  ],
  ExpressionEffect: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".expression"),
      expression1,
      expression2,
    ),
  ],
});

export const visitExpression = generateVisitNode({
  __proto__: null,
  InputExpression: (_error, _annotation1, _annotation2) => [],
  PrimitiveExpression: (
    error,
    _annotation1,
    primitive1,
    _annotation2,
    primitive2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "value"), primitive1, primitive2),
  ],
  IntrinsicExpression: (
    error,
    _annotation1,
    intrinsic1,
    _annotation2,
    intrinsic2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "name"), intrinsic1, intrinsic2),
  ],
  ClosureExpression: (
    error,
    _annotation1,
    kind1,
    asynchronous1,
    generator1,
    block1,
    _annotation2,
    kind2,
    asynchronous2,
    generator2,
    block2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "kind"), kind1, kind2),
    visitPrimitive(
      appendErrorSegment(error, "asynchronous"),
      asynchronous1,
      asynchronous2,
    ),
    visitPrimitive(
      appendErrorSegment(error, "generator"),
      generator1,
      generator2,
    ),
    // We do not have to unbind labels because there
    // should be no unbound labels in closure' body.
    visitBlock(appendErrorSegment(error, ".body"), block1, block2),
  ],
  ReadExpression: (
    _error,
    _annotation1,
    identifier1,
    _annotation2,
    identifier2,
  ) => [makeSingleVariableResult(identifier1, identifier2)],
  ReadEnclaveExpression: (
    error,
    _annotation1,
    variable1,
    _annotation2,
    variable2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "name"), variable1, variable2),
  ],
  TypeofEnclaveExpression: (
    error,
    _annotation1,
    variable1,
    _annotation2,
    variable2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "name"), variable1, variable2),
  ],
  CallSuperEnclaveExpression: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".argument"),
      expression1,
      expression2,
    ),
  ],
  GetSuperEnclaveExpression: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".property"),
      expression1,
      expression2,
    ),
  ],
  SequenceExpression: (
    error,
    _annotation1,
    effect1,
    expression1,
    _annotation2,
    effect2,
    expression2,
  ) => [
    visitEffect(appendErrorSegment(error, ".first"), effect1, effect2),
    visitExpression(
      appendErrorSegment(error, ".second"),
      expression1,
      expression2,
    ),
  ],
  ConditionalExpression: (
    error,
    _annotation1,
    expression11,
    expression12,
    expression13,
    _annotation2,
    expression21,
    expression22,
    expression23,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".test"),
      expression11,
      expression21,
    ),
    visitExpression(
      appendErrorSegment(error, ".consequent"),
      expression12,
      expression22,
    ),
    visitExpression(
      appendErrorSegment(error, ".alternate"),
      expression13,
      expression23,
    ),
  ],
  ThrowExpression: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".argument"),
      expression1,
      expression2,
    ),
  ],
  YieldExpression: (
    error,
    _annotation1,
    delegate1,
    expression1,
    _annotation2,
    delegate2,
    expression2,
  ) => [
    visitPrimitive(
      appendErrorSegment(error, ".delegate"),
      delegate1,
      delegate2,
    ),
    visitExpression(
      appendErrorSegment(error, ".argument"),
      expression1,
      expression2,
    ),
  ],
  AwaitExpression: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".argument"),
      expression1,
      expression2,
    ),
  ],
  EvalExpression: (
    error,
    _annotation1,
    enclaves1,
    variables1,
    expression1,
    _annotation2,
    enclaves2,
    variables2,
    expression2,
  ) =>
    concat(
      [
        visitAllPrimitive(
          appendErrorSegment(error, "enclaves"),
          enclaves1,
          enclaves2,
        ),
        visitPrimitive(
          appendErrorSegment(error, "variables.length"),
          variables1.length,
          variables2.length,
        ),
      ],
      map(zip(variables1, variables2), makeSinglePairVariableResult),
      [
        visitExpression(
          appendErrorSegment(error, ".argument"),
          expression1,
          expression2,
        ),
      ],
    ),
  ApplyExpression: (
    error,
    _annotation1,
    expression11,
    expression12,
    expressions1,
    _annotation2,
    expression21,
    expression22,
    expressions2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".callee"),
      expression11,
      expression21,
    ),
    visitExpression(
      appendErrorSegment(error, ".this"),
      expression12,
      expression22,
    ),
    visitAllExpression(
      appendErrorSegment(error, "arguments"),
      expressions1,
      expressions2,
    ),
  ],
  ConstructExpression: (
    error,
    _annotation1,
    expression1,
    expressions1,
    _annotation2,
    expression2,
    expressions2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".callee"),
      expression1,
      expression2,
    ),
    visitAllExpression(
      appendErrorSegment(error, "arguments"),
      expressions1,
      expressions2,
    ),
  ],
  StaticImportExpression: (
    error,
    _annotation1,
    source1,
    specifier1,
    _annotation2,
    source2,
    specifier2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "source"), source1, source2),
    visitPrimitive(
      appendErrorSegment(error, "specifier"),
      specifier1,
      specifier2,
    ),
  ],
  DynamicImportExpression: (
    error,
    _annotation1,
    expression1,
    _annotation2,
    expression2,
  ) => [
    visitExpression(
      appendErrorSegment(error, ".source"),
      expression1,
      expression2,
    ),
  ],
  UnaryExpression: (
    error,
    _annotation1,
    operator1,
    expression1,
    _annotation2,
    operator2,
    expression2,
  ) => [
    visitPrimitive(appendErrorSegment(error, "operator"), operator1, operator2),
    visitExpression(
      appendErrorSegment(error, ".argument"),
      expression1,
      expression2,
    ),
  ],
  BinaryExpression: (
    error,
    _annotation1,
    operator1,
    expression11,
    expression12,
    _annotation2,
    operator2,
    expression21,
    expression22,
  ) => [
    visitPrimitive(appendErrorSegment(error, "operator"), operator1, operator2),
    visitExpression(
      appendErrorSegment(error, ".left"),
      expression11,
      expression21,
    ),
    visitExpression(
      appendErrorSegment(error, ".right"),
      expression12,
      expression22,
    ),
  ],
  ObjectExpression: (
    error,
    _annotation1,
    expression1,
    properties1,
    _annotation2,
    expression2,
    properties2,
  ) => {
    const {0: keys1, 1: values1} = unzip(properties1);
    const {0: keys2, 1: values2} = unzip(properties2);
    return [
      visitExpression(
        appendErrorSegment(error, ".prototype"),
        expression1,
        expression2,
      ),
      visitAllExpression(appendErrorSegment(error, "keys"), keys1, keys2),
      visitAllExpression(appendErrorSegment(error, "values"), values1, values2),
    ];
  },
});

const generateCombineAll =
  (combine) => (error, array1, array2, initial_result) =>
    combineResult(
      error,
      visitPrimitive(
        appendErrorSegment(error, "length"),
        array1.length,
        array2.length,
      ),
      reduce(
        zip(array1, array2),
        (result, pair, index) =>
          combine(
            appendErrorSegment(error, `[${String(index)}]`),
            pair[0],
            pair[1],
            result,
          ),
        initial_result,
      ),
    );
const bindAllLabel = generateCombineAll(bindResultLabel);
const bindAllVariable = generateCombineAll(bindResultVariable);

const generateVisitAll = (visit) => (error, array1, array2) =>
  combineResult(
    error,
    visitPrimitive(
      appendErrorSegment(error, "length"),
      array1.length,
      array2.length,
    ),
    reduce(
      zip(array1, array2),
      (result, pair, index) => {
        const child_error = appendErrorSegment(error, `[${String(index)}]`);
        return combineResult(
          child_error,
          result,
          visit(child_error, pair[0], pair[1]),
        );
      },
      makeEmptyResult(null),
    ),
  );
const visitAllPrimitive = generateVisitAll(visitPrimitive);
const visitAllExpression = generateVisitAll(visitExpression);
const visitAllStatement = generateVisitAll(visitStatement);
const visitAllLink = generateVisitAll(visitLink);