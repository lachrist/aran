import { filterNarrow, map, isNotNull } from "../../util/index.mjs";

/**
 * @type {(
 *   kind: (
 *     | "block@setup"
 *     | "block@frame"
 *     | "block@overframe"
 *     | "block@before"
 *     | "block@after"
 *     | "block@failure"
 *     | "block@teardown"
 *   ),
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").BlockPointcut,
 * ]}
 */
const extractBlockPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: (
 *     | "statement@before"
 *     | "statement@after"
 *   ),
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").StatementPointcut,
 * ]}
 */
const extractStatementPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: (
 *     | "effect@before"
 *     | "effect@after"
 *   ),
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").EffectPointcut,
 * ]}
 */
const extractEffectPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: (
 *     | "expression@before"
 *     | "expression@after"
 *   ),
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").ExpressionPointcut,
 * ]}
 */
const extractExpressionPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: "eval@before",
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").EvalExpressionPointcut,
 * ]}
 */
const extractEvalExpressionPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: "apply@around",
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").ApplyExpressionPointcut,
 * ]}
 */
const extractApplyExpressionPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   kind: "construct@around",
 *   entry: [
 *     estree.Variable,
 *     import("./advice").EmptyAdvice,
 *   ],
 * ) => null | [
 *   estree.Variable,
 *   import("./pointcut").ConstructExpressionPointcut,
 * ]}
 */
const extractConstructExpressionPointcut = (kind, [variable, advice]) => {
  if (advice.kind === kind) {
    return [variable, advice.pointcut];
  } else {
    return null;
  }
};

/**
 * @type {(
 *   aspect: import("./advice").EmptyAspect,
 * ) => import("./pointcut").AspectPointcut}
 */
export const extractPointcut = (aspect) => ({
  "block@setup": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@setup", entry)),
    isNotNull,
  ),
  "block@frame": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@frame", entry)),
    isNotNull,
  ),
  "block@overframe": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@overframe", entry)),
    isNotNull,
  ),
  "block@before": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@before", entry)),
    isNotNull,
  ),
  "block@after": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@after", entry)),
    isNotNull,
  ),
  "block@failure": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@failure", entry)),
    isNotNull,
  ),
  "block@teardown": filterNarrow(
    map(aspect, (entry) => extractBlockPointcut("block@teardown", entry)),
    isNotNull,
  ),
  "statement@before": filterNarrow(
    map(aspect, (entry) => extractStatementPointcut("statement@before", entry)),
    isNotNull,
  ),
  "statement@after": filterNarrow(
    map(aspect, (entry) => extractStatementPointcut("statement@after", entry)),
    isNotNull,
  ),
  "effect@before": filterNarrow(
    map(aspect, (entry) => extractEffectPointcut("effect@before", entry)),
    isNotNull,
  ),
  "effect@after": filterNarrow(
    map(aspect, (entry) => extractEffectPointcut("effect@after", entry)),
    isNotNull,
  ),
  "expression@before": filterNarrow(
    map(aspect, (entry) =>
      extractExpressionPointcut("expression@before", entry),
    ),
    isNotNull,
  ),
  "expression@after": filterNarrow(
    map(aspect, (entry) =>
      extractExpressionPointcut("expression@after", entry),
    ),
    isNotNull,
  ),
  "eval@before": filterNarrow(
    map(aspect, (entry) => extractEvalExpressionPointcut("eval@before", entry)),
    isNotNull,
  ),
  "apply@around": filterNarrow(
    map(aspect, (entry) =>
      extractApplyExpressionPointcut("apply@around", entry),
    ),
    isNotNull,
  ),
  "construct@around": filterNarrow(
    map(aspect, (entry) =>
      extractConstructExpressionPointcut("construct@around", entry),
    ),
    isNotNull,
  ),
});
