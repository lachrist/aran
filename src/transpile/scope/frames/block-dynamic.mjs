import { concat, includes, map } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  constant_,
  hasOwn,
  push,
  assert,
  expect1,
  drop__x,
  partialx___,
  partialx_,
  constant___,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeDeleteSloppyExpression,
  makeDefineExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {
  DUPLICATE_TEMPLATE,
  DuplicateError,
  makeTypeofGetExpression,
  makeIncrementSetEffect,
  makeThrowDeadzoneExpression,
  makeThrowDeadzoneEffect,
  makeThrowDuplicateExpression,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { ownKeys, defineProperty },
} = globalThis;

const KINDS = ["let", "const", "class"];

export const createFrame = ({ macro }) => ({
  dynamic: macro,
  conflicts: [],
  static: {},
});

const checkConflict = (conflicts, bindings, variable) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
  if (!includes(conflicts, variable)) {
    push(conflicts, variable);
  }
};

const makeConflictStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression("in", makeLiteralExpression(variable), dynamic),
        makeThrowDuplicateExpression(variable),
        makeLiteralExpression({ undefined: null }),
      ),
    ),
  );

const makeDeclareStatement = (dynamic, variable) =>
  makeEffectStatement(
    makeExpressionEffect(
      makeDefineExpression(
        dynamic,
        makeLiteralExpression(variable),
        makeDataDescriptorExpression(
          makeDeadzoneExpression(),
          makeLiteralExpression(true),
          makeLiteralExpression(true),
          makeLiteralExpression(false),
        ),
      ),
    ),
  );

export const harvestFrameHeader = constant_([]);

export const harvestFramePrelude = ({ dynamic, conflicts, static: bindings }) =>
  concat(
    map(conflicts, partialx_(makeConflictStatement, dynamic)),
    map(ownKeys(bindings), partialx_(makeDeclareStatement, dynamic)),
  );

export const declareFrame = (
  _strict,
  { conflicts, static: bindings },
  trail,
  kind,
  variable,
  options,
) => {
  checkConflict(conflicts, bindings, variable);
  if (includes(KINDS, kind)) {
    const { exports: specifiers } = options;
    assert(specifiers.length === 0, "unexpected global exported variable");
    defineProperty(bindings, variable, {
      __proto__: NULL_DATA_DESCRIPTOR,
      value: false,
    });
    return null;
  } else {
    return trail;
  }
};

export const makeFrameInitializeStatementArray = (
  _strict,
  { conflicts, dynamic: macro, static: bindings },
  trail,
  kind,
  variable,
  expression,
) => {
  if (includes(KINDS, kind)) {
    assert(hasOwn(bindings, variable), "missing variable for initialization");
    assert(bindings[variable] === false, "duplicate variable initialization");
    bindings[variable] = true;
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeDefineExpression(
            macro,
            makeLiteralExpression(variable),
            makeDataDescriptorExpression(
              expression,
              makeLiteralExpression(kind !== "const"),
              makeLiteralExpression(true),
              makeLiteralExpression(false),
            ),
          ),
        ),
      ),
    ];
  } else {
    checkConflict(conflicts, bindings, variable);
    return trail;
  }
};

export const lookupFrameAll = constant___(undefined);

const compileMakeLookupNode =
  (makeConditionalNode, makeDeadNode, makeLiveNode) =>
  (next, strict, frame, scope, escaped, variable, options) => {
    if (hasOwn(frame.static, variable)) {
      if (makeDeadNode === null) {
        return makeLiveNode(
          frame.dynamic,
          makeLiteralExpression(variable),
          options,
        );
      } else {
        if (frame.static[variable]) {
          return makeLiveNode(
            frame.dynamic,
            makeLiteralExpression(variable),
            options,
          );
        } else if (escaped) {
          return makeConditionalNode(
            makeBinaryExpression(
              "===",
              makeGetExpression(frame.dynamic, makeLiteralExpression(variable)),
              makeDeadzoneExpression(),
            ),
            makeDeadNode(variable),
            makeLiveNode(
              frame.dynamic,
              makeLiteralExpression(variable),
              options,
            ),
          );
        } else {
          return makeDeadNode(variable);
        }
      }
    } else {
      return makeConditionalNode(
        makeBinaryExpression(
          "in",
          makeLiteralExpression(variable),
          frame.dynamic,
        ),
        makeDeadNode === null
          ? makeLiveNode(
              frame.dynamic,
              makeLiteralExpression(variable),
              options,
            )
          : makeConditionalNode(
              makeBinaryExpression(
                "===",
                makeGetExpression(
                  frame.dynamic,
                  makeLiteralExpression(variable),
                ),
                makeDeadzoneExpression(),
              ),
              makeDeadNode(variable),
              makeLiveNode(
                frame.dynamic,
                makeLiteralExpression(variable),
                options,
              ),
            ),
        next(strict, scope, escaped, variable, options),
      );
    }
  };

export const makeFrameReadExpression = compileMakeLookupNode(
  makeConditionalExpression,
  makeThrowDeadzoneExpression,
  drop__x(makeGetExpression),
);

export const makeFrameTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  makeThrowDeadzoneExpression,
  drop__x(makeTypeofGetExpression),
);

export const makeFrameDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  null,
  drop__x(makeDeleteSloppyExpression),
);

export const makeFrameWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  makeThrowDeadzoneEffect,
  partialx___(makeIncrementSetEffect, true),
);
