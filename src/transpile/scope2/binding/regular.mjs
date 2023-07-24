import { reduce } from "array-lite";

import {
  makeExportEffect,
  makeWriteEffect,
  makeExpressionEffect,
  makeConditionalEffect,
  makeReadExpression,
  makeConditionalExpression,
  makeLiteralExpression,
  makeSequenceEffect,
  makeEffectStatement,
} from "../../../ast/index.mjs";

import {
  mangleDeadzoneVariable,
  mangleOriginalVariable,
} from "../../variable.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";

const { Error } = globalThis;

// export const makeBinding = ({ writable, exports, switch: switch_ }) => ({
//   type: "static",
//   initialized: false,
//   writable,
//   exports,
//   switch: switch_,
// });

export const listBindingVariable = (_strict, _binding, variable) => [
  mangleDeadzoneVariable(variable),
  mangleOriginalVariable(variable),
];

export const generateBindingDeclareStatement = (
  _strict,
  _binding,
  variable,
) => [
  makeEffectStatement(makeWriteEffect(mangleDeadzoneVariable(variable), false)),
];

export const initializeBinding = (_strict, binding, _variable) => ({
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
    makeWriteEffect(mangleOriginalVariable(variable), expression),
  ),
  makeEffectStatement(makeWriteEffect(mangleDeadzoneVariable(variable), true)),
];

const makeBindingLiveLookupNode = (variable, binding, lookup) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  } else if (lookup.type === "read") {
    return makeReadExpression(mangleOriginalVariable(variable));
  } else if (lookup.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeReadExpression(mangleOriginalVariable(variable)),
    );
  } else if (lookup.type === "write") {
    if (binding.writable) {
      return reduce(
        binding.exports,
        (effect, specifier) =>
          makeSequenceEffect(
            effect,
            makeExportEffect(
              specifier,
              makeReadExpression(mangleOriginalVariable(variable)),
            ),
          ),
        makeWriteEffect(mangleOriginalVariable(variable), lookup.right),
      );
    } else {
      const expression = makeThrowConstantExpression(variable);
      return lookup.pure
        ? makeExpressionEffect(expression)
        : makeSequenceEffect(
            makeExpressionEffect(lookup.right),
            makeExpressionEffect(expression),
          );
    }
  } else {
    throw new Error("invalid lookup type");
  }
};

const makeBindingDeadLookupNode = (variable, _binding, lookup) => {
  if (lookup.type === "write") {
    const expression = makeThrowDeadzoneExpression(variable);
    return lookup.pure
      ? makeExpressionEffect(expression)
      : makeSequenceEffect(
          makeExpressionEffect(lookup.right),
          makeExpressionEffect(expression),
        );
  } else {
    return makeThrowDeadzoneExpression(variable);
  }
};

export const makeBindingLookupNode = (
  _strict,
  binding,
  variable,
  escaped,
  lookup,
) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  } else {
    if (binding.initialized && !binding.switch) {
      return makeBindingLiveLookupNode(variable, binding, lookup);
    }
    if (!binding.initialized && !escaped) {
      return makeBindingDeadLookupNode(variable, binding, lookup);
    }
    if (lookup.type === "write" && !lookup.pure) {
      return null;
    } else {
      const makeConditionalNode =
        lookup.type === "write"
          ? makeConditionalEffect
          : makeConditionalExpression;
      return makeConditionalNode(
        makeReadExpression(mangleDeadzoneVariable(variable)),
        makeBindingLiveLookupNode(variable, binding, lookup),
        makeBindingDeadLookupNode(variable, binding, lookup),
      );
    }
  }
};
