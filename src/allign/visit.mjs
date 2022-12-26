/* eslint-disable no-use-before-define */
import { zip, reduce } from "array-lite";
import { partialx___, partialx____ } from "../util/index.mjs";
import { allignArrayNode1 } from "../node.mjs";
import { fromLiteral } from "../ast/index.mjs";
import {
  appendErrorSegment,
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

const { String } = globalThis;

const visitLiteral = (literal1, literal2, error) =>
  makeEmptyResult(
    fromLiteral(literal1) === fromLiteral(literal2)
      ? null
      : setErrorValuePair(
          setErrorMessage(error, "Literal mismatch"),
          literal1,
          literal2,
        ),
  );

const visitPrimitive = (primitive1, primitive2, error) =>
  makeEmptyResult(
    primitive1 === primitive2
      ? null
      : setErrorValuePair(
          setErrorMessage(error, "Primitive mismatch"),
          primitive1,
          primitive2,
        ),
  );

const visitNode = (clauses, node1, node2, error) => {
  const { 0: type1 } = node1;
  const { 0: type2 } = node2;
  if (type1 !== type2) {
    return makeEmptyResult(
      setErrorValuePair(
        setErrorMessage(error, "Structural mismatch"),
        type1,
        type2,
      ),
    );
  } else {
    const child_error = setErrorAnnotationPair(
      appendErrorSegment(error, `(${type1})`),
      node1[node1.length - 1],
      node2[node2.length - 1],
    );
    return reduce(
      allignArrayNode1(clauses, node1, node2, child_error),
      (result1, result2) => combineResult(result1, result2, child_error),
      makeEmptyResult(null),
    );
  }
};

export const visitProgram = partialx___(visitNode, {
  // Program //
  ScriptProgram: ({ 1: statements1 }, { 1: statements2 }, error) => [
    visitAllStatement(
      statements1,
      statements2,
      appendErrorSegment(error, ".body"),
    ),
  ],
  ModuleProgram: (
    { 1: links1, 2: block1 },
    { 1: links2, 2: block2 },
    error,
  ) => [
    visitAllLink(links1, links2, appendErrorSegment(error, ".links")),
    visitBlock(block1, block2, appendErrorSegment(error, ".body")),
  ],
  EvalProgram: ({ 1: block1 }, { 1: block2 }, error) => [
    visitBlock(block1, block2, appendErrorSegment(error, ".body")),
  ],
});

export const visitLink = partialx___(visitNode, {
  ImportLink: (
    { 1: specifier1, 2: source1 },
    { 1: specifier2, 2: source2 },
    error,
  ) => [
    visitPrimitive(
      specifier1,
      specifier2,
      appendErrorSegment(error, ".specifier"),
    ),
    visitPrimitive(source1, source2, appendErrorSegment(error, ".source")),
  ],
  ExportLink: ({ 1: specifier1 }, { 1: specifier2 }, error) => [
    visitPrimitive(
      specifier1,
      specifier2,
      appendErrorSegment(error, ".specifier"),
    ),
  ],
  AggregateLink: (
    { 1: source1, 2: specifier11, 3: specifier12 },
    { 1: source2, 2: specifier21, 3: specifier22 },
    error,
  ) => [
    visitPrimitive(source1, source2, appendErrorSegment(error, ".source")),
    visitPrimitive(
      specifier11,
      specifier21,
      appendErrorSegment(error, ".imported"),
    ),
    visitPrimitive(
      specifier12,
      specifier22,
      appendErrorSegment(error, ".exported"),
    ),
  ],
});

export const visitBlock = partialx___(visitNode, {
  Block: (
    { 1: labels1, 2: variables1, 3: statements1 },
    { 1: labels2, 2: variables2, 3: statements2 },
    error,
  ) => [
    bindAllLabel(
      bindAllVariable(
        visitAllStatement(
          statements1,
          statements2,
          appendErrorSegment(error, ".body"),
        ),
        variables1,
        variables2,
        appendErrorSegment(error, ".variables"),
      ),
      labels1,
      labels2,
      appendErrorSegment(error, ".labels"),
    ),
  ],
});

export const visitStatement = partialx___(visitNode, {
  EffectStatement: ({ 1: effect1 }, { 1: effect2 }, error) => [
    visitEffect(effect1, effect2, appendErrorSegment(error, ".body")),
  ],
  DeclareExternalStatement: (
    { 1: kind1, 2: variable1, 3: expression1 },
    { 1: kind2, 2: variable2, 3: expression2 },
    error,
  ) => [
    visitPrimitive(kind1, kind2, appendErrorSegment(error, ".kind")),
    visitPrimitive(variable1, variable2, appendErrorSegment(error, ".id")),
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".init"),
    ),
  ],
  ReturnStatement: ({ 1: expression1 }, { 1: expression2 }, error) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".argument"),
    ),
  ],
  BreakStatement: ({ 1: label1 }, { 1: label2 }, _error) => [
    makeSingleLabelResult(label1, label2),
  ],
  DebuggerStatement: ({}, {}, _error) => [],
  BlockStatement: ({ 1: block1 }, { 1: block2 }, error) => [
    visitBlock(block1, block2, appendErrorSegment(error, ".body")),
  ],
  IfStatement: (
    { 1: expression1, 2: block11, 3: block12 },
    { 1: expression2, 2: block21, 3: block22 },
    error,
  ) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".test"),
    ),
    visitBlock(block11, block21, appendErrorSegment(error, ".consequent")),
    visitBlock(block12, block22, appendErrorSegment(error, ".alternate")),
  ],
  WhileStatement: (
    { 1: expression1, 2: block1 },
    { 1: expression2, 2: block2 },
    error,
  ) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".test"),
    ),
    visitBlock(block1, block2, appendErrorSegment(error, ".consequent")),
  ],
  TryStatement: (
    { 1: block11, 2: block12, 3: block13 },
    { 1: block21, 2: block22, 3: block23 },
    error,
  ) => [
    visitBlock(block11, block21, appendErrorSegment(error, ".body")),
    visitBlock(block12, block22, appendErrorSegment(error, ".handler")),
    visitBlock(block13, block23, appendErrorSegment(error, ".finalizer")),
  ],
});

export const visitEffect = partialx___(visitNode, {
  WriteEffect: (
    { 1: variable1, 2: expression1 },
    { 1: variable2, 2: expression2 },
    error,
  ) => [
    makeSingleVariableResult(variable1, variable2),
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".right"),
    ),
  ],
  WriteExternalEffect: (
    { 1: variable1, 2: expression1 },
    { 1: variable2, 2: expression2 },
    error,
  ) => [
    visitPrimitive(variable1, variable2, appendErrorSegment(error, ".name")),
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".right"),
    ),
  ],
  ExportEffect: (
    { 1: specifier1, 2: expression1 },
    { 1: specifier2, 2: expression2 },
    error,
  ) => [
    visitPrimitive(
      specifier1,
      specifier2,
      appendErrorSegment(error, ".specifier"),
    ),
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".right"),
    ),
  ],
  SequenceEffect: (
    { 1: effect11, 2: effect12 },
    { 1: effect21, 2: effect22 },
    error,
  ) => [
    visitEffect(effect11, effect21, appendErrorSegment(error, ".first")),
    visitEffect(effect12, effect22, appendErrorSegment(error, ".second")),
  ],
  ConditionalEffect: (
    { 1: expression1, 2: effect11, 3: effect12 },
    { 1: expression2, 2: effect21, 3: effect22 },
    error,
  ) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".test"),
    ),
    visitEffect(effect11, effect21, appendErrorSegment(error, ".first")),
    visitEffect(effect12, effect22, appendErrorSegment(error, ".second")),
  ],
  ExpressionEffect: ({ 1: expression1 }, { 1: expression2 }, error) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".expression"),
    ),
  ],
});

export const visitExpression = partialx___(visitNode, {
  ParameterExpression: ({ 1: parameter1 }, { 1: parameter2 }, error) => [
    visitPrimitive(parameter1, parameter2, appendErrorSegment(error, ".name")),
  ],
  LiteralExpression: ({ 1: literal1 }, { 1: literal2 }, error) => [
    visitLiteral(literal1, literal2, appendErrorSegment(error, ".value")),
  ],
  IntrinsicExpression: ({ 1: intrinsic1 }, { 1: intrinsic2 }, error) => [
    visitPrimitive(intrinsic1, intrinsic2, appendErrorSegment(error, ".name")),
  ],
  ClosureExpression: (
    { 1: kind1, 2: asynchronous1, 3: generator1, 4: block1 },
    { 1: kind2, 2: asynchronous2, 3: generator2, 4: block2 },
    error,
  ) => [
    visitPrimitive(kind1, kind2, appendErrorSegment(error, ".kind")),
    visitPrimitive(
      asynchronous1,
      asynchronous2,
      appendErrorSegment(error, ".asynchronous"),
    ),
    visitPrimitive(
      generator1,
      generator2,
      appendErrorSegment(error, ".generator"),
    ),
    // We do not have to unbind labels because there
    // should be no unbound labels in the closure body.
    visitBlock(block1, block2, appendErrorSegment(error, ".body")),
  ],
  ReadExpression: ({ 1: variable1 }, { 1: variable2 }, _error) => [
    makeSingleVariableResult(variable1, variable2),
  ],
  ReadExternalExpression: ({ 1: variable1 }, { 1: variable2 }, error) => [
    visitPrimitive(variable1, variable2, appendErrorSegment(error, ".name")),
  ],
  TypeofExternalExpression: ({ 1: variable1 }, { 1: variable2 }, error) => [
    visitPrimitive(variable1, variable2, appendErrorSegment(error, ".name")),
  ],
  SequenceExpression: (
    { 1: effect1, 2: expression1 },
    { 1: effect2, 2: expression2 },
    error,
  ) => [
    visitEffect(effect1, effect2, appendErrorSegment(error, ".first")),
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".second"),
    ),
  ],
  ConditionalExpression: (
    { 1: expression11, 2: expression12, 3: expression13 },
    { 1: expression21, 2: expression22, 3: expression23 },
    error,
  ) => [
    visitExpression(
      expression11,
      expression21,
      appendErrorSegment(error, ".test"),
    ),
    visitExpression(
      expression12,
      expression22,
      appendErrorSegment(error, ".consequent"),
    ),
    visitExpression(
      expression13,
      expression23,
      appendErrorSegment(error, ".alternate"),
    ),
  ],
  YieldExpression: (
    { 1: delegate1, 2: expression1 },
    { 1: delegate2, 2: expression2 },
    error,
  ) => [
    visitPrimitive(
      delegate1,
      delegate2,
      appendErrorSegment(error, ".delegate"),
    ),
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".argument"),
    ),
  ],
  AwaitExpression: ({ 1: expression1 }, { 1: expression2 }, error) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".argument"),
    ),
  ],
  EvalExpression: ({ 1: expression1 }, { 1: expression2 }, error) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".argument"),
    ),
  ],
  ApplyExpression: (
    { 1: expression11, 2: expression12, 3: expressions1 },
    { 1: expression21, 2: expression22, 3: expressions2 },
    error,
  ) => [
    visitExpression(
      expression11,
      expression21,
      appendErrorSegment(error, ".callee"),
    ),
    visitExpression(
      expression12,
      expression22,
      appendErrorSegment(error, ".this"),
    ),
    visitAllExpression(
      expressions1,
      expressions2,
      appendErrorSegment(error, ".arguments"),
    ),
  ],
  // InvokeExpression: (
  //   error,
  //   expression11,
  //   expression12,
  //   expressions1,
  //   _annotation1,
  //   expression21,
  //   expression22,
  //   expressions2,
  //   _annotation2,
  // ) => [
  //   visitExpression(
  //     appendErrorSegment(error, ".object"),
  //     expression11,
  //     expression21,
  //   ),
  //   visitExpression(
  //     appendErrorSegment(error, ".property"),
  //     expression12,
  //     expression22,
  //   ),
  //   visitAllExpression(
  //     appendErrorSegment(error, ".arguments"),
  //     expressions1,
  //     expressions2,
  //   ),
  // ],
  ConstructExpression: (
    { 1: expression1, 2: expressions1 },
    { 1: expression2, 2: expressions2 },
    error,
  ) => [
    visitExpression(
      expression1,
      expression2,
      appendErrorSegment(error, ".callee"),
    ),
    visitAllExpression(
      expressions1,
      expressions2,
      appendErrorSegment(error, ".arguments"),
    ),
  ],
  ImportExpression: (
    { 1: source1, 2: specifier1 },
    { 1: source2, 2: specifier2 },
    error,
  ) => [
    visitPrimitive(source1, source2, appendErrorSegment(error, ".source")),
    visitPrimitive(
      specifier1,
      specifier2,
      appendErrorSegment(error, ".specifier"),
    ),
  ],
});

const bindAll = (bind, initial_result, array1, array2, error) =>
  combineResult(
    visitPrimitive(
      array1.length,
      array2.length,
      appendErrorSegment(error, ".length"),
    ),
    reduce(
      zip(array1, array2),
      (result, pair, index) =>
        bind(
          result,
          pair[0],
          pair[1],
          appendErrorSegment(error, `[${String(index)}]`),
        ),
      initial_result,
    ),
    error,
  );

const bindAllLabel = partialx____(bindAll, bindResultLabel);
const bindAllVariable = partialx____(bindAll, bindResultVariable);

const visitArray = (visit, array1, array2, error) =>
  combineResult(
    visitPrimitive(
      array1.length,
      array2.length,
      appendErrorSegment(error, ".length"),
    ),
    reduce(
      zip(array1, array2),
      (result, pair, index) => {
        const child_error = appendErrorSegment(error, `[${String(index)}]`);
        return combineResult(
          result,
          visit(pair[0], pair[1], child_error),
          child_error,
        );
      },
      makeEmptyResult(null),
    ),
    error,
  );

const visitAllExpression = partialx___(visitArray, visitExpression);
const visitAllStatement = partialx___(visitArray, visitStatement);
const visitAllLink = partialx___(visitArray, visitLink);
