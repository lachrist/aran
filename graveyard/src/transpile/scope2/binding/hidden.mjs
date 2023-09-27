import {
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeSequenceExpression,
} from "../../../ast/index.mjs";

import {
  makeGetExpression,
  makeSetExpression,
  makeUnaryExpression,
  makeBinaryExpression,
} from "../../../intrinsic.mjs";

import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "../error.mjs";

const { Error } = globalThis;

// export const makeBinding = ({ writable }) => ({
//   type: "hidden",
//   initialized: false,
//   writable,
// });

export const generateBindingDeclareStatement = (
  _strict,
  { writable },
  variable,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makeLiteralExpression(variable),
          makeIntrinsicExpression("aran.global.record.variables"),
        ),
        makeThrowDuplicateExpression(variable),
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.global.record.variables"),
          makeLiteralExpression(variable),
          makeLiteralExpression(writable),
        ),
      ),
    ),
  ),
];

export const initializeBinding = (_strict, _variable, binding) => ({
  ...binding,
  initialized: true,
});

export const generateBindingInitializeStatement = (
  _strict,
  _binding,
  variable,
  expression,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeSetExpression(
        true,
        makeIntrinsicExpression("aran.global.record.values"),
        makeLiteralExpression(variable),
        expression,
      ),
    ),
  ),
];

const makeLiveLookupExpression = (writable, variable, lookup) => {
  if (lookup.type === "read") {
    return makeGetExpression(
      makeIntrinsicExpression("aran.global.record.values"),
      makeLiteralExpression(variable),
    );
  } else if (lookup.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeGetExpression(
        makeIntrinsicExpression("aran.global.record.values"),
        makeLiteralExpression(variable),
      ),
    );
  } else if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  } else if (lookup.type === "write") {
    if (writable) {
      return makeSetExpression(
        true,
        makeIntrinsicExpression("aran.global.record.values"),
        makeLiteralExpression(variable),
        lookup.right,
      );
    } else {
      const expression = makeThrowConstantExpression(variable);
      return lookup.pure
        ? expression
        : makeSequenceExpression(
            makeExpressionEffect(lookup.right),
            expression,
          );
    }
  } else {
    throw new Error("invalid lookup type");
  }
};

const makeDeadLookupExpression = (_writable, variable, lookup) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  } else {
    if (lookup.type === "write" && !lookup.pure) {
      return makeSequenceExpression(
        makeExpressionEffect(lookup.right),
        makeThrowDeadzoneExpression(variable),
      );
    } else {
      return makeThrowDeadzoneExpression(variable);
    }
  }
};

const makeLookupExpression = (
  variable,
  { initialized, writable },
  escaped,
  lookup,
) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  }
  if (initialized) {
    return makeLiveLookupExpression(writable, variable, lookup);
  }
  if (!initialized && !escaped) {
    return makeDeadLookupExpression(writable, variable, lookup);
  }
  if (lookup.type === "write" && !lookup.pure) {
    return null;
  } else {
    return makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makeLiteralExpression(variable),
        makeIntrinsicExpression("aran.global.record.values"),
      ),
      makeLiveLookupExpression(writable, variable, lookup),
      makeDeadLookupExpression(writable, variable, lookup),
    );
  }
};

export const makeBindingLookupNode = (
  strict,
  binding,
  variable,
  escaped,
  lookup,
) => {
  const maybe_expression = makeLookupExpression(
    strict,
    binding,
    variable,
    escaped,
    lookup,
  );
  return maybe_expression !== null && lookup.type === "write"
    ? makeExpressionEffect(maybe_expression)
    : maybe_expression;
};
