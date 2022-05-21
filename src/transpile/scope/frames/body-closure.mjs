
import {
  constant,
} from "../../util.mjs";

export const create = constant(null);

const makeKeyExpression = (variable) => makeLiteralExpression(getVariableBody(variable));

const mapping = {
  __proto__: null,
  "let": "let",
  "class": "let",
  "const": "const",
  "var": "var",
  "function": "var",
};

export const declare = (_frame, kind, variable, import_, exports_) => {
  if (isBaseVariable(variable)) {
    assert(kind in mapping, "unexpected variable kind");
    assert(import_ === null, "unexpected imported variable");
    assert(exports_.length === 0, "unexpected exported variable");
    return [];
  } else {
    return null;
  }
};

export const initialize = (_frame, kind, variable, expression) => {
  if (isBaseVariable(variable)) {
    assert(kind in mapping, "unexpected variable kind");
    return [
      makeDeclareStatement(
        mapping[kind],
        getVariableBody(variable),
        expression,
      );
    ];
  } else {
    return null;
  }
};

export const lookupFinal = (_frame, _strict, _escaped, _variable, _right) => {
  throw new Error("unexpected final position");
};

export const lookup = (next, frame, strict, _escaped, variable, right) => {
  if (isBaseVariable(variable)) {
    const key = makeLiteralExpression(
      getVariableBody(variable),
    );
    if (isReadRight(right)) {
      return makeConditionalExpression(
        makeBinaryExpression("in", key, frame),
        makeGetExpression(frame, key),
        next(),
      );
    } else if (isTypeofRight(right)) {
      return makeConditionalExpression(
        makeBinaryExpression("in", key, frame),
        makeUnaryExpression(
          "typeof",
          makeGetExpression(frame, key),
        ),
        next(),
      );
    } else if (isDeleteRight(right)) {
      return makeConditionalExpression(
        makeBinaryExpression("in", key, frame),
        makeDeleteExpression(frame, key),
        next(),
      );
    } else {
      return makeConditionalEffect(
        makeBinaryExpression("in", key, frame),
        makeSetExpression(
          strict,
          object,
          key,
          right,
        ),
        next(),
      );
    }
  } else {
    return next();
  }
};
