import { includes, map } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  assert,
  drop__x,
  partialx___,
  partialx_,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeDeleteSloppyExpression,
  makeGetExpression,
  makeSetExpression,
  makeReflectDefinePropertyExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import {
  makeTypeofGetExpression,
  makeIncrementSetEffect,
  harvestEmptyFrameHeader,
  lookupEmptyFrameAll,
} from "./helper.mjs";

const {
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["var", "function"];

export const createFrame = ({ macro }) => ({
  dynamic: macro,
  static: {},
});

const makeDeclareStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeLiteralExpression({ undefined: null }),
        makeReflectDefinePropertyExpression(
          dynamic,
          makeLiteralExpression(variable),
          makeDataDescriptorExpression(
            makeLiteralExpression({ undefined: null }),
            makeLiteralExpression(true),
            makeLiteralExpression(true),
            makeLiteralExpression(false),
          ),
        ),
      ),
    ),
  );

export const harvestFrameHeader = harvestEmptyFrameHeader;

export const harvestFramePrelude = ({
  dynamic: expression,
  static: bindings,
}) => map(ownKeys(bindings), partialx_(makeDeclareStatement, expression));

export const declareFrame = (
  _strict,
  { static: bindings },
  trail,
  kind,
  variable,
  options,
) => {
  if (includes(KINDS, kind)) {
    const { exports: specifiers } = options;
    assert(specifiers.length === 0, "unexpected global exported variable");
    if (!hasOwn(bindings, variable)) {
      defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
    }
    return null;
  } else {
    return trail;
  }
};

export const makeFrameInitializeStatementArray = (
  _strict,
  { dynamic, static: bindings },
  trail,
  kind,
  variable,
  expression,
) => {
  if (includes(KINDS, kind)) {
    assert(
      hasOwn(bindings, variable),
      "missing binding for variable initialization",
    );
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeSetExpression(
            true,
            dynamic,
            makeLiteralExpression(variable),
            expression,
          ),
        ),
      ),
    ];
  } else {
    return trail;
  }
};

export const lookupFrameAll = lookupEmptyFrameAll;

const compileMakeLookupNode =
  (makeConditionalNode, makePresentNode) =>
  (
    next,
    strict,
    { static: bindings, dynamic: macro },
    scope,
    escaped,
    variable,
    options,
  ) => {
    const node = makePresentNode(
      macro,
      makeLiteralExpression(variable),
      options,
    );
    if (hasOwn(bindings, variable)) {
      return node;
    } else {
      return makeConditionalNode(
        makeBinaryExpression("in", makeLiteralExpression(variable), macro),
        node,
        next(strict, scope, escaped, variable, options),
      );
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  makeConditionalExpression,
  drop__x(makeGetExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  drop__x(makeTypeofGetExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  drop__x(makeDeleteSloppyExpression),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  partialx___(makeIncrementSetEffect, true),
);
