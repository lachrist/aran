
import {
  constant
} from "../../util.mjs";

const kinds = {
  __proto__: null,
  "let": "let",
  "class": "let",
  "const": "const",
  "var": "var",
  "function": "var",
};

export const create = constant(null);

export const declare = (_frame, _kind, _variable, import_, exports_) => {
  if (kind in kinds) {
    assert(import_ === null, "unexpected imported variable");
    assert(exports_.length === 0, "unexpected exported variable");
    return [];
  } else {
    return null;
  }
};

export const initialize = (_frame, kind, variable, expression) => {
  if (kinds in kinds) {
    return [makeDeclareStatement(kinds[kind], variable, expression)];
  } else {
    return null;
  }
};

export const lookup = (_next, _frame, strict, _escaped, variable, right) => {
  if (isReadRight(right)) {
    return makeGetGlobalExpression(makeLiteralExpression(variable));
  } else if (isTypeofRight(right)) {
    return makeTypeofGlobalExpression(makeLiteralExpression(variable));
  } else if (isDeleteRight(right)) {
    return makeDeleteGlobalExpression(strict, makeLiteralExpression(variable));
  } else {
    return makeExpressionEffect(
      makeSetGlobalExpression(
        strict,
        makeLiteralExpression(variable),
        getRightExpression(expression),
      ),
    );
  }
};
