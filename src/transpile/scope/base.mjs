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
  makeBasePropertyScope as makePropertyScope,
  lookupBaseScopeProperty as lookupScopeProperty,
  isBaseStaticallyBound as isStaticallyBound,
  isBaseDynamicallyBound as isDynamicallyBound,
  getBaseBindingDynamicExtrinsic as getBindingDynamicExtrinsic,
  declareBaseVariable as declareStaticVariable,
  declareBaseGhostVariable as declareStaticGhostVariable,
  makeBaseInitializeEffect as makeStaticInitializeEffect,
  makeBaseLookupEffect as makeStaticLookupEffect,
  makeBaseLookupExpre as makeStaticLookupExpression,
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

export {makeBaseDynamicScope as makeDynamicScope} from "./split.mjs";

export {
  makeEmptyDynamicFrame,
  makeLooseDynamicFrame,
  makeRigidDynamicFrame,
} from "./dynamic.mjs";

const {Symbol} = globalThis;

const isSpecialVariable = (identifier) =>
  identifier === "this" ||
  identifier === "new.target" ||
  identifier === "import.meta";

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

const makeDeadzoneExpression = (variable, {import: import_}) =>
  import_ === null
    ? makeThrowReferenceErrorExpression(
        `Cannot access '${variable}' before initialization`,
      )
    : makeImportExpression(import_.source, import_.specifier);

const makeDeadzoneEffect = (variable, note) =>
  makeExpressionEffect(makeDeadzoneExpression(variable, note));

//////////////
// Property //
//////////////

const REIFIED = "reified";
const STRICT = "strict";

export const initializeScope = (scope, reified) =>
  makePropertyScope(makePropertyScope(scope, STRICT, false), REIFIED, reified);

export const isGlobalScopeReified = partial_x(lookupScopeProperty, REIFIED);

export const useStrictScope = partial_xx(makePropertyScope, STRICT, true);

export const isStrictScope = partial_x(lookupScopeProperty, STRICT);

/////////////
// Prelude //
/////////////

export const makePreludeStatementArray = (scope, variable) => {
  if (isDynamicallyBound(scope)) {
    return flatMap(
      getBindingDynamicExtrinsic(scope),
      partial_x(makeDynamicPreludeStatementArray, variable),
    );
  } else {
    return [];
  }
};

///////////
// Loose //
///////////

export const makeLooseDeclareStatementArray = (scope, variable, specifiers) => {
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
      return flatMap(
        getBindingDynamicExtrinsic(scope),
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
      return flatMap(
        getBindingDynamicExtrinsic(scope),
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
      return flatMap(
        getBindingDynamicExtrinsic(scope),
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
  (scope, variable, right) => (expression, frames) =>
    reduce(
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

const generateMakeRootReadExpression = (scope, variable) => () =>
  isGlobalScopeReified(scope)
    ? makeThrowReferenceErrorExpression(`${variable} is not defined`)
    : makeGlobalReadExpression(variable);

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

const generateMakeRootTypeofExpression = (scope, variable) => () =>
  isGlobalScopeReified(scope)
    ? makeLiteralExpression("undefined")
    : makeGlobalTypeofExpression(variable);

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

const generateMakeRootDiscardExpression = (scope, variable) => () =>
  isGlobalScopeReified(scope)
    ? makeLiteralExpression(true)
    : makeGlobalDiscardExpression(isStrictScope(scope), variable);

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
