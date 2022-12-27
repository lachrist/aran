import {
  constant_,
  constant___,
  assert,
  incrementCounter,
} from "../../../util/index.mjs";

import {
  makeApplyExpression,
  makeLiteralExpression,
  makeExpressionEffect,
  makeDeclareExternalStatement,
} from "../../../ast/index.mjs";

const { undefined } = globalThis;

export const KINDS = ["var", "function", "let", "const", "class"];

const mapping = {
  var: "var",
  function: "var",
  let: "let",
  const: "const",
  class: "let",
};

export const create = ({ macros }) => ({
  enclaves: macros,
});

export const conflict = constant_(undefined);

export const harvestHeader = constant_([]);

export const harvestPrelude = constant_([]);

export const declare = (
  _strict,
  _frame,
  _kind,
  _variable,
  { exports: specifiers },
) => {
  assert(specifiers.length === 0, "unexpected exported variable");
};

export const makeInitializeStatementArray = (
  _strict,
  _frame,
  kind,
  variable,
  expression,
) => [makeDeclareExternalStatement(mapping[kind], variable, expression)];

export const lookupAll = constant___(undefined);

export const generateMakeLookupExpression =
  (strict_key, sloppy_key) =>
  (_next, strict, _escaped, { enclaves }, variable, _options) =>
    makeApplyExpression(
      enclaves[strict ? strict_key : sloppy_key],
      makeLiteralExpression({ undefined: null }),
      [makeLiteralExpression(variable)],
    );

export const makeReadExpression = generateMakeLookupExpression("read", "read");

export const makeTypeofExpression = generateMakeLookupExpression(
  "typeof",
  "typeof",
);

export const makeDiscardExpression = generateMakeLookupExpression(
  "discardStrict",
  "discardSloppy",
);

export const makeWriteEffect = (
  _next,
  strict,
  _escaped,
  { enclaves },
  variable,
  { counter, expression },
) => {
  incrementCounter(counter);
  return makeExpressionEffect(
    makeApplyExpression(
      enclaves[strict ? "writeStrict" : "writeSloppy"],
      makeLiteralExpression({ undefined: null }),
      [makeLiteralExpression(variable), expression],
    ),
  );
};
