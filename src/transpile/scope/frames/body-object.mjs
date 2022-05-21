
const kinds = ["var", "function"];

export const create = () => ({
  object,
  variables,
});

export const harvest = constant_({prelude:[], header: []});

export const declare = ({object}, kind, variable, _import, _exports) => {
  if (includes(kinds, kind)) {
    assert(import_ === null, "unexpected global imported variable");
    assert(exports_.length === 0, "unexpected global exported variable");
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makeLiteralExpression(variable),
              object,
            ),
            makeLiteralExpression({undefined:null}),
            makeDefineExpression(
              object,
              makeLiteralExpression(variable),
              makeDataDescriptorExpression(
                makeLiteralExpression({undefined:null}),
                makeLiteralExpression(true),
                makeLiteralExpression(true),
                makeLiteralExpression(false),
              ),
            ),
          ),
        ),
      ),
    ];
  } else {
    push(variables, variable);
    return null;
  }
};

export const initialize = ({object}, _kind, variable, expression) => {
  if (includes(kinds, kind)) {
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeSetSloppyExpression(
            object,
            makeLiteralExpression(variable),
            expression,
          ),
        ),
      ),
    ];
  } else {
    return null;
  }
};

export const lookup = (next, {object}, _escaped, strict, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isRightWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, object),
      makeExpressionEffect(
        makeDeadzoneExpression(
          variable,
          object,
          makeDynamicLookupNode(strict, object, key, right)
        ),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, object),
      makeLookupExpression(object, key, right),
      next(),
    );
  }
};
