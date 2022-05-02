"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");
const Meta = require("./layer-3-meta.js");
const Variable = require("../../variable.js");

// type DynamicFrame = (ObjectBox, UnscopablesBox)
// type ObjectBox = Box
// type UnscopablesBox = Maybe Box

// type MetaCallbacks = .outer.Callbacks
// type RegularContext = (Scope, Identifier, Callbacks)
// type Callbacks = (OnMiss, OnLiveHit, OnDeadHit, OnDynamicHit)
// type OnMiss = Scope -> Identifier -> Right -> AranExpression
// type OnLiveHit = Scope -> Identifier -> Right -> Tag -> Access -> AranExpression
// type OnDeadHit = Scope -> Identifier -> Right -> Tag -> AranExpression
// type OnDynamicHit = Scope -> Identifier -> Right -> Box -> AranExpression
// type Right = *

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

//////////////////
// DynamicFrame //
//////////////////

export const makeDynamicFrame = (unscopable, declarative, object) => ({
  unscopable,
  lookupable,
  declarable,
  object,
});

//////////////
// Property //
//////////////

const STRICT = "strict";
const REIFIED = "reified";

export const initializeScope = (scope, reified) => makePropertyScope(
  makePropertyScope(scope, REIFIED, reified),
  STRICT,
  false,
);

export const useStrictScope = (scope) => makePropertyScope(
  scope,
  STRICT,
  true,
);

/////////////
// Prelude //
/////////////

export const makePreludeStatementArray = (scope, variable) => {
  if (!isBound(scope) && lookupScopeProperty(scope, REIFIED)) {
    return makeCheckStatementArray(
      makeDirectIntrinsicExpression("aran.globalRecord"),
      variable,
    );
  } else {
    return [];
  }
};

///////////
// Loose //
///////////

const makeExportUndefinedStatement = (specifier) => [
  makeEffectStatement(
    makeExportEffect(
      specifier,
      makeLiteralExpression({undefined:null}),
    ),
  ),
];

const makeLooseDynamicDeclareEffect = (object, variable) => makeExpressionEffect(
  makeConditionalExpression(
    makeHasPropertyExpression(
      object,
      makeLiteralExpression(variable),
    ),
    makeLiteralExpression({undefined:null}),
    makeDefinePropertyExpression(
      object,
      makeLiteralExpression(variable),
      {
        writable: true,
        configurable: false,
        enumerable: true,
        value: makeLiteralExpression({undefined:null}),
      },
    ),
  ),
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
            makeLiteralExpression({undefined:null}),
          ),
        ),
      ],
      map(specifiers, makeExportUndefinedStatement),
    );
  } else if (isDynamicallyBound(scope)) {
    const frame = getBindingDynamicFrame(scope);
    assert(frame.declarable, "expected declarative dynamic frame");
    assert(!frame.unscopable, "unxpected unscopable dynamic frame");
    assert(specifiers.length === 0, "dynamically bound loose declaration should not be exported");
    return [
      makeEffectStatement(
        makeLooseDynamicDeclareEffect(
          frame.object,
          variable,
        ),
      );
    ];
  } else {
    assert(specifiers.length === 0, "globally bound loose declaration should not be exported");
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeLooseDynamicDeclareEffect(
            makeDirectIntrinsicExpression("aran.globalObject"),
            variable,
          ),
        );
      ];
    } else {
      return [
        makeDeclareStatement(
          "var",
          variable,
          makeLiteralExpression({undefined:null}),
        ),
      ];
    }
  }
};

///////////
// Rigid //
///////////

export const makeRigidDeclareStatementArray = (scope, variable, writable, specifiers) => {
  if (isStaticallyBound(scope)) {
    declareVariable(scope, variable, {
      writable,
      import: null,
      exports: specifiers,
    });
    return [];
  } else {
    assert(!isDynamicallyBound(scope), "rigid declaration should not be dynamically bound");
    assert(exports_.length === 0, "rigid global declaration should not be exported");
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeDefinePropertyExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
              {
                writable,
                configurable: true,
                enumerable: false,
                value: makeDirectIntrinsicExpression("aran.deadzone"),
              },
            ),
          ),
        ),
      ];
    } else {
      return [];
    }
  }
};

const generateMakeSequenceExport = (duplicable_expression) => (effect, specifier) => makeSequenceEffect(
  effect,
  makeExportEffect(specifier, duplicable_expression),
);

const onInitializeLiveHit = partial1(throwError, "duplicate initialization");
const onInitializeDynamicFrame = partial1(throwError, "unexpected dynamic frame");
const onInitializeRoot = partial1(throwError, "unexpected root scope");
const generateOnInitializeDeadHit = (scope, variable, duplicable_expression) => ({exports:specifiers}) => reduce(
  specifiers,
  generateMakeSequenceExport(duplicable_expression),
  makeInitializeEffect(
    scope,
    variable,
    duplicable_expression,
  ),
);

export const makeRigidInitializeStatementArray = (scope, variable, writable, duplicable_expression) => {
  if (isStaticallyBound(scope)) {
    return [
      makeEffectStatement(
        makeLookupEffect(
          scope,
          variable,
          {
            onLiveHit: onInitializeLiveHit,
            onDeadHit: generateOnInitializeDeadHit(scope, variable, duplicable_expression),
            onDynamicFrame: onInitializeDynamicFrame,
            onRoot: onInitializeRoot,
          },
        ),
      ),
    ];
  } else {
    assert(!isDynamicallyBound(scope), "rigid declaration should not be dynamically bound");
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeDefinePropertyExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
              {
                writable,
                configurable: false,
                enumerable: false,
                value: duplicable_expression,
              },
            ),
          ),
        ),
      ];
    } else {
      return [
        makeDeclareStatement(
          writable ? "let" : "const",
          variable,
          duplicable_expression,
        );
      ]
    }
  }
};

////////////
// Import //
////////////

export const declareImportedVariable = (scope, variable, source, specifier) => {
  assert(isStaticallyBound(scope), "imported variables should be statically bound");
  declareVariable(
    scope,
    variable,
    {
      writable: false,
      import: {source, specifier},
      exports: [],
    },
  );
};

////////////
// Lookup //
////////////

const makeLookupExpression = (scope, ) =>

const generateLookup = (makeLookupNode) => (scope, variable)


////////////
// lookup //
////////////

const makeWrite = generate({
  onStrictDynamicHit: (object) => makeEffectExpression(
    makeSetStrictExpression(object, makeLiteralExpression(variable), right),
  ),
  onSloppyDynamicHit: (object) => makeEffectExpression(
    makeSetSloppyExpression(object, makeLiteralExpression(variable), right),
  ),
  onStrictMiss: () => makeEffectExpression(
    makeThrowReferenceErrorExpression(`${variable} is not defined`),
  ),
  onSloppyMiss: () => makeEffectExpression(
    makeSetStrictExpression(
      makeDirectIntrinsicExpression("aran.globalObject"),
      makeLiteralExpression(variable),
      right,
    ),
  ),
  onStrictGlobal: () => makeEffectStatement(
    makeSetStrictGlobal(
      makeLiteralExpression(variable),
      right,
    ),
  ),
  onSloppyGlobal: () => makeEffectStatement(
    makeSetStrictGlobal(
      makeLiteralExpression(variable),
      right,
    ),
  ),
  onLiveHit: (read, write, {writable}) => writable
    ? write(right)
    : makeThrowTypeErrorExpression("Assignment to constant variable"),
  onDeadHit: (_note) => makeThrowReferenceErrorExpression(`Cannot access '${variable}' before initialization`),
});

const dummy_note = {writable:true, import:null, exports:[]};

export const makeLookupEffect = (makeLookup, makeConditional) => (scope, variable, {onLiveHit, onDeadHit, onMiss}) => makeLookup(
  scope,
  variable,
  {
    onLiveHit,
    onDeadHit,
    onRoot: () => {
      if (isGlobalReified(scope)) {
        return makeConditional(
          makeHasExpression(
            makeDirectIntrinsicExpression("aran.globalRecord"),
            makeLiteralExpression(variable),
          ),
          makeConditional(
            makeBinaryExpression(
              "===",
              makeGetExpression(
                makeDirectIntrinsicExpression("aran.globalRecord"),
                makeLiteralExpression(variable),
              ),
              makeDirectIntrinsicExpression("aran.deadzone"),
            ),
            onDeadHit(dummy_note),
            onStrictDynamicHit(makeDirectIntrinsicExpression("aran.globalRecord")),
          ),
          makeConditional(
            makeHasExpression(
              makeDirectIntrinsicExpression("aran.globalObject"),
              makeLiteralExpression(variable),
            ),
            lookupScopeProperty(scope, STRICT)
              ? onStrictDynamicHit(makeDirectIntrinsicExpression("aran.globalObject"))
              : onSloppyDynamicHit(makeDirectIntrinsicExpression("aran.globalObject")),
            lookupScopeProperty(scope, STRICT)
              ? onStrictMiss()
              : onSloppyMiss()
          ),
        );
      } else {
        return lookupScopeProperty(scope, STRICT)
          ? onStrictGlobal()
          : onSloppyGlobal();
      }
    },
    onDynamicFrame: (node, frame) => {
      if (frame.lookupable) {
        if (frame.unscopable) {

        } else {

        }
      } else {
        return node;
      }
    },
  },
);




const isSpecialIdentifier = (identifier) => (
  identifier === "this" ||
  identifier === "new.target" ||
  identifier === "import.meta");

const lookup_callback_prototype = {
  onMiss () { return this.callbacks.onMiss(); },
  onStaticLiveHit (data, read, write) { return this.callbacks.onStaticLiveHit(
    read,
    (box) => (
      data.writable ?
      // console.assert(data.import === null)
      updateExport(this.scope, data.exports, box, write) :
      Intrinsic.makeThrowTypeErrorExpression(`Assignment to constant variable`))); },
  onStaticDeadHit (data) { return this.callbacks.onStaticDeadHit(); },
  onDynamicFrame (frame, expression3, _expression1, _expression2) { return (
    isSpecialIdentifier(this.identifier) ?
    expression3 :
    (
      _expression1 = Intrinsic.makeHasExpression(
        Meta.makeOpenExpression(this.scope, frame.box),
        Tree.PrimitiveExpression(this.identifier)),
      _expression1 = (
        frame.unscopables ?
        Tree.ConditionalExpression(
          _expression1,
          Meta.makeBoxExpression(
            this.scope,
            false,
            "ScopeBaseUnscopables",
            Intrinsic.makeGetExpression(
              Meta.makeOpenExpression(this.scope, frame.box),
              Intrinsic.makeGrabExpression("Symbol.unscopables"),
              null),
            (box) => Tree.ConditionalExpression(
              Tree.ConditionalExpression(
                Tree.BinaryExpression(
                  "===",
                  Tree.UnaryExpression(
                    "typeof",
                    Meta.makeOpenExpression(this.scope, box)),
                  Tree.PrimitiveExpression("object")),
                Meta.makeOpenExpression(this.scope, box),
                Tree.BinaryExpression(
                  "===",
                  Tree.UnaryExpression(
                    "typeof",
                    Meta.makeOpenExpression(this.scope, box)),
                  Tree.PrimitiveExpression("function"))),
              Tree.UnaryExpression(
                "!",
                Intrinsic.makeGetExpression(
                  Meta.makeOpenExpression(this.scope, box),
                  Tree.PrimitiveExpression(this.identifier),
                  null)),
              Tree.PrimitiveExpression(true))),
          Tree.PrimitiveExpression(false)) :
        _expression1),
      _expression2 = this.callbacks.onDynamicLiveHit(frame.data, frame.box),
      _expression2 = (
        frame.deadzone ?
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Intrinsic.makeGetExpression(
              Meta.makeOpenExpression(this.scope, frame.box),
              Tree.PrimitiveExpression(this.identifier),
              null),
            Intrinsic.makeGrabExpression("aran.deadzoneMarker")),
          this.callbacks.onDynamicDeadHit(frame.data, frame.box),
          _expression2) :
        _expression2),
      Tree.ConditionalExpression(_expression1, _expression2, expression3))); }};

exports.makeLookupExpression = (scope, identifier, callbacks) => Meta.makeLookupExpression(
  scope,
  identifier,
  {
    __proto__: lookup_callback_prototype,
    scope,
    identifier,
    callbacks});
















//////////////////
// DynamicScope //
//////////////////

const generateMakeBaseDynamicScope = (makeBaseDynamicScope, deadzone, unscopables) => (scope, object) => makeBaseDynamicScope(
  scope,
  {
    object,
    deadzone,
    unscopables,
  },
);

export const makeRigidBaseDynamicScope = generateMakeBaseDynamicScope(
  makeRigidBaseDynamicScope,
  true,
  false,
);

export const makeLooseBaseDynamicScope = generateMakeBaseDynamicScope(
  makeLooseBaseDynamicScope,
  false,
  false,
);

export const makeBaseDynamicScope = generateMakeBaseDynamicScope(
  makeBaseDynamicScope,
  false,
  true,
);

/////////////
// Declare //
/////////////

const sequenceUndefinedExport = (effect, specifier) => makeSequenceEffect(
  effect,
  makeEffectStatement(
    makeExportEffect(
      specifier,
      makeLiteralExpression({undefined:null}),
    ),
  ),
);

const writeUndefined = (write, _note) => write(makeLiteralExpression({undefined:null}));

const throwUnexpectedDynamicFrame = partial1(throwError, "unexpected dynamic frame");

/////////////
// Prelude //
/////////////

const makeCheckStatementArray = (object, variable) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeHasOwnPropertyExpression(
          object,
          makeLiteralExpression(variable),
        ),
        makeThrowSyntaxErrorExpression(
          `Identifier '${variable}' has already been declared`
        ),
        makeLiteralExpression({undefined:null})
      ),
    ),
  ),
];

const makeRigidStatementArray = (object, variable, writable) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeDefinePropertyExpression(
        object,
        makeLiteralExpression(variable),
        {
          writable,
          configurable: true,
          enumerable: false,
          value: makeDirectIntrinsicExpression("aran.deadzone"),
        },
      ),
    ),
  ),
];



export const makeDeclareStatementArray = (scope, kind, variable, import_, exports_) => {
  if (isStaticallyBound(scope)) {
    declareVariable(scope, variable, {
      writable: isWritable(kind),
      import: import_,
      exports: exports_,
    });
    if (isDuplicable(kind)) {
      return [
        makeEffectStatement(
          makeInitializeEffect(
            scope,
            variable,
            makeLiteralExpression({undefined:null}),
          ),
        ),
      ];
    } else {
      return [];
    }
  } else if (isDynamicallyBound(scope)) {
    const frame = getBindingDynamicFrame(scope);
    assert(frame.type === DECLARATIVE, "expected a declarative dynamic frame");§
    assert(import_ === null, "imported variable should not be dynamically bound");
    assert(exports_.length === 0, "exported variable shoult not be dynamically bound");
    assert(duplicable, "only duplicable variables should be dynamically bound");
    return makeLooseStatementArray(
      frame.object,
      variable,
      isWritable(kind),
    );
  } else {
    if (isGlobalReified(scope)) {
      if (isDuplicable(kind)) {
        return makeLooseStatementArray(
          makeDirectIntrinsicExpression("aran.globalObject"),
          variable,
          isWritable(kind),
        );
      } else {
        return makeRigidStatementArray(
          makeDirectIntrinsicExpression("aran.globalRecord"),
          variable,
          isWritable(kind),
        );
      }
    } else {
      if (isDuplicable(kind)) {
        return [
          makeDeclareStatement(
            "var",
            variable,
            make
        ]
      } else {
        return [];
      }
    }
  }
};

export const makeInitializeStatementArray = (scope, kind, variable, duplicable_expression) => {
  assert(!isDuplicable(kind), "only rigid variable should initialized");
  if (isStaticallyBound(scope)) {
    return [
      makeEffectStatement(
        makeInitializeEffect(scope, variable, duplicable_expression),
      ),
    ];
  } else if (isDynamicallyBound(scope)) {

  } else {
    if (isGlobalReified(scope)) {

    } else {

    }
  }
};

///////////
// Rigid //
///////////

export const makeRigidBaseDeclareStatementArray = (scope, variable, writable, exports_) => {
  if (isRigidBaseBound(scope)) {
    declareRigidBaseVariable(scope, variable, {writable, import:null, exports:exports_});
    return [];
  } else {
    assert(import_ === null, "unbound imported variable");
    assert(exports_.length === 0, "unbound exported variable");
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeDefinePropertyExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
              {
                writable: isWritable(kind),
                configurable: true,
                enumerable: false,
                value: makeDirectIntrinsicExpression("aran.deadzone"),
              },
            ),
          ),
        ),
      ];
    } else {
      return [];
    }
  }
};

export const makeRigidBaseInitializeStatementArray = (scope, variable, writable, duplicable_expression) => {
  if (isRigidBaseBound(scope)) {
    return [
      makeEffectStatement(
        makeInitializeEffect(
          scope,
          variable,
          duplicable_expression,
        ),
      ),
    ];
  } else {
    if (isGlobalReified(scope)) {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeDefinePropertyExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
              {
                configurable: false,
                writable,
                enumerable: false,
                value: duplicable_expression,
              },
            ),
          ),
        ),
      ];
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

///////////
// Loose //
///////////

export const makeLooseBasePreludeDeclareStatementArray = generateMakeBasePreludeStatementArray(isLoose BaseBound);


const makeExportUndefinedStatement = (specifier) => [
  makeEffectStatement(
    makeExportEffect(
      specifier,
      makeLiteralExpression({undefined:null}),
    ),
  ),
];

export const makeLooseBaseDeclareStatementArray = (scope, variable, exports_) => {
  if (isLooseBaseBound(scope)) {
    if (isLooseBaseWildcardBound(scope)) {
      assert(exports_.length === 0, "dynamically bound exported loose variable");
      return makeDefineStatementArray(
        getLooseBaseBindingWildcard(scope).frame,
        variable,
      );
    } else {
      declareLooseBaseVariable(scope, variable, {writable:true, import:null, exports:exports_});
      return concat(
        [
          makeEffectStatement(
            makeInitializeEffect(
              scope,
              variable,
              makeLiteralExpression({undefined:null}),
            ),
          ),
        ],
        map(
          exports_,
          makeExportUndefinedStatement,
        ),
      );
    }
  } else {
    assert(exports_.length === 0, "unbound exported loose variable");
    if (isGlobalReified(scope)) {
      return makeDefineStatementArray(
        makeDirectIntrinsicExpression("aran.globalObject"),
        variable,
      );
    } else {
      return [
        makeDeclareStatement(
          "var",
          variable,
          makeLiteralExpression({undefined:null}),
        ),
      ];
    }
  }
};

////////////
// Import //
////////////

export const declareImportBaseVariable = (scope, variable, specifier, source) => {
  assert(isRigidBaseBound(scope), "unbound import variable");
  declareRigidBaseVariable(scope, variable, {writable: false, import:{specifier, source}, exports:[]});
};









export const makePreludeDeclareStatementArray = (scope, kind, variable) => {
  const {isBaseBound} = accessors[kind];
  if (!isBaseBound(scope) && isGlobalReified(scope)) {
    return [
      makeEffectStatement(
        makeExpressionEffect(
          makeConditionalExpression(
            makeHasOwnPropertyExpression(
              makeDirectIntrinsicExpression("aran.globalRecord"),
              makeLiteralExpression(variable),
            ),
            makeThrowSyntaxErrorExpression(
              `Identifier '${variable}' has already been declared`
            ),
            makeLiteralExpression({undefined:null})
          ),
        ),
      ),
    ];
  } else {
    return [];
  }
};


const assertSimpleDeclaration = (kind, import_, exports_) => {
  assert(import_ === null, "unexpected imported declaration");
  assert(exports_.length === 0, "unexpected exported declaration");
};

export const makeDeclareStatementArray = (scope, kind, variable, import_, exports_) => {
  const {isBaseBound, getBaseBindingWildcard, declareBaseVariable} = accessors[kind];
  if (isBaseBound(scope)) {
    if (isBaseWildcardBound(scope)) {
      assertSimpleDeclaration(kind, import_, exports_);
      assert(isWritable(kind), "unexpected constant declaration");
      return makeDefineStatementArray(
        getBaseBindingWildcard(scope).frame,
        variable,
      );
    } else {
      declareBaseVariable(scope, variable, {writable: isWritable(kind), import:import_, exports:exports_});
      return [];
    }
  } else {
    assertSimpleDeclaration(kind, import_, exports_);
    if (isGlobalReified(scope)) {
      if (isLoose(kind)) {
        return makeDefineStatementArray(
          makeDirectIntrinsicExpression("aran.globalObject"),
          variable,
        );
      } else {
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeDefinePropertyExpression(
                makeDirectIntrinsicExpression("aran.globalRecord"),
                makeLiteralExpression(variable),
                {
                  writable: isWritable(kind),
                  configurable: true,
                  enumerable: false,
                  value: makeDirectIntrinsicExpression("aran.deadzone"),
                },
              ),
            ),
          ),
        ];
      }
    } else {
      if (isLoose(kind)) {
        return [
          makeDeclareStatement("var", variable, makeLiteralExpression({undefined:null})),
        ]
      } else {
        return [];
      }
    }
  }
}

////////////////
// Initialize //
////////////////

// Loose variable initialization is a regular write:
//
// function f () {
//   var o = {x:123};
//   var p = new Proxy(o, {
//     get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
//     set: (tgt, key, val, rec) => (console.log("set", key, val), Reflect.set(tgt, key, val, rec)),
//     has: (tgt, key) => (console.log("has", key), Reflect.get(tgt, key)),
//   });
//   with (p) {
//     var x = 456;
//   }
//   return o;
// }
// f();
// has x
// get Symbol(Symbol.unscopables)
// set x 123
// { x: 123 }

export const makeInitializeStatementArray = (scope, kind, variable, duplicable_expression) => {
  assert(isRigid(kind), "only rigid kinds should be initialized");
  if (isRigidBaseBound(scope)) {
    assert(!isRigidBaseWildcardBound(scope), );
    return [
      makeEffectStatement(
        makeRigidBaseInitializeEffect(
          scope,
          variable,
          duplicable_expression,
        ),
      ),
    ];
  } else {
    assert(kind !== "import", "unexpected unbound import binding");
    if (isGlobalReified(scope)) {
      if (isDuplicable(kind)) {

      } else {

      }
    } else {
      return [
        makeDeclareStatement(
          kind === "const" ? "const" : "let",
          variable,
          duplicable_expression,
        ),
      ];
    }
  }
};

const generateOnInitializeDynamicFrame = (variable, duplicable_expression) => (frame) => {
  assert(frame.deadzone, "expected deadzone dynamic frame for rigid base variable");
  assert(!frame.unscopables, "unexpected unscopable dynamic frame for rigid base variable");
  return makeExpressionEffect(
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeGetExpression(
          frame.object,
          makeLiteralExpression(variable),
        ),
        makeIntrinsicExpression("aran.deadzone"),
      ),
      makeStrictSetExpression(
        frame.object,
        makeLiteralExpression(variable),
        duplicable_expression,
      ),
      makeThrowAranErrorExpression(
        "missing variable or duplicate variable initialization",
      ),
    ),
  );
};

const generateSequenceExport = (duplicable_expression) => (effect, specifier) => makeSequenceEffect(
  effect,
  makeExportEffect(specifier, duplicable_expression),
);

const generateOnInitializeHit = (expression) => (write, frame) => reduce(
  frame.exports,
  generateSequenceExport(expression),
  write(expression),
);

export const makeBaseInitializeEffect = (scope, kind, variable, expression) => {
  if (kind === "var" || kind === "function") {
    return makeWriteBaseEffect(scope, variable, expression);
  } else {
    return makeRigidBaseInitializeEffect(scope, variable, {
      onDynamicFrame: generateOnInitializeDynamicFrame(variable, expression),
      onHit: generateOnInitializeHit(expression),
    });
  }
};





exports.makeInitializeStatement = (scope, kind, identifier, box, write, _frame) => (
  Meta.isRoot(scope) ?
  (
    Throw.assert(kind in declare_enclave_mapping, null, `Invalid variable kind for enclave declaration`),
    Tree.__DeclareEnclaveStatement__(
      declare_enclave_mapping[kind],
      identifier,
      Meta.makeOpenExpression(scope, box))) :
  (
    Variable.isLoose(
      Variable[Variable.getConstructorName(kind)](identifier)) ?
    Tree.ExpressionStatement(
      write(scope, identifier, box)) :
    (
      Meta.isStatic(scope) ?
      Tree.ExpressionStatement(
        updateExport(
          scope,
          Meta.getStaticData(scope, identifier).exports,
          box,
          (expression) => Meta.makeStaticInitializeExpression(scope, identifier, expression))) :
      // console.assert(Meta.isDynamic(scope))
      (
        _frame = Meta.getDynamicFrame(scope),
        Throw.assert(_frame.deadzone, null, `Cannot initialize rigid variable on deadzone-disabled dynamic frame`),
        Throw.assert(!_frame.unscopables, null, `Cannot initialize rigid variable on unscopables-enabled dynamic frame`),
        Tree.ExpressionStatement(
          Tree.ConditionalExpression(
            Tree.BinaryExpression(
              "===",
              Intrinsic.makeGetExpression(
                Meta.makeOpenExpression(scope, _frame.box),
                Tree.PrimitiveExpression(identifier)),
              Intrinsic.makeGrabExpression(`aran.deadzoneSymbol`)),
            Intrinsic.makeDefinePropertyExpression(
              Intrinsic.makeOpenExpression(scope, _frame.box),
              Tree.PrimitiveExpression(
                Variable.getName(variable)),
              {
                __proto__: null,
                value: expression,
                configurable: false},
              false,
              Intrinsic.SUCCESS_RESULT),
            Intrinsic.makeThrowReferenceErrorExpression(`Invalid rigid variable initialization (this should never happen, please consider submitting a bug report)`)))))));
