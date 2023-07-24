import { assert } from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
} from "../../../ast/index.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeReflectDefinePropertyExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

const { Error } = globalThis;

// export const makeBinding = ({}) => ({ type: "global" });

export const generateBindingDeclareStatement = (
  _strict,
  _binding,
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
        makeLiteralExpression({ undefined: null }),
      ),
    ),
  ),
];

export const generateBindingInitializeStatement = (
  _strict,
  _binding,
  variable,
  expression,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeReflectDefinePropertyExpression(
          makeIntrinsicExpression("aran.global.object"),
          makeLiteralExpression(variable),
          makeDataDescriptorExpression(
            expression,
            makeLiteralExpression(true),
            makeLiteralExpression(true),
            makeLiteralExpression(false),
          ),
        ),
      ),
      makeLiteralExpression({ undefined: null }),
      makeThrowConstantExpression(variable),
    ),
  ),
];

const makeDeadRecordLookupExpression = (_strict, variable, lookup) =>
  lookup.type === "discard"
    ? makeLiteralExpression(false)
    : makeThrowDeadzoneExpression(variable);

const makeLiveRecordLookupExpression = (strict, variable, lookup) => {
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
    assert(
      lookup.pure,
      "makeRecordLookupExpression does not handle impure write",
    );
    return makeConditionalExpression(
      makeGetExpression(
        makeIntrinsicExpression("aran.global.record.variables"),
        makeLiteralExpression(variable),
      ),
      makeSetExpression(
        strict,
        makeIntrinsicExpression("aran.global.record.values"),
        makeLiteralExpression(variable),
        lookup.right,
      ),
      makeThrowConstantExpression(variable),
    );
  } else {
    throw new Error("invalid lookup type");
  }
};

const makePresentObjectLookupExpression = (strict, variable, lookup) => {
  if (lookup.type === "read") {
    return makeGetExpression(
      makeIntrinsicExpression("aran.global.object"),
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
    return makeSetExpression(
      strict,
      makeIntrinsicExpression("aran.global.record.values"),
      makeLiteralExpression(variable),
      lookup.right,
    );
  } else {
    throw new Error("invalid lookup type");
  }
};

export const makeBindingLookupNode = (
  strict,
  _binding,
  variable,
  _escaped,
  lookup,
) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  }
  if (lookup.type === "write" && !lookup.pure) {
    return null;
  } else {
    const expression = makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makeLiteralExpression(variable),
        makeIntrinsicExpression("aran.global.record.variables"),
      ),
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makeLiteralExpression(variable),
          makeIntrinsicExpression("aran.global.record.values"),
        ),
        makeLiveRecordLookupExpression(strict, variable, lookup),
        makeDeadRecordLookupExpression(strict, variable, lookup),
      ),
      makePresentObjectLookupExpression(strict, variable, lookup),
    );
    return lookup.type === "write"
      ? makeExpressionEffect(expression)
      : expression;
  }
};
