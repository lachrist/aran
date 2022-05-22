
export const kinds = ["let", "const", "class"];

export const create = (record) => ({
  record,
  variables: [],
});

export const harvestHeader = constant_([]);

export const harvestPrelude = ({record, variables}) => map(
  variables,
  partialx_(makeDuplicateStatement, record),
);

export const declare = ({variables, record}, kind, variable, import_, _exports) => {
  push(variables, variable);
  if (includes(kinds, kind)) {
    assert(import_ === null, "unexpected global imported variable");
    assert(exports_.length === 0, "unexpected global exported variable");
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeDefineExpression(
            record,
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

export const initialize = ({record}, kind, variable, expression) => {
  if (includes(kinds, kind)) {
    return makeExpressionEffect(
      makeDefineExpression(
        record,
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

const makeDeadzoneExpression = (variable, record, alive) => makeConditionalEffect(
  makeBinaryExpression(
    "==="
    makeGetExpression(
      record,
      makeLiteralExpression(variable),
    ),
    makeDeadzoneExpression(),
  ),
  makeThrowReferenceError(`Cannot access '${variable}' before initialization`),
  alive,
);

export const lookup = (next, {record}, _escaped, strict, variable, right) => {
  const key = makeLiteralExpression(variable);
  if (isReadWrite(right)) {
    return makeConditionalEffect(
      makeBinaryExpression("in", key, record),
      makeExpressionEffect(
        makeDeadzoneExpression(
          variable,
          record,
          makeDynamicLookupExpression(strict, record, key, right),
        ),
      ),
      next(),
    );
  } else {
    return makeConditionalExpression(
      makeBinaryExpression("in", key, record),
      isDeleteRight(right)
        ? makeDynamicLookupNode(strict, record, key, right)
        : makeDeadzoneExpression(
          variable,
          record,
          makeDynamicLookupNode(strict, record, key, right)
        ),
      next(),
    );
  }
};
