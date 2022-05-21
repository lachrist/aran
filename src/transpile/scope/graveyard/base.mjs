// Order of operations:
//
// const p = new Proxy({}, {
//   proto__: null,
//   defineProperty: (target, key, property) => (console.log("defineProperty " + String(key)), Reflect.defineProperty(target, key, property)),
//   getOwnPropertyDescriptor: (target, key) => (console.log("getOwnPropertyDescriptor " + String(key)), Reflect.getOwnPropertyDescriptor(target, key)),
//   getPrototypeOf: (target) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(target)),
//   setPrototypeOf: (target, prototype) => (console.log("setPrototypeOf"), Reflect.setPrototypeOf(target, prototype)),
//   deleteProperty: (target, key) => (console.log("deleteProperty " + String(key)), Reflect.deleteProperty(target, key)),
//   has: (target, key) => (console.log("has " + String(key)), Reflect.has(target, key)),
//   set: (target, key, value, receiver) => (console.log("set " + String(key)), Reflect.set(target, key, value, receiver)),
//   get: (target, key, receiver) => (console.log("set " + String(key)), Reflect.get(target, key, receiver)),
//   ownKeys: (target) => (console.log("ownKeys " + String(key)), Reflect.ownKeys(target)),
//   preventExtensions: (target) => (console.log("preventExtensions"), Reflect.preventExtensions(target))
// });
// with (p) { flat }
// has flat
// get Symbol(Symbol.unscopables)
// Thrown:
// ReferenceError: flat is not defined

import {concat, map, reduce, flatMap} from "array-lite";

import {
  assert,
  throwError,
  returnFirst,
  flip,
  throwAny,
  partialx,
  partialx_,
  partial_x,
  partial_xx,
  partialxx_,
  partial_xxx,
  partial_xxx_,
} from "../../util.mjs";

import {
  makeSequenceEffect,
  makeDeclareStatement,
  makeExportEffect,
  makeImportExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";

import {
  makeSetExpression,
  makeUnaryExpression,
  makeDirectIntrinsicExpression,
  makeThrowTypeErrorExpression,
  makeThrowReferenceErrorExpression,
  makeGlobalDiscardExpression,
  makeGlobalReadExpression,
  makeGlobalTypeofExpression,
  makeGlobalWriteExpression,
} from "../intrinsic.mjs";

import {
  READ as STATIC_READ,
  makeBaseDynamicScope as makeDynamicScope,
  makeBasePropertyScope as makePropertyScope,
  lookupBaseScopeProperty as lookupScopeProperty,
  isBaseStaticallyBound as isStaticallyBound,
  isBaseDynamicallyBound as isDynamicallyBound,
  getBaseBindingDynamicExtrinsic as getBindingDynamicExtrinsic,
  declareBaseVariable as declareStaticVariable,
  declareBaseGhostVariable as declareStaticGhostVariable,
  makeBaseInitializeEffect as makeStaticInitializeEffect,
  makeBaseLookupEffect as makeStaticLookupEffect,
  makeBaseLookupExpression as makeStaticLookupExpression,
  makeBaseLookupStatementArray as makeLookupStatementArray
} from "./split.mjs";

import {
  READ as READ_DYNAMIC,
  DISCARD as DISCARD_DYNAMIC,
  TYPEOF as TYPEOF_DYNAMIC,
  makePreludeStatementArray as makeDynamicPreludeStatementArray,
  makeLooseDeclareStatementArray as makeDynamicLooseDeclareStatementArray,
  makeRigidDeclareStatementArray as makeDynamicRigidDeclareStatementArray,
  makeRigidInitializeStatementArray as makeDynamicRigidInitializeStatementArray,
  makeLookupNode as makeDynamicLookupNode,
} from "./dynamic.mjs";

export {
  makeEmptyDynamicFrame,
  makeLooseDynamicFrame,
  makeRigidDynamicFrame,
} from "./dynamic.mjs";

const {Symbol, Reflect:{apply}, String:{prototype:{includes:includesString}}} = globalThis;

const META_PROPERTY_MARKER = ["."];

const isMetaPropertyVariable = (variable) => apply(includesString, variable, META_PROPERTY_MARKER);

export const isSpecialVariable = (variable) => variable === "this" || variable === "import" || isMetaPropertyVariable(variable);

const generateMakeSequenceExportEffect = (right) => (effect, specifier) =>
  makeSequenceEffect(effect, makeExportEffect(specifier, right));

const makeExportUndefinedStatement = (specifier) =>
  makeEffectStatement(
    makeExportEffect(specifier, makeLiteralExpression({undefined: null})),
  );

const throwUnexpectedStaticDeadHit = partialx(
  throwError,
  "unexpected dead hit",
);

const throwUnexpectedDynamicExtrinsic = partialx(
  throwError,
  "unexpected dynamic extrinsic",
);
const throwUnexpectedStaticMiss = partialx(throwError, "unexpected root scope");

const makeDeadzoneExpression = (variable, {import: import_}) => {
  if (import_ === null) {
    return makeThrowReferenceErrorExpression(
      `Cannot access '${variable}' before initialization`,
    );
  } else {
    return makeImportExpression(import_.source, import_.specifier);
  }
};

const makeDeadzoneEffect = (variable, note) =>
  makeExpressionEffect(makeDeadzoneExpression(variable, note));

//////////////
// Property //
//////////////

const ROOT = "root";
const STRICT = "strict";
const EARLY_SYNTAX_ERROR = "early-syntax-error";

const ENCLAVE_ROOT = null;
const REIFIED_GLOBAL_ROOT = true;
const NON_REIFIED_GLOBAL_ROOT = true;

export const initializeEnclaveScope = (scope) => {
  scope = makePropertyScope(scope, STRICT, false);
  scope = makePropertyScope(scope, EARLY_SYNTAX_ERROR, []);
  scope = makePropertyScope(scope, ROOT, ENCLAVE_ROOT);
  return scope;
};

export const restoreScope = (scope) => {
  scope = makePropertyScope(scope, EARLY_SYNTAX_ERROR, []);
  return scope;
};

export const initializeGlobalScope = (scope, frames) => {
  scope = makePropertyScope(scope, STRICT, false);
  scope = makePropertyScope(scope, EARLY_SYNTAX_ERROR, []);
  if (frames === null) {
    scope = makePropertyScope(scope, ROOT, NON_REIFIED_GLOBAL_ROOT);
  } else {
    scope = makePropertyScope(scope, ROOT, REIFIED_GLOBAL_ROOT);
    scope = makeDynamicScope(scope, frames);
  }
  return scope;
};

const getEarlySyntaxErrorMessageArray = partial_x(lookupScopeProperty, EARLY_SYNTAX_ERROR);

export const isRootScopeEnclave = (scope) => lookupScopeProperty(scope, ROOT) === ENCLAVE_ROOT;

export const isRootScopeReified = (scope) => {
  const root = lookupScopeProperty(scope, ROOT);
  assert(root !== ENCLAVE_ROOT, "only global scope should be query for reified");
  return root === REIFIED_GLOBAL_ROOT;
};

export const useStrictScope = partial_xx(makePropertyScope, STRICT, true);

export const isStrictScope = partial_x(lookupScopeProperty, STRICT);

///////////////////
// Dynamic Scope //
///////////////////

const makeDynamicScope = (scope, frames) => makeDynamicScope(scope, {frames, variables:[]});

const makeDynamicAllPreludeStatementArray = (frame, variables) => map(
  variables,
  partialx_(makeDynamicPreludeStatementArray, frame),
);

const makeDynamicStatementArray = (scope, statements) => {
  assert(isDynamicallyBound(scope), "expected dynamic scope");
  const {frames, variables} = getBindingDynamicExtrinsic(scope);
  return concat(
    return map(
      frames,
      partial_x(makeDynamicAllPreludeStatementArray, variables),
    ),
    statements,
  );
};

/////////////
// Special //
/////////////

export const makeSpecialDefineStatementArray = (scope, variable, expression) => {
  assert(isSpecialVariable(variable), "expected special variable");
  assert(isStaticallyBound(scope), "expected static scope for special variable declaration");
  declareStaticVariable(scope, variable, {
    writable: false,
    import: null,
    exports: [],
  });
  return [
    makeEffectStatement(
      makeStaticInitializeEffect(scope, variable, expression),
    ),
  ];
};

export const makeEarlySyntaxErrorExpression = (scope, variable) => {
  push(
    getEarlySyntaxErrorMessageArray(scope),
    `${variable} cannot appear in this context`,
  );
  return makeLiteralExpression("early-syntax-error-dummy");
};

export const makeReadSpecialExpression = (scope, variable) => {
  assert(isSpecialVariable(variable), "expected special variable");
  const callback = partialxx(makeEarlySyntaxErrorExpression, scope, variable);
  return makeStaticLookupExpression(scope, variable, STATIC_READ, {
    onStaticLiveHit: returnFirst,
    onStaticDeadHit: callback,
    onDynamicExtrinsic: returnFirst,
    onStaticMiss: callback,
  });
};

///////////
// Loose //
///////////

export const makeLooseDefineStatementArray = (scope, variable, specifiers) => {
  if (isStaticallyBound(scope)) {
    declareStaticVariable(scope, variable, {
      writable: true,
      import: null,
      exports: specifiers,
    });
    return concat(
      [
        makeEffectStatement(
          makeStaticInitializeEffect(
            scope,
            variable,
            makeLiteralExpression({undefined: null}),
          ),
        ),
      ],
      map(specifiers, makeExportUndefinedStatement),
    );
  } else {
    assert(
      !isSpecialVariable(variable),
      "unexpected special variable for non-static loose declaration",
    );
    assert(
      specifiers.length === 0,
      "loose declaration can only be exported statically",
    );
    if (isDynamicallyBound(scope)) {
      const {frames, variables} = getBindingDynamicExtrinsic(scope);
      push(variables, variable);
      return flatMap(
        frames,
        partial_x(makeDynamicLooseDeclareStatementArray, variable),
      );
    } else {
      return [
        makeDeclareStatement(
          "var",
          variable,
          makeLiteralExpression({undefined: null}),
        ),
      ];
    }
  }
};

///////////
// Rigid //
///////////

export const makeRigidDeclareStatementArray = (
  scope,
  variable,
  writable,
  specifiers,
) => {
  if (isStaticallyBound(scope)) {
    declareStaticVariable(scope, variable, {
      writable,
      import: null,
      exports: specifiers,
    });
    return [];
  } else {
    assert(
      !isSpecialVariable(variable),
      "unexpected special variable for non-static rigid declaration",
    );
    assert(
      specifiers.length === 0,
      "rigid declaration can only be exported statically",
    );
    if (isDynamicallyBound(scope)) {
      const {frames, variables} = getBindingDynamicExtrinsic(scope);
      push(variables, variable);
      return flatMap(
        frames,
        partial_x(makeDynamicRigidDeclareStatementArray, variable),
      );
    } else {
      return [];
    }
  }
};

const generateMakeInitializeExportEffect =
  (effect) =>
  (expression, {exports: specifiers}) =>
    reduce(specifiers, generateMakeSequenceExportEffect(expression), effect);

export const makeRigidInitializeStatementArray = (
  scope,
  variable,
  writable,
  expression,
) => {
  if (isStaticallyBound(scope)) {
    return [
      makeEffectStatement(
        makeStaticLookupEffect(scope, variable, STATIC_READ, {
          onStaticLiveHit: generateMakeInitializeExportEffect(
            makeStaticInitializeEffect(scope, variable, expression),
          ),
          onStaticDeadHit: throwUnexpectedStaticDeadHit,
          onDynamicExtrinsic: throwUnexpectedDynamicExtrinsic,
          onStaticMiss: throwUnexpectedStaticMiss,
        }),
      ),
    ];
  } else {
    assert(
      !isSpecialVariable(variable),
      "unexpected special variable for non-static rigid initialization",
    );
    if (isDynamicallyBound(scope)) {
      const {frames} = getBindingDynamicExtrinsic(scope);
      return flatMap(
        frames,
        partial_xxx(
          makeDynamicRigidInitializeStatementArray,
          variable,
          writable,
          expression,
        ),
      );
    } else {
      return [
        makeDeclareStatement(writable ? "let" : "const", variable, expression),
      ];
    }
  }
};

////////////
// Import //
////////////

export const declareImportVariable = (scope, variable, source, specifier) => {
  assert(
    isStaticallyBound(scope),
    "imported variables should be statically bound",
  );
  declareStaticGhostVariable(scope, variable, {
    writable: false,
    import: {source, specifier},
    exports: [],
  });
};

////////////
// Lookup //
////////////

const generateMakeDynamicLookupNode =
  (scope, variable, right) => isSpecialVariable(variable)
    : returnFirst
    ? (expression, frames) => reduce(
      frames,
      flip(
        partial_xxx_(
          makeDynamicLookupNode,
          isStrictScope(scope),
          variable,
          right,
        ),
      ),
      expression,
    );

//////////
// Read //
//////////

const generateMakeRootReadExpression = (scope, variable) => () => {
  if (isRootScopeEnclave(scope)) {
    return makeApplyExpression(
      makeReadExpression(scope, "scope.read"),
      makeLiteralExpression({undefined:null}),
      [makeLiteralExpression(variable)],
    );
  } else if (isRootScopeReified(scope)) {
    return makeThrowReferenceErrorExpression(`${variable} is not defined`);
  } else {
    return makeGlobalReadExpression(variable);
  }
};

export const makeReadExpression = (scope, variable) =>
  makeStaticLookupExpression(scope, variable, STATIC_READ, {
    onStaticLiveHit: returnFirst,
    onStaticDeadHit: partialx_(makeDeadzoneExpression, variable),
    onDynamicExtrinsic: generateMakeDynamicLookupNode(
      scope,
      variable,
      READ_DYNAMIC,
    ),
    onStaticMiss: generateMakeRootReadExpression(scope, variable),
  });

////////////
// Typeof //
////////////

const makeLiveTypeofExpression = partialx_(makeUnaryExpression, "typeof");

const generateMakeRootTypeofExpression = (scope, variable) => () => {
  if (isRootScopeEnclave(scope)) {
    return makeApplyExpression(
      makeReadExpression(scope, "scope.typeof"),
      makeLiteralExpression({undefined:null}),
      [makeLiteralExpression(variable)],
    );
  } else if (isRootScopeReified(scope)) {
    return makeLiteralExpression("undefined");
  } else {
    return makeGlobalTypeofExpression(variable);
  }
};

export const makeTypeofExpression = (scope, variable) =>
  makeStaticLookupExpression(scope, variable, STATIC_READ, {
    onStaticLiveHit: makeLiveTypeofExpression,
    onStaticDeadHit: partialx_(makeDeadzoneExpression, variable),
    onDynamicExtrinsic: generateMakeDynamicLookupNode(
      scope,
      variable,
      TYPEOF_DYNAMIC,
    ),
    onStaticMiss: generateMakeRootTypeofExpression(scope, variable),
  });

/////////////
// Discard //
/////////////

export const generateMakeStaticDiscardExpression = (scope) => () =>
  isStrictScope(scope)
    ? // This should never happen in practice because deleting
      // an unqualified identifier is not allowed in strict mode.
      // Nonetheless we leave it for consistency reason.
      makeThrowTypeErrorExpression("Cannot delete variable")
    : makeLiteralExpression(false);

const generateMakeRootDiscardExpression = (scope, variable) => () => {
  if (isRootScopeEnclave(scope)) {
    return makeApplyExpression(
      makeReadExpression(
        scope,
        isStrictScope(scope) ? "scope.deleteStrict" : "scope.deleteSloppy",
      ),
      makeLiteralExpression({undefined:null}),
      [makeLiteralExpression(variable)],
    );
  } else if (isRootScopeReified(scope)) {
    return makeLiteralExpression(true);
  } else {
    return makeGlobalDiscardExpression(isStrictScope(scope), variable);
  }
};

export const makeDiscardExpression = (scope, variable) =>
  makeStaticLookupExpression(scope, variable, STATIC_READ, {
    onStaticLiveHit: generateMakeStaticDiscardExpression(scope),
    onStaticDeadHit: generateMakeStaticDiscardExpression(scope),
    onDynamicExtrinsic: generateMakeDynamicLookupNode(
      scope,
      variable,
      DISCARD_DYNAMIC,
    ),
    onStaticMiss: generateMakeRootDiscardExpression(scope, variable),
  });

///////////
// Write //
///////////

const generateMakeRootWriteEffect = (scope, variable) => () => {
  if (isRootScopeEnclave(scope)) {
    return makeExpressionEffect(
      makeApplyExpression(
        makeReadExpression(
          scope,
          isStrictScope(scope) ? "scope.writeStrict" : "scope.writeSloppy",
        ),
        makeLiteralExpression({undefined:null}),
        [makeLiteralExpression(variable)],
      ),
    );
  } else if (isRootScopeReified(scope)) {
    if (isStrictScope(scope)) {
      return makeThrowTypeErrorExpression(`${variable} is not defined`)
    } else {
      return makeSetExpression(
        true,
        makeDirectIntrinsicExpression("aran.globalObject"),
        variable,
        pure,
      );
    }
  } else {
    return makeGlobalWriteExpression(isStrictScope(scope), variable, pure),
  }
};


const generateMakeWriteRootEffect = (scope, variable, pure) => () =>
  makeExpressionEffect(
    isGlobalScopeReified(scope)
      ? isStrictScope(scope)
        ? makeThrowTypeErrorExpression(`${variable} is not defined`)
        : makeSetExpression(
            true,
            makeDirectIntrinsicExpression("aran.globalObject"),
            variable,
            pure,
          )
      : makeGlobalWriteExpression(isStrictScope(scope), variable, pure),
  );

const generateMakeWriteLiveHitEffect =
  (pure) =>
  (effect, {writable, exports: specifiers}) =>
    writable
      ? reduce(specifiers, generateMakeSequenceExportEffect(pure), effect)
      : makeExpressionEffect(
          makeThrowTypeErrorExpression("Assignment to constant variable"),
        );

export const makeWriteExpression = (scope, variable, pure) =>
  makeStaticLookupEffect(scope, variable, pure, {
    onStaticLiveHit: generateMakeWriteLiveHitEffect(pure),
    onStaticDeadHit: partialx_(makeDeadzoneEffect, variable),
    onDynamicExtrinsic: generateMakeDynamicLookupNode(scope, variable, pure),
    onStaticMiss: generateMakeWriteRootEffect(scope, variable, pure),
  });

//////////////////
// Static Write //
//////////////////

// This is sometimes usefull to avoid storing values in meta variables.

const DYNAMIC = Symbol("complex");

const throwDynamic = partialx(throwAny, DYNAMIC);

const generateMakeImpureWriteEffect =
  (scope, variable, expression) =>
  (effect, {writable, exports: specifiers}) => {
    if (writable) {
      // If this lookup succeed, we can assume that
      // makeLookupNode(scope, variable, READ) will
      // simply be an identifier read.
      return reduce(
        specifiers,
        generateMakeSequenceExportEffect(
          makeStaticLookupExpression(scope, variable, STATIC_READ, {
            onStaticDeadHit: throwUnexpectedStaticDeadHit,
            onStaticLiveHit: returnFirst,
            onStaticMiss: throwUnexpectedStaticMiss,
            // NB: this onDynamicExtrinsic be cause throwDynamic by parent call
            onDynamicExtrinsic: returnFirst,
          }),
        ),
        effect,
      );
    } else {
      return makeSequenceEffect(
        makeExpressionEffect(expression),
        makeExpressionEffect(
          makeThrowTypeErrorExpression("Assignment to constant variable"),
        ),
      );
    }
  };

const makeImpureDeadzoneEffect = (expression, variable, note) =>
  makeSequenceEffect(
    makeExpressionEffect(expression),
    makeDeadzoneEffect(variable, note),
  );

export const makeStaticWriteEffect = (scope, variable, expression) => {
  try {
    return makeStaticLookupEffect(scope, variable, expression, {
      onStaticLiveHit: generateMakeImpureWriteEffect(scope, variable),
      onStaticDeadHit: partialxx_(
        makeImpureDeadzoneEffect,
        expression,
        variable,
      ),
      onStaticMiss: throwDynamic,
      onDynamicExtrinsic: throwDynamic,
    });
  } catch (error) {
    if (error === DYNAMIC) {
      return null;
    } else {
      throw error;
    }
  }
};
