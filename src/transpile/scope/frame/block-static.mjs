import { filter, map, concat } from "array-lite";

import {
  NULL_DATA_DESCRIPTOR,
  hasOwn,
  assert,
  drop_xxxx,
  constant_____,
  partial_x,
  partialx_,
  expect1,
} from "../../../util/index.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
  makeReadExpression as makeRawReadExpression,
  makeWriteEffect as makeRawWriteEffect,
} from "../../../ast/index.mjs";

import {
  mangleDeadzoneVariable,
  mangleOriginalVariable,
} from "../variable.mjs";

import {
  DuplicateError,
  DUPLICATE_TEMPLATE,
  makeThrowDeadzoneEffect,
  makeTypeofReadExpression,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeExportIncrementWriteEffect,
  makeExportStatement,
} from "./helper.mjs";

const {
  Reflect: { ownKeys, defineProperty },
} = globalThis;

export const KINDS = ["let", "const", "class"];

export const create = ({ distant }) => ({
  distant,
  bindings: {},
});

const hasDeadzone = (bindings, variable) => bindings[variable].deadzone;

const makeDeadzoneInitializeStatement = (variable) =>
  makeEffectStatement(
    makeRawWriteEffect(
      mangleDeadzoneVariable(variable),
      makeLiteralExpression(false),
    ),
  );

export const harvestHeader = ({ bindings }) =>
  concat(
    map(ownKeys(bindings), mangleOriginalVariable),
    map(
      filter(ownKeys(bindings), partialx_(hasDeadzone, bindings)),
      mangleDeadzoneVariable,
    ),
  );

export const harvestPrelude = ({ bindings }) =>
  map(
    filter(ownKeys(bindings), partialx_(hasDeadzone, bindings)),
    makeDeadzoneInitializeStatement,
  );

export const conflict = (_strict, { bindings }, _kind, variable) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
};

export const declare = (
  _strict,
  { bindings },
  kind,
  variable,
  { exports: specifiers },
) => {
  expect1(
    !hasOwn(bindings, variable),
    DuplicateError,
    DUPLICATE_TEMPLATE,
    variable,
  );
  defineProperty(bindings, variable, {
    __proto__: NULL_DATA_DESCRIPTOR,
    value: {
      initialized: false,
      deadzone: false,
      writable: kind !== "const",
      exports: specifiers,
    },
  });
};

export const makeInitializeStatementArray = (
  _strict,
  { bindings, distant },
  _kind,
  variable,
  expression,
) => {
  assert(hasOwn(bindings, variable), "missing variable for initialization");
  const binding = bindings[variable];
  assert(!binding.initialized, "duplicate initialization");
  binding.initialized = true;
  return concat(
    [
      makeEffectStatement(
        makeRawWriteEffect(mangleOriginalVariable(variable), expression),
      ),
    ],
    binding.deadzone || distant
      ? [
          makeEffectStatement(
            makeRawWriteEffect(
              mangleDeadzoneVariable(variable),
              makeLiteralExpression(true),
            ),
          ),
        ]
      : [],
    map(
      binding.exports,
      partial_x(
        makeExportStatement,
        makeRawReadExpression(mangleOriginalVariable(variable)),
      ),
    ),
  );
};

export const lookupAll = (_strict, escaped, { bindings, distant }) => {
  const variables = ownKeys(bindings);
  if (escaped || distant) {
    for (let index = 0; index < variables.length; index += 1) {
      const binding = bindings[variables[index]];
      if (
        (!binding.initialized && escaped) ||
        (binding.initialized && distant)
      ) {
        binding.deadzone = true;
      }
    }
  }
};

const compileMakeLookupNode =
  (makeConditionalNode, makeDeadNode, makeLiveNode) =>
  (next, strict, { bindings, distant }, scope, escaped, variable, options) => {
    if (hasOwn(bindings, variable)) {
      const binding = bindings[variable];
      if (makeDeadNode === null) {
        return makeLiveNode(
          mangleOriginalVariable(variable),
          variable,
          binding.writable,
          binding.exports,
          options,
        );
      } else {
        if (!binding.initialized && !escaped) {
          return makeDeadNode(variable);
        } else if (binding.initialized && !distant) {
          return makeLiveNode(
            mangleOriginalVariable(variable),
            variable,
            binding.writable,
            binding.exports,
            options,
          );
        } else {
          binding.deadzone = true;
          return makeConditionalNode(
            makeRawReadExpression(mangleDeadzoneVariable(variable)),
            makeLiveNode(
              mangleOriginalVariable(variable),
              variable,
              binding.writable,
              binding.exports,
              options,
            ),
            makeDeadNode(variable),
          );
        }
      }
    } else {
      return next(strict, scope, escaped, variable, options);
    }
  };

export const makeReadExpression = compileMakeLookupNode(
  makeConditionalExpression,
  makeThrowDeadzoneExpression,
  drop_xxxx(makeRawReadExpression),
);

export const makeTypeofExpression = compileMakeLookupNode(
  makeConditionalExpression,
  makeThrowDeadzoneExpression,
  drop_xxxx(makeTypeofReadExpression),
);

export const makeDiscardExpression = compileMakeLookupNode(
  makeConditionalExpression,
  null,
  constant_____(makeLiteralExpression(false)),
);

export const makeWriteEffect = compileMakeLookupNode(
  makeConditionalEffect,
  makeThrowDeadzoneEffect,
  (variable, original_variable, writable, specifiers, options) => {
    if (writable) {
      return makeExportIncrementWriteEffect(variable, specifiers, options);
    } else {
      return makeExpressionEffect(
        makeThrowConstantExpression(original_variable),
      );
    }
  },
);
