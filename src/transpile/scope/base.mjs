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

import {assert, throwError, partial1, returnFirst} from "../../util.mjs";

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
  makeDeleteExpression,
  makeBinaryExpression,
  makeSetExpression,
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
  makeBaseLookupNode as makeLookupNode_,
} from "./split.mjs";

const {undefined} = globalThis;

export const READ = null;
export const DELETE = undefined;

const generateMakeConditional = (right) =>
  right === READ || right === DELETE
    ? makeConditionalExpression
    : makeConditionalEffect;

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

const generateMakeSequenceExport = (right) => (effect, specifier) =>
  makeSequenceEffect(effect, makeExportEffect(specifier, right));

const onInitializeLiveHit = partial1(throwError, "duplicate initialization");
const onInitializeDynamicFrame = partial1(
  throwError,
  "unexpected dynamic frame",
);
const onInitializeRoot = partial1(throwError, "unexpected root scope");
const generateOnInitializeDeadHit =
  (scope, variable, right) =>
  ({exports: specifiers}) =>
    reduce(
      specifiers,
      generateMakeSequenceExport(right),
      makeInitializeEffect(scope, variable, right),
    );

export const makeRigidInitializeStatementArray = (
  scope,
  variable,
  writable,
  right,
) => {
  if (isStaticallyBound(scope)) {
    return [
      makeEffectStatement(
        makeLookupNode_(scope, variable, right, {
          onLiveHit: onInitializeLiveHit,
          onDeadHit: generateOnInitializeDeadHit(scope, variable, right),
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
                right,
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
                  value: right,
                }),
              ),
            ),
          ),
        ];
      }
    } else {
      return [
        makeDeclareStatement(writable ? "let" : "const", variable, right),
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

const generateOnLiveHit =
  (right, {onLiveHit}) =>
  (node, {writable, import: import_, exports: specifiers}) => {
    assert(import_ === null, "initialized import declaration");
    if (right === DELETE) {
      return onLiveHit(makeLiteralExpression(true));
    } else if (right === READ) {
      return onLiveHit(node);
    } else if (!writable) {
      return onLiveHit(
        makeExpressionEffect(
          makeThrowTypeErrorExpression("Assignment to constant variable"),
        ),
      );
    } else {
      return onLiveHit(
        reduce(specifiers, generateMakeSequenceExport(right), node),
      );
    }
  };

const generateOnDeadHit =
  (right, {onLiveHit, onDeadHit}) =>
  ({writable, import: import_}) => {
    if (import_ === null) {
      return onDeadHit();
    } else if (right === READ) {
      return onLiveHit(makeImportExpression(import_.source, import_.specifier));
    } else if (right === DELETE) {
      return onLiveHit(makeLiteralExpression(true));
    } else {
      assert(!writable, "writable import declaration");
      return onLiveHit(
        makeExpressionEffect(
          makeThrowTypeErrorExpression("Assignment to constant variable"),
        ),
      );
    }
  };

const makeDynamicLookupNode = (strict, object, key, right) => {
  if (right === READ) {
    return makeGetExpression(object, key);
  } else if (right === DELETE) {
    return makeDeleteExpression(strict, object, key);
  } else {
    return makeExpressionEffect(makeSetExpression(strict, object, key, right));
  }
};

const generateOnRoot =
  (reified, strict, key, right, {onLiveHit, onDeadHit, onMiss, onGlobal}) =>
  () => {
    if (reified) {
      const makeConditional = generateMakeConditional(right);
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
            makeDynamicLookupNode(
              true,
              makeDirectIntrinsicExpression("aran.globalRecord"),
              key,
              right,
            ),
          ),
        ),
        makeConditional(
          makeHasExpression(
            makeDirectIntrinsicExpression("aran.globalObject"),
            key,
          ),
          onLiveHit(
            makeDynamicLookupNode(
              strict,
              makeDirectIntrinsicExpression("aran.globalObject"),
              key,
              right,
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
  (strict, key, right, {onLiveHit}) =>
  (node, {lookupable, unscopable, object}) => {
    const makeConditional = generateMakeConditional(right);
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
          onLiveHit(makeDynamicLookupNode(strict, object, key, right)),
          node,
        );
      } else {
        return makeConditional(
          makeHasExpression(object, key),
          onLiveHit(makeDynamicLookupNode(strict, object, key, right)),
          node,
        );
      }
    } else {
      return node;
    }
  };

export const makeLookupNode = (scope, variable, right, callbacks) => {
  const key = makeLiteralExpression(variable);
  const strict = isStrictScope(scope);
  return makeLookupNode_(scope, variable, right === DELETE ? READ : right, {
    onLiveHit: generateOnLiveHit(right, callbacks),
    onDeadHit: generateOnDeadHit(right, callbacks),
    onRoot: generateOnRoot(
      isGlobalReified(scope),
      strict,
      key,
      right,
      callbacks,
    ),
    onDynamicFrame: isSpecialVariable(variable)
      ? returnFirst
      : generateOnDynamicFrame(strict, key, right, callbacks),
  });
};
