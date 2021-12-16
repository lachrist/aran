
import {zip} from "array-lite";
import {makeApplyExpression, makeIntrinsicExpression, makePrimitiveExpression, makeReadEnclaveExpression} from "./ast/index.mjs";
import {cut} from "./cut.mjs";
import {getTrap} from "./traps.mjs";

const {
  Reflect: {apply},
} = globalThis

const applyPair = ({0:first, 1:second}) => first(second);

const makeInnerTrapExpression = (namespace, name, expressions) => makeApplyExpression(
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

export const makeTrapStatementArray = ({namespace, pointcut}, name, values) =>
  cut(pointcut, name, map(zip(getTrapStatic(name), values), applyPair))
  ? [
    makeEffectStatement(
      makeExpressionEffect(
        makeInnerTrapExpression(
          namespace,
          name,
          map(zip(getTrapDynamic(name), values), applyPair),
        ),
      ),
    ),
  ]
  : [];

export const makeTrapExpression = ({pointcut, namespace}, name, values) =>
  cut(pointcut, name, map(zip(getTrapStatic(name), values), applyPair))
  ? makeInnerTrapExpression(
    namespace,
    name,
    map(zip(getTrapDynamic(name), values), applyPair),
  )
  : apply(getTrapCombine(name), undefined, values)
