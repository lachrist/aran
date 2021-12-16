
const SCRIPT = "@script";

const makeRootScope = () => null;

const extendScriptScope = (namespace) => ({
  __proto__: null,
  [SCRIPT]: namespace,
});

const extendScope = (parent, namespace) => ({
  __proto__: null,
  [SCRIPT]: null,
});

export const declareScopeVariable = (scope, variable, data, duplicable, initialized) => {
  const descriptor = getOwnPropertyDescriptor(scope, variable);
  if (descriptor === undefined) {
    defineProperty(
      scope,
      variable,
      {
        __proto__: null,
        configurable: true,
        enumerable: true,
        writable: true,
        value: {
          data,
          used: false,
          initialized,
        },
      },
    );
  } else {
    assert(duplicable, "duplicate variable declaration");
  }
};

const lookupScopeVariable = (scope, variable) => scope[variable].data;

const makeScopeInitializeEffect = (scope, variable, expression) => {
  const binding = scope[variable];
  assert(
    binding !== undefined,
    "missing variable",
  );
  assert(
    binding.used,
    "unused variable should not be initialized",
  );
  assert(
    !binding.initialized,
    "duplicate variable initialization",
  );
  binding.initialized = true;
  return makeScopeWriteEffect(scope, variable, expression);
};

const makeScopeWriteEffect = (scope, variable, expression) => {
  const binding = scope[variable];
  assert(binding !== undefined, "missing variable");
  binding.used = true;
  return binding.script === null
    ? makeWriteEffect(variable, expression)
    : makeExpressionEffect(
        makeApplyExpression(
        makeIntrinsicExpression("Reflect.set"),
        makePrimitiveExpression({undefined:null}),
        [
          makeReadEnclaveExpression(binding.script),
          makePrimitiveExpression(variable),
          expression,
        ]
      ),
    );
};

const makeScopeReadExpression = (scope, variable) => {
  const binding = scope[variable];
  assert(binding !== undefined, "missing variable");
  binding.used = true;
  return binding.script === null
    ? makeReadExpression(variable)
    : makeApplyExpression(
      makeIntrinsicExpression("Reflect.get"),
      makeLiteralExpression({undefined:null}),
      [
        makeReadEnclaveExpression(binding.script),
        makeLiteralExpression(variable),
      ],
    );
};

const isScopeVariableUsed = (scope, variable) => scope[variable].used;

const isScopeVariableInitialized = (scope, variable) => scope[variable].initialized;

const getUsedScopeVariableArray = (scope) => filter(
  ownKeys(scope),
  (variable) => variable !== SCRIPT && scope[variable].used
);
