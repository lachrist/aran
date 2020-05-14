"use strict";

// Invariant hypothesis: `scope` is a black box outside this module.

// type Identifier = <Set of strings which are valid JS identifiers>
// type StratifiedIdentifier = <Valid JS identifier which starts with either '_' or '$'>
// type Parameter = {"new.target", "this", "arguments", "error"}

// type Scope = (Parent, IsClosure, IsUseStrict, Dynamic, Misses, Bindings)
// type Frame = (IsClosure, IsUseStrict, Dynamic, Bindings)
// type Parent = Maybe Scope
// type IsClosure = Boolean
// type IsUseStrict = Boolean
// type Dynamic = Maybe JSON
// type Misses = Maybe [Identifier]
// type Bindings = Map Identifier Binding

// type Binding = (Initialized, HasDynamicDeadzone, Tag)
// type Initialized = Boolean
// type HasDynamicDeadzone = Boolean
// type Tag = *

const Build = require("../build.js");
const State = require("../state.js");

const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;
const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const meta = (identifier) => {
  return "_" + identifier;
}

const base = (identifier) => {
  return "$" + identifier;
}

////////////
// Extend //
////////////

// type Callback = Scope -> AranStatement
const extend = (parent, is_closure, is_use_strict, dynamic, callback) => {
  const scope = {
    parent,
    is_closure,
    is_use_strict,
    dynamic,
    misses: [],
    bindings: {__proto__: null}
  };
  const aran_statement_array_1 = callback(scope);
  const aran_statement_array_2 = [];
  const stratified_identifier_array = [];
  for (let identifier in scope.bindings) {
    if (!scope.bindings[identifier].initialized) {
      throw new global_Error("Uninitialized identifier");
    }
    stratified_identifier_array[stratified_identifier_array.length] = base(identifier);
    if (scope.bindings[identifier].has_dynamic_deadzone) {
      stratified_identifier_array[stratified_identifier_array.length] = meta(identifier);
      const aran_statement_array_3 = Build.Lift(Build.__write__(meta(identifier), Build.primitive(false)));
      for (let index = 0; index < aran_statement_array_3.length; index++) {
        aran_statement_array_2[aran_statement_array_2.length] = aran_statement_array_3[index];
      }
    }
  }
  for (let index = 0; index < aran_statement_array_1.length; index++) {
    aran_statement_array_2[aran_statement_array_2.length] = aran_statement_array_1[index];
  }
  debugger;
  return Build.__BLOCK__(stratified_identifier_array, aran_statement_array_2);
};

// type Callback = Scope -> AranStatement
exports.GLOBAL = (is_use_strict, callback) => {
  return extend(null, false, is_use_strict, null, callback);
};

// type Callback = Scope -> AranStatement
exports.REGULAR = (scope, callback) => {
  return extend(scope, false, false, null, callback);
};

// type Callback = Scope -> AranStatement
exports.DYNAMIC = (scope, dynamic, callback) => {
  return extend(scope, false, false, dynamic, callback);
};

// type Callback = Scope -> AranStatement
exports.CLOSURE = (scope, is_use_strict, callback) => {
  return extend(scope, true, is_use_strict, null, callback);
};

// type Callback = Scope -> AranStatement
exports.EVAL = (frame_array, is_use_strict, callback) => {
  let nullable_scope = null;
  for (let index = frame_array.length - 1; index >= 0; index--) {
    nullable_scope = global_Object_assign({parent:nullable_scope}, frame_array[index]);
    if (global_Reflect_getPrototypeOf(nullable_scope.bindings) !== null) {
      nullable_scope.bindings = global_Object_assign({__proto__:null}, nullable_scope.bindings);
    }
  }
  return extend(nullable_scope, false, is_use_strict, null, callback);
};

/////////////
// Getters //
/////////////

exports._is_strict = (nullable_scope) => {
  // console.assert(nullable_scope === null || nullable_scope.misses !== null);
  while (nullable_scope !== null) {
    if (nullable_scope.is_use_strict) {
      return true;
    }
    nullable_scope = nullable_scope.parent;
  }
  return false;
};

exports._get_depth = (nullable_scope) => {
  // console.assert(nullable_scope === null || nullable_scope.misses !== null);
  let counter = 0;
  while (nullable_scope !== null) {
    counter++;
    nullable_scope = nullable_scope.parent;
  }
  return counter;
};

exports._is_declared = (scope, identifier) => {
  return identifier in scope.bindings;
};

/////////////
// Impures //
/////////////

exports._declare = (scope, identifier, tag) => {
  // console.assert(scope.misses !== null);
  if (identifier in scope.bindings) {
    throw new global_Error("Identifier already declared");
  }
  for (let index = 0; index < scope.misses.length; index++) {
    if (scope.misses[index] === identifier) {
      throw new global_Error("Illegal identifier shadowing");
    }
  }
  scope.bindings[identifier] = {
    initialized: false,
    has_dynamic_deadzone: false,
    tag
  };
};

exports.initialize = (scope, identifier, aran_expression) => {
  // console.assert(scope.misses !== null);
  if (!(identifier in scope.bindings)) {
    throw new global_Error("Cannot initialize undeclared identifier");
  }
  if (scope.bindings[identifier].initialized) {
    throw new global_Error("Identifier already initialized");
  }
  scope.bindings[identifier].initialized = true;
  aran_expression = Build.__write__(base(identifier), aran_expression);
  if (scope.bindings[identifier].has_dynamic_deadzone) {
    return Build.sequence(aran_expression, Build.__write__(meta(identifier), Build.primitive(true)));
  }
  return aran_expression;
};

// type OnMiss :: Context -> AranExpression
// type OnDeadHit :: (Context, Tag) -> AranExpression
// type OnLiveHit :: (Context, Tag, Access) -> AranExpression
// type OnDynamicFrame :: (Context, Dynamic, AranExpression) -> AranExpression
// type Context = *
// type Access :: AranExpression -> AranExpression
// type Escaped = Boolean
exports.lookup = (scope, identifier, {on_miss, on_dead_hit, on_live_hit, on_dynamic_frame}, context) => {
  // console.assert(scope.misses !== null);
  const loop = (nullable_scope, escaped) => {
    if (nullable_scope === null) {
      return on_miss(context);
    }
    if (identifier in nullable_scope.bindings) {
      const access = (nullable_aran_expression) => {
        if (nullable_aran_expression === null) {
          return Build.__read__(base(identifier));
        }
        return Build.__write__(base(identifier), nullable_aran_expression);
      };
      const {initialized, tag} = nullable_scope.bindings[identifier];
      if (initialized) {
        return on_live_hit(context, tag, access);
      }
      if (!escaped) {
        return on_dead_hit(context, tag);
      }
      nullable_scope.bindings[identifier].has_dynamic_deadzone = true;
      return Build.conditional(Build.__read__(meta(identifier)), on_live_hit(context, tag, access), on_dead_hit(context, tag));
    }
    if (nullable_scope.misses !== null) {
      nullable_scope.misses[nullable_scope.misses.length] = identifier;
    }
    escaped = escaped || nullable_scope.is_closure;
    if (nullable_scope.dynamic === null) {
      return loop(nullable_scope.parent, escaped);
    }
    return on_dynamic_frame(context, nullable_scope.dynamic, loop(nullable_scope.parent, escaped));
  };
  return loop(scope, false);
};

const PARAMETER_IDENTIFIERS = {
  "this": "THIS",
  "new.target": "NEW_TARGET",
  "arguments": "ARGUMENTS",
  "error": "ERROR"
};

exports.parameter = (nullable_scope, parameter) => {
  return Build.__read__(PARAMETER_IDENTIFIERS[parameter]);
};

//////////
// Eval //
//////////

// type Escaped = Boolean
exports.eval = (nullable_scope, aran_expression) => {
  // console.assert(nullable_scope === null || nullable_scope.misses !== null);
  let escaped = false;
  const stratified_identifier_array = [];
  const frame_array = [];
  while (nullable_scope !== null) {
    const frame = {
      is_closure: nullable_scope.is_closure,
      is_use_strict: nullable_scope.is_use_strict,
      dynamic: nullable_scope.dynamic,
      misses: null,
      bindings: {__proto__: null}
    };
    each: for (let identifier in nullable_scope.bindings) {
      const base_identifier = base(identifier);
      for (let index = 0; index < stratified_identifier_array.length; index++) {
        if (base_identifier === stratified_identifier_array[index]) {
          continue each;
        }
      }
      stratified_identifier_array[stratified_identifier_array.length] = base_identifier;
      if (escaped && !nullable_scope.bindings[identifier].initialized) {
        nullable_scope.bindings[identifier].has_dynamic_deadzone = true;
        stratified_identifier_array[stratified_identifier_array.length] = meta(identifier);
      }
      frame.bindings[identifier] = global_Object_assign({}, nullable_scope.bindings[identifier]);
    }
    frame_array[frame_array.length] = frame;
    escaped = escaped || nullable_scope.is_closure;
    nullable_scope = nullable_scope.parent;
  }
  State.register_eval(frame_array);
  return Build.__eval__(stratified_identifier_array, aran_expression);
};
