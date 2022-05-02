
const GLOBAL_DYNAMIC_FRAME = null;

export const makeGlobalDynamicFrame = () => GLOBAL_DYNAMIC_FRAME;

export const makeDynamicFrame = (object, unscopables, deadzone) => ({
  object,
  unscopables,
  deadzone,
});

const makeDeadzoneConditionalExpression = (frame, variable, expression) => frame.deadzone
  ? makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeGetExpression(
        frame.object,
        makeLiteralExpression(variable),
      ),
      makeIntrinsicExpression("aran.deadzone"),
    ),
    makeThrowReferenceErrorExpression(`Cannot access '${variable}' before initialization`),
    expression,
  )
  : expression;

const makeScopableTestExpression = (frame, variable) => frame.unscopables
? makeConditional(
    makeGetExpression(
      frame.object,
      makeIntrinsicExpression("Symbol.unscopables"),
    ),
    makeConditional(
      makeGetExpression(
        makeGetExpression(
          frame.object,
          makeIntrinsicExpression("Symbol.unscopables"),
        ),
        makeLiteralExpression(variable),
      ),
      makeLiteralExpression(false),
      makeHasExpression(
        frame.object,
        makeLiteralExpression(variable),
      ),
    ),
    makeHasExpression(
      frame.object,
      makeLiteralExpression(variable),
    ),
  )
: makeHasExpression(
  frame.object,
  makeLiteralExpression(variable),
);

export const makeDynamicWriteEffect = (variable, right, frame, effect) => makeConditionalEffect(
  makeScopableTestExpression(frame, variable),
  makeDeadzoneConditionalExpression(
    frame,
    variable,
    makeExpressionEffect(
      makeStrictSetExpression(
        frame.object,
        makeLiteralExpression(variable),
        right,
      ),
    ),
  ),
  effect,
);

export const makeDynamicTypeofExpression = (variable, frame, expression) => makeConditionalExpression(
  makeScopableTestExpression(frame, variable),
  makeDeadzoneConditionalExpression(
    frame,
    variable,
    makeUnaryExpression(
      "typeof",
      makeGetExpression(
        frame.object,
        makeLiteralExpression(variable),
      ),
    ),
  ),
  expression,
);

export const makeDynamicTypeofExpression = (variable, frame, expression) => makeConditionalExpression(
  makeScopableTestExpression(frame, variable),
  makeDeadzoneConditionalExpression(
    frame,
    variable,
    makeGetExpression(
      frame.object,
      makeLiteralExpression(variable),
    ),
  ),
  expression,
);

export const makeDynamicTypeofExpression = (variable, frame, expression) => makeConditionalExpression(
  makeScopableTestExpression(frame, variable),
  makeDeleteExpression(
    frame.object,
    makeLiteralExpression(variable),
  ),
  expression,
);

const generate = (make, intrinsic) => (variable, frame, expression) => frame === GLOBAL_DYNAMIC_FRAME
  ? makeApplyExpression(
    makeIntrinsicExpression(intrinsic),
    makeLiteralExpression({undefined:null}),
    [
      makeLiteralExpression(variable),
    ],
  )
  : make(variable, frame, expression)

);
