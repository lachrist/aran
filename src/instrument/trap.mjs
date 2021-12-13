
import {makeApplyExpression, makeIntrinsicExpression, makePrimitiveExpression, makeReadEnclaveExpression} from "./ast/index.mjs";

export const makeTrapExpression = (namespace, name, expressions) => makeApplyExpression(
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get"),
    makePrimitiveExpression({undefined:null}),
    [
      makeReadEnclaveExpression(namespace),
      makePrimitiveExpression(name),
    ],
  ),
  makeReadEnclaveExpression(namespace),
  expressions,
);

export const makeTrapStatementArray = (namespace, name, expressions) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeTrapExpression(namespace, name, expressions),
    ),
  ),
];
