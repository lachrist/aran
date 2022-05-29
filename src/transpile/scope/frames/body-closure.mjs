
import {
  constant,
} from "../../util.mjs";

const kinds = ["var", "function", "import"];

export const create = (layer, _options) => ({
  layer,
  variables: [],
});

export const harvest = ({variables}) => ({
  headers: variables,
  prelude: [],
});

export const makeExportUndefinedStatement = (eexport) => makeEffectStatement(
  makeExportEffect(eexport, makeLiteralExpression({undefined:null})),
);

export const declare = ({layer, variables}, kind, variable, import_, exports_) => {
  if (includes(kinds, kind)) {
    variable = `${layer}${variable}`;
    if (!includes(variables, variable)) {
      push(variables, variable);
    }
    if (kind === "import") {
      return concat(
        [
          makeEffectStatement(
            makeWriteEffect(variable, makeLiteralExpression({undefined:null})),
          ),
        ],
    } else {
      return concat(
        [
          makeEffectStatement(
            makeWriteEffect(variable, makeLiteralExpression({undefined:null})),
          ),
        ],
        map(eexports, makeExportUndefinedStatement),
      );
    }
  } else {
    return null;
  }
};

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
