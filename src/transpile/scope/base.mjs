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

import {concat, map, reduce} from "array-lite";

import {
  assert,
  throwError,
  partial1,
  returnFirst,
  partial2,
  partial3,
} from "../../util.mjs";

import {
  makeSequenceEffect,
  makeDeclareStatement,
  makeExportEffect,
  makeImportExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalEffect,
  makeConditionalExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";

import {
  makeBinaryExpression,
  makeSetEffect,
  makeStrictSetExpression,
  makeGetExpression,
  makeHasExpression,
  makeSimpleObjectExpression,
  makeDefinePropertyExpression,
  makeDirectIntrinsicExpression,
  makeThrowSyntaxErrorExpression,
  makeThrowTypeErrorExpression,
} from "../intrinsic.mjs";

import {
  makeBasePropertyScope as makePropertyScope,
  lookupBaseScopeProperty as lookupScopeProperty,
  isBaseBound as isBound,
  isBaseStaticallyBound as isStaticallyBound,
  isBaseDynamicallyBound as isDynamicallyBound,
  getBaseBindingDynamicFrame as getBindingDynamicFrame,
  makeBaseDynamicScope as makeDynamicScope,
  declareBaseVariable as declareVariable,
  declareBaseGhostVariable as declareGhostVariable,
  makeBaseInitializeEffect as makeInitializeEffect,
  makeBaseLookupEffect as makeLookupEffect_,
  makeBaseLookupExpression as makeLookupExpression_,
} from "./split.mjs";

//////////////////
// DynamicFrame //
//////////////////

const generateMakeDynamicScope =
  (lookupable, declarable) => (parent, unscopable, object) =>
    makeDynamicScope(parent, {
      lookupable,
      declarable,
      unscopable,
      object,
    });

export const makeLookupableDynamicScope = generateMakeDynamicScope(true, false);

export const makeDeclarableDynamicScope = generateMakeDynamicScope(false, true);

//////////////
// Property //
//////////////

const STRICT = "strict";
const REIFIED = "reified";

export const initializeScope = (scope, reified) =>
  makePropertyScope(makePropertyScope(scope, REIFIED, reified), STRICT, false);

export const useStrictScope = (scope) => makePropertyScope(scope, STRICT, true);

export const isStrictScope = (scope) => lookupScopeProperty(scope, STRICT);

const isGlobalReified = (scope) => lookupScopeProperty(scope, REIFIED);

/////////////
// Prelude //
/////////////

export const makePreludeStatementArray = (scope, variable) => {
  if (!isBound(scope) && isGlobalReified(scope)) {
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeConditionalExpression(
            makeHasExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
            ),
            makeThrowSyntaxErrorExpression(
              `Identifier '${variable}' has already been declared`,
            ),
            makeLiteralExpression({undefined: null}),
          ),
        ),
      ),
    ];
  } else {
    return [];
  }
};

///////////
// Loose //
///////////

const makeExportUndefinedStatement = (specifier) =>
  makeEffectStatement(
    makeExportEffect(specifier, makeLiteralExpression({undefined: null})),
  );

export const makeLooseDeclareStatementArray = (scope, variable, specifiers) => {
  if (isStaticallyBound(scope)) {
    declareVariable(scope, variable, {
      writable: true,
      import: null,
      exports: specifiers,
    });
    return concat(
      [
        makeEffectStatement(
          makeInitializeEffect(
            scope,
            variable,
            makeLiteralExpression({undefined: null}),
          ),
        ),
      ],
      map(specifiers, makeExportUndefinedStatement),
    );
  } else if (isDynamicallyBound(scope)) {
    const {declarable, unscopable, object} = getBindingDynamicFrame(scope);
    assert(declarable, "expected declarable dynamic frame");
    assert(!unscopable, "unxpected unscopable dynamic frame");
    assert(
      specifiers.length === 0,
      "dynamically bound loose declaration should not be exported",
    );
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeConditionalExpression(
            makeHasExpression(object, makeLiteralExpression(variable)),
            makeLiteralExpression({undefined: null}),
            makeStrictSetExpression(
              object,
              makeLiteralExpression(variable),
              makeLiteralExpression({undefined: null}),
            ),
          ),
        ),
      ),
    ];
  } else {
    assert(
      specifiers.length === 0,
      "globally bound loose declaration should not be exported",
    );
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeConditionalExpression(
              makeHasExpression(
                makeDirectIntrinsicExpression("aran.globalObject"),
                makeLiteralExpression(variable),
              ),
              makeLiteralExpression({undefined: null}),
              makeDefinePropertyExpression(
                makeDirectIntrinsicExpression("aran.globalObject"),
                makeLiteralExpression(variable),
                makeSimpleObjectExpression(makeLiteralExpression(null), {
                  configurable: makeLiteralExpression(false),
                  enumerable: makeLiteralExpression(true),
                  writable: makeLiteralExpression(true),
                  value: makeLiteralExpression({undefined: null}),
                }),
              ),
            ),
          ),
        ),
      ];
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
    declareVariable(scope, variable, {
      writable,
      import: null,
      exports: specifiers,
    });
    return [];
  } else {
    assert(
      !isDynamicallyBound(scope),
      "rigid declaration should not be dynamically bound",
    );
    assert(
      specifiers.length === 0,
      "rigid global declaration should not be exported",
    );
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeStrictSetExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
              makeDirectIntrinsicExpression("aran.deadzone"),
            ),
          ),
        ),
      ];
    } else {
      return [];
    }
  }
};

const generateMakeSequenceExport =
  (duplicable_expression) => (effect, specifier) =>
    makeSequenceEffect(
      effect,
      makeExportEffect(specifier, duplicable_expression),
    );

const onInitializeLiveHit = partial1(throwError, "duplicate initialization");
const onInitializeDynamicFrame = partial1(
  throwError,
  "unexpected dynamic frame",
);
const onInitializeRoot = partial1(throwError, "unexpected root scope");
const generateOnInitializeDeadHit =
  (scope, variable, duplicable_expression) =>
  ({exports: specifiers}) =>
    reduce(
      specifiers,
      generateMakeSequenceExport(duplicable_expression),
      makeInitializeEffect(scope, variable, duplicable_expression),
    );

export const makeRigidInitializeStatementArray = (
  scope,
  variable,
  writable,
  duplicable_expression,
) => {
  if (isStaticallyBound(scope)) {
    return [
      makeEffectStatement(
        makeLookupEffect_(scope, variable, {
          onLiveHit: onInitializeLiveHit,
          onDeadHit: generateOnInitializeDeadHit(
            scope,
            variable,
            duplicable_expression,
          ),
          onDynamicFrame: onInitializeDynamicFrame,
          onRoot: onInitializeRoot,
        }),
      ),
    ];
  } else {
    assert(
      !isDynamicallyBound(scope),
      "rigid declaration should not be dynamically bound",
    );
    if (isGlobalReified(scope)) {
      if (writable) {
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeStrictSetExpression(
                makeDirectIntrinsicExpression("aran.globalRecord"),
                makeLiteralExpression(variable),
                duplicable_expression,
              ),
            ),
          ),
        ];
      } else {
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeDefinePropertyExpression(
                makeDirectIntrinsicExpression("aran.globalRecord"),
                makeLiteralExpression(variable),
                makeSimpleObjectExpression(makeLiteralExpression(null), {
                  writable: makeLiteralExpression(false),
                  value: duplicable_expression,
                }),
              ),
            ),
          ),
        ];
      }
    } else {
      return [
        makeDeclareStatement(
          writable ? "let" : "const",
          variable,
          duplicable_expression,
        ),
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
  declareGhostVariable(scope, variable, {
    writable: false,
    import: {source, specifier},
    exports: [],
  });
};

////////////
// Lookup //
////////////

const isSpecialVariable = (identifier) =>
  identifier === "this" ||
  identifier === "new.target" ||
  identifier === "import.meta";

const generateWrite = (write, specifiers) => (right) =>
  reduce(specifiers, generateMakeSequenceExport(right), write(right));

const makeConstantAssignmentEffect = (_right) =>
  makeExpressionEffect(
    makeThrowTypeErrorExpression("Assignment to constant variable"),
  );

const generateOnLiveHit =
  ({onLiveHit}) =>
  (read, write, {writable, import: import_, exports: specifiers}) => {
    assert(import_ === null, "initialized import declaration");
    return onLiveHit(
      read,
      writable
        ? generateWrite(write, specifiers)
        : makeConstantAssignmentEffect,
    );
  };

const generateOnDeadHit =
  ({onLiveHit, onDeadHit}) =>
  ({writable, import: import_}) => {
    if (import_ === null) {
      return onDeadHit();
    } else {
      assert(!writable, "writable import declaration");
      return onLiveHit(
        partial2(makeImportExpression, import_.source, import_.specifier),
        makeConstantAssignmentEffect,
      );
    }
  };

const generateOnRoot =
  (
    makeConditional,
    strict,
    key,
    reified,
    {onLiveHit, onDeadHit, onMiss, onGlobal},
  ) =>
  () => {
    if (reified) {
      return makeConditional(
        makeHasExpression(
          makeDirectIntrinsicExpression("aran.globalRecord"),
          key,
        ),
        makeConditional(
          makeBinaryExpression(
            "===",
            makeGetExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              key,
            ),
            makeDirectIntrinsicExpression("aran.deadzone"),
          ),
          onDeadHit(),
          onLiveHit(
            partial2(
              makeGetExpression,
              makeDirectIntrinsicExpression("aran.globalRecord"),
              key,
            ),
            partial3(
              makeSetEffect,
              true,
              makeDirectIntrinsicExpression("aran.globalRecord"),
              key,
            ),
          ),
        ),
        makeConditional(
          makeHasExpression(
            makeDirectIntrinsicExpression("aran.globalObject"),
            key,
          ),
          onLiveHit(
            partial2(
              makeGetExpression,
              makeDirectIntrinsicExpression("aran.globalObject"),
              key,
            ),
            partial3(
              makeSetEffect,
              strict,
              makeDirectIntrinsicExpression("aran.globalObject"),
              key,
            ),
          ),
          onMiss(),
        ),
      );
    } else {
      return onGlobal();
    }
  };

const generateOnDynamicFrame =
  (makeConditional, strict, key, {onLiveHit}) =>
  (node, {lookupable, unscopable, object}) => {
    if (lookupable) {
      if (unscopable) {
        return makeConditional(
          makeConditionalExpression(
            makeGetExpression(
              object,
              makeDirectIntrinsicExpression("Symbol.unscopables"),
            ),
            makeConditionalExpression(
              makeGetExpression(
                makeGetExpression(
                  object,
                  makeDirectIntrinsicExpression("Symbol.unscopables"),
                ),
                key,
              ),
              makeLiteralExpression(false),
              makeHasExpression(object, key),
            ),
            makeHasExpression(object, key),
          ),
          onLiveHit(
            partial2(makeGetExpression, object, key),
            partial3(makeSetEffect, strict, object, key),
          ),
          node,
        );
      } else {
        return makeConditional(
          makeHasExpression(object, key),
          onLiveHit(
            partial2(makeGetExpression, object, key),
            partial3(makeSetEffect, strict, object, key),
          ),
          node,
        );
      }
    } else {
      return node;
    }
  };

const generateMakeLookup =
  (makeLookup, makeConditional) => (scope, variable, callbacks) => {
    const key = makeLiteralExpression(variable);
    const strict = isStrictScope(scope);
    return makeLookup(scope, variable, {
      onLiveHit: generateOnLiveHit(callbacks),
      onDeadHit: generateOnDeadHit(callbacks),
      onRoot: generateOnRoot(
        makeConditional,
        strict,
        key,
        isGlobalReified(scope),
        callbacks,
      ),
      onDynamicFrame: isSpecialVariable(variable)
        ? returnFirst
        : generateOnDynamicFrame(makeConditional, strict, key, callbacks),
    });
  };

export const makeLookupEffect = generateMakeLookup(
  makeLookupEffect_,
  makeConditionalEffect,
);

export const makeLookupExpression = generateMakeLookup(
  makeLookupExpression_,
  makeConditionalExpression,
);
