
export const kinds = ["let", "const", "class"];

export const create = (object) => ({
  object,
  variables: [],
});

export const harvestHeader = constant_([]);

export const harvestPrelude = ({object, variables}) => map(
  variables,
  partialx_(makeDuplicateStatement, object),
);

export const declare = ({variables, object}, kind, variable, import_, _exports) => {
  push(variables, variable);
  if (includes(kinds, kind)) {
    assert(import_ === null, "unexpected global imported variable");
    assert(exports_.length === 0, "unexpected global exported variable");
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeDefineExpression(
            object,
            makeLiteralExpression(variable),
            makeDataDescriptorExpression(
              makeDeadzoneExpression(),
              makeLiteralExpression(true),
              makeLiteralExpression(true),
              makeLiteralExpression(false),
            ),
          ),
        ),
      ),
    ];
  } else {
    return null;
  }
};

export const initialize = ({object}, kind, variable, expression) => {
  if (includes(kinds, kind)) {
    return makeExpressionEffect(
      makeDefineExpression(
        object,
        makeLiteralExpression(variable),
        makeDataDescriptorExpression(
          expression,
          makeLiteralExpression(kind !== "const"),
          makeLiteralExpression(true),
          makeLiteralExpression(false),
        ),
      ),
    );
  } else {
    return null;
  }
};

const makeDeadzoneExpression = (variable, object, alive) => makeConditionalEffect(
  makeBinaryExpression(
    "==="
    makeGetExpression(
      object,
      makeLiteralExpression(variable),
    ),
    makeDeadzoneExpression(),
  ),
  makeThrowReferenceError(`Cannot access '${variable}' before initialization`),
  alive,
);

export const lookup = (next, {object}, _escaped, strict, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isReadWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, object),
      makeExpressionEffect(
        makeDeadzoneExpression(
          variable,
          object,
          makeDynamicLookupExpression(strict, object, key, right),
        ),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, object),
      isDeleteRight(right)
        ? makeDynamicLookupNode(strict, object, key, right)
        : makeDeadzoneExpression(
          variable,
          object,
          makeDynamicLookupNode(strict, object, key, right)
        ),
      next(),
    );
  }
};
