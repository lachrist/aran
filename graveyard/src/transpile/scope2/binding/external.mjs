import {
  makeLiteralExpression,
  makeDeclareExternalStatement,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
} from "../../../ast/index.mjs";

import { reportLimitation } from "../../../limitation.mjs";

const {
  Error,
  JSON: { stringify: stringifyJSON },
} = globalThis;

// export const makeBinding = ({ kind }) => ({ type: "external", kind });

export const generateBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  expression,
) => [makeDeclareExternalStatement(kind, variable, expression)];

export const makeBindingLookupNode = (
  strict,
  _binding,
  variable,
  _escaped,
  lookup,
) => {
  if (lookup.type === "read") {
    return makeReadExternalExpression(variable);
  } else if (lookup.type === "typeof") {
    return makeTypeofExternalExpression(variable);
  } else if (lookup.type === "discard") {
    reportLimitation(
      `ignoring external variable deletion ${stringifyJSON(variable)}`,
    );
    return makeLiteralExpression(false);
  } else if (lookup.type === "write") {
    if (!strict) {
      reportLimitation(
        `turning strict sloppy external variable assignment ${stringifyJSON(
          variable,
        )}`,
      );
    }
    return makeWriteExternalEffect(variable, lookup.right);
  } else {
    throw new Error("invalid lookup type");
  }
};
