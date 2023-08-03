import { reportLimitation } from "../../../limitation.mjs";
import {
  makeDeclareExternalStatement,
  makePrimitiveExpression,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
} from "../../../syntax.mjs";

import { StaticError } from "../../../util/index.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @template T
 * @type {listBindingInitializeStatement<ExternalBinding, T>}
 */
export const listBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  expression,
) => [makeDeclareExternalStatement(kind, variable, expression)];

/**
 * @template T
 * @type {makeBindingLookupNode<ExternalBinding, T>}
 */
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
    return makePrimitiveExpression(false);
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
    throw new StaticError("invalid lookup", lookup);
  }
};
