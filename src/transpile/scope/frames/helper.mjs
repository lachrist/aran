
export const makeDuplicateStatement = (expression, variable) => makeEffectStatement(
  makeExpressionEffect(
    makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makeLiteralExpression(variable),
        expression,
      ),
      makeThrowSyntaxError(`Identifier '${variable}' has already been declared`),
      makeLiteralExpression({undefined:null}),
    ),
  ),
);

const makeDynamicLookupExpression = (strict, object, key, right) => {
  if (isReadRight(right)) {
    return makeGetExpression(object, key);
  } else if (isTypeofRight(right)) {
    return makeUnaryExpression("typeof", makeGetExpression(object, key));
  } else if (isDeleteRight(right)) {
    return makeDeleteExpression(strict, object, key);
  } else {
    return makeSetExpression(strict, object, key, getRightExpression(right));
  }
};
