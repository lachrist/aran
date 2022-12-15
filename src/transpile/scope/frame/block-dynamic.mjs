import { concat, includes, map } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  constant_,
  hasOwnProperty,
  push,
  assert,
  partialx_,
  bind_,
  constant___,
  partialxxx______,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  makeDefineExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeDataDescriptorExpression,
  makeDeadzoneExpression,
} from "../../../intrinsic.mjs";

import {
  conflictStaticExternal,
  testStatic,
  makeDynamicTestExpression,
  makeObservableDynamicTestExpression,
  makeDynamicLookupEffect,
  makeDynamicLookupExpression,
  makeDynamicReadExpression,
  makeDynamicTypeofExpression,
  makeDynamicDiscardExpression,
  makeDynamicWriteEffect,
  makeThrowDeadzoneExpression,
  makeThrowDuplicateExpression,
} from "./helper.mjs";

const {
  undefined,
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["let", "const", "class"];

export const create = (_layer, { macro, observable }) => ({
  dynamic: macro,
  observable,
  conflicts: [],
  static: {},
});

export const conflict = (strict, frame, kind, variable) => {
  conflictStaticExternal(strict, frame, kind, variable);
  const { conflicts } = frame;
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

export const harvestHeader = constant_([]);

export const harvestPrelude = ({ dynamic, conflicts, static: bindings }) =>
  concat(
    map(conflicts, partialx_(makeConflictStatement, dynamic)),
    map(ownKeys(bindings), partialx_(makeDeclareStatement, dynamic)),
  );

export const declare = (
  _strict,
  { static: bindings },
  _kind,
  variable,
  { exports: specifiers },
) => {
  assert(specifiers.length === 0, "unexpected global exported variable");
  assert(
    !hasOwnProperty(bindings, variable),
    "duplicate variable should have been caught by conflict",
  );
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: false,
  });
};

export const makeInitializeStatementArray = (
  _strict,
  { dynamic: macro, static: bindings },
  kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(bindings, variable),
    "missing variable for initialization",
  );
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
};

const generateMakeDeadzoneNode =
  (makeConditionalNode, makeDeadNode, makeLiveNode) =>
  (strict, escaped, frame, variable, options) => {
    const { dynamic: macro, static: bindings } = frame;
    if (hasOwnProperty(bindings, variable) && bindings[variable]) {
      return makeLiveNode(strict, escaped, frame, variable, options);
    } else if (hasOwnProperty(bindings, variable) && !escaped) {
      return makeDeadNode(variable);
    } else {
      return makeConditionalNode(
        makeBinaryExpression(
          "===",
          makeGetExpression(macro, makeLiteralExpression(variable)),
          makeDeadzoneExpression(),
        ),
        makeDeadNode(variable),
        makeLiveNode(strict, escaped, frame, variable, options),
      );
    }
  };

export const lookupAll = constant___(undefined);

export const makeReadExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  generateMakeDeadzoneNode(
    makeConditionalExpression,
    makeThrowDeadzoneExpression,
    makeDynamicReadExpression,
  ),
);

export const makeTypeofExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  generateMakeDeadzoneNode(
    makeConditionalExpression,
    makeThrowDeadzoneExpression,
    makeDynamicTypeofExpression,
  ),
);

export const makeDiscardExpression = partialxxx______(
  makeDynamicLookupExpression,
  testStatic,
  makeDynamicTestExpression,
  makeDynamicDiscardExpression,
);

export const makeWriteEffect = partialxxx______(
  makeDynamicLookupEffect,
  testStatic,
  makeObservableDynamicTestExpression,
  generateMakeDeadzoneNode(
    makeConditionalEffect,
    bind_(makeExpressionEffect, makeThrowDeadzoneExpression),
    (_strict, escaped, frame, variable, options) =>
      makeDynamicWriteEffect(true, escaped, frame, variable, options),
  ),
);
