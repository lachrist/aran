import {
  makeSequenceEffect,
  makeExpressionEffect,
  makeImportExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import { makeThrowConstantExpression } from "../error.mjs";

const { Error } = globalThis;

export const makeBindingLookupNode = (
  _strict,
  { source, specifier },
  variable,
  _escaped,
  lookup,
) => {
  if (lookup.type === "read") {
    return makeImportExpression(source, specifier);
  } else if (lookup.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeImportExpression(source, specifier),
    );
  } else if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  } else if (lookup.type === "write") {
    const expression = makeThrowConstantExpression(variable);
    return lookup.pure
      ? expression
      : makeSequenceEffect(
          makeExpressionEffect(lookup.right),
          makeExpressionEffect(expression),
        );
  } else {
    throw new Error("invalid lookup type");
  }
};
