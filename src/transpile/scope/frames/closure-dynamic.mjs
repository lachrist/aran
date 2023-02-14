import { map } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  incrementCounter,
  hasOwn,
  assert,
  noop_,
  drop__x,
  constant_,
  partialx___,
  constant___,
  constant____,
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
  makeDefineExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";

import { makeTypeofGetExpression, makeIncrementSetEffect } from "./helper.mjs";

const {
  undefined,
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["var", "function"];

export const createFrame = ({ macro, observable }) => ({
  dynamic: macro,
  static: {},
  observable,
});

export const conflictFrame = constant____(undefined);

const makeDeclareStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeLiteralExpression({ undefined: null }),
        makeDefineExpression(
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

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = ({
  dynamic: expression,
  static: bindings,
}) => map(ownKeys(bindings), partialx_(makeDeclareStatement, expression));

export const declareFrame = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { exports: specifiers },
) => {
  assert(specifiers.length === 0, "unexpected global exported variable");
  if (!hasOwn(bindings, variable)) {
    defineProperty(bindings, variable, NULL_DATA_DESCRIPTOR);
  }
};

export const makeFrameInitializeStatementArray = (
  _strict,
  { dynamic, static: bindings },
  _kind,
  variable,
  expression,
) => {
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
};

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makeConditionalNode, makePresentNode, observe) =>
  (
    next,
    strict,
    { static: bindings, dynamic: macro, observable },
    scope,
    escaped,
    variable,
    options,
  ) => {
    if (observable) {
      observe(options);
    }
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
  noop_,
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  drop__x(makeTypeofGetExpression),
  noop_,
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  drop__x(makeDeleteSloppyExpression),
  noop_,
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  partialx___(makeIncrementSetEffect, true),
  ({ counter }) => {
    incrementCounter(counter);
    incrementCounter(counter);
  },
);
