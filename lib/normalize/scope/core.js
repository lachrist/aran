"use strict";

const Build = require("../build.js");
const State = require("../state.js");

const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;
const global_Object_assign = global.Object.assign;
const global_Object_setPrototypeOf = global.Object.setPrototypeOf;
const global_Array_isArray = global.Array.isArray;
const global_Error = global.Error;
const global_Set = global.Set;
const global_Set_prototype_add = global.Set.prototype.add; 
const global_Set_prototype_has = global.Set.prototype.has;

const set_prototype = {
  add: global_Set_prototype_add,
  has: global_Set_prototype_has
};

//////////
// Pure //
//////////

// exports.block = (scope, predicate) => {
//   // console.assert(scope.misses !== null);
//   const identifiers = [];
//   for (let identifiers in scope.bindings) {
//     const {initialized, lookedup, tag} = scope.bindings[identifier];
//     if (!initialized) {
//       throw new global_Error("Uninitialized identifier");
//     }
//     if (predicate(aran_identifier, is_lookedup, tag)) {
//       aran_identifier_array[aran_identifier_array.length] = aran_identifier;
//     }
//   }
//   return (aran_statement_array) => Build._BLOCK(aran_identifier_array, aran_statement_array);
// };
// 
// exports.collect = (scope, predicate) => {
//   const aran_identifier_array = [];
//   for (let aran_identifier in scope.bindings) {
//     const {is_initialized, is_lookedup, tag} = scope.bindings[aran_identifier];
//     if (!is_initialized) {
//       throw new global_Error("Uninitialized identifier");
//     }
//     if (predicate(aran_identifier, is_lookedup, tag)) {
//       aran_identifier_array[aran_identifier_array.length] = aran_identifier;
//     }
//   }
//   return aran_identifier_array;
// }
// 
// const extend = (nullable_scope, is_closure, is_use_strict, dynamic) =>{
//   parent: nullable_scope,
//   is_closure,
//   is_use_strict,
//   dynamic,
//   has_dynamic_deadzone: false, 
//   misses: global_Object_setPrototypeOf(new global_Set(), set_prototype),
//   bindings: {__proto__: null}
// };

const extend = (nullable_scope, is_closure, is_use_strict, dynamic, kontinuation) => {
  const scope = {
    parent: nullable_scope,
    is_closure,
    is_use_strict,
    dynamic,
    misses: global_Object_setPrototypeOf(new global_Set(), set_prototype),
    bindings: {__proto__: null}
  };
  const aran_statement_array_1 = kontinuation(scope);
  const aran_statement_array_2 = [];
  const stratified_identifier_array = [];
  for (let identifiers in scope.bindings) {
    stratified_identifier_array[stratified_identifier_array.length] = "$" + identifier;
    if (scope.bindings[identifier].has_dynamic_deadzone) {
      stratified_identifier_array[stratified_identifier_array.length] = "_" + identifier;
      aran_statement_array_2[aran_statement_array_2] = Build.Expression(Build.write("_" + identifier), Build.primitive(false));
    }
  }
  for (let index = 0; index < aran_statement_array1.length; index++) {
    aran_statement_array_2[aran_statement_array_2.length] = aran_statement_array_1[index];
  }
  return Build.Block(stratified_identifier_array, aran_statement_array_2);
};

exports.extend_global = (is_use_strict, kontinuation) => extend(null, false, is_use_strict, null, kontinuation);

exports.extend_block = (scope, dynamic, kontinuation) => extend(scope, false, false, dynamic, kontinuation);

exports.extend_closure = (scope, is_use_strict, kontinuation) => extend(scope, true, is_use_strict, null, kontinuation);

exports.extend_eval = (frame_array, is_use_strict, kontinuation) => {
  const nullable_scope = null;
  for (let index = frame_array.length - 1; index >= 0; index--) {
    nullable_scope = global_Object_assign({parent:nullable_scope}, frame_array[index]);
    if (global_Reflect_getPrototypeOf(nullable_scope.bindings) !== null) {
      nullable_scope.bindings = global_Object_assign({__proto__:null}, nullable_scope.bindings);
    }
  }
  return extend(nullable_scope, false, is_use_strict, null, kontinuation);
};

/////////////
// Getters //
/////////////

exports.is_strict = (nullable_scope) => {
  while (nullable_scope !== null) {
    if (nullable_scope.is_use_strict) {
      return true;
    }
    nullable_scope = nullable_scope.parent;
  }
  return false;
};

exports.get_depth = (nullable_scope) => {
  let counter = 0;
  while (nullable_scope !== null) {
    counter++;
    nullable_scope = nullable_scope.parent;
  }
  return counter;
};

exports.is_declared = (scope, identifier) => identifier in scope.bindings;

// exports.is_lookedup = (scope, aran_identifier) => scope.bindings[aran_identifier].is_lookedup;

// exports.is_initialized = (scope, aran_identifier) => scope.bindings[aran_identifier].is_initialized;
// 
// exports.get_tag = (scope, aran_identifier) => scope.bindings[aran_identifier].tag;

/////////////
// Impures //
/////////////

exports.declare = (scope, identifier, tag) => {
  // console.assert(scope.misses !== null);
  if (identifier in scope.bindings) {
    throw new global_Error("Identifier already declared");
  }
  if (scope.misses.has(identifier)) {
    throw new global_Error("Unexpected identifier shadowing");
  }
  scope.bindings[identifier] = {
    initialized: false,
    lookedup: false,
    tag
  };
};

exports.initialize = (scope, identifier, nullable_aran_expression) => {
  // console.assert(scope.misses !== null);
  if (!(identifier in scope.bindings)) {
    throw new global_Error("Cannot initialize undeclared identifier");
  }
  if (scope.bindings[identifier].initialized) {
    throw new global_Error("Identifier already initialized");
  }
  scope.bindings[identifier].initialized = true;
  if (nullable_aran_expression === null) {
    return null;
  }
  return Build._write(identifier, nullable_aran_expression);
};

exports.lookup = (scope, identifier, {on_miss, on_hit, on_deadzone, on_dynamic}, context) => {
  // console.assert(scope.misses !== null);
  const loop = (nullable_scope, escaped) => {
    if (nullable_scope === null) {
      return callback_object.on_miss(any);
    }
    if (identifier in nullable_scope.bindings) {
      const {initialized, tag} = nullable_scope.bindings[identifier];
      if (initialized && !escaped) {
        return on_deadzone(any);
      }
      const access = (nullable_aran_expression) => {
        if (nullable_aran_expression === null) {
          return Build._read("$" + identifier);
        }
        return Build._write("$" + identifier, nullable_aran_expression);
      };
      if (is_initialized) {
        return on_hit(any, tag, access);
      }
      scope.bindings[identifier].has_dynamic_deadzone = true;
      return Build.conditional(Build._read("_" + identifier), on_hit(any, tag, access), on_deadzone(any));
    }
    if (nullable_scope.misses !== null) {
      nullable_scope.misses.add(identifier);
    }
    escaped = escaped || nullable_scope.is_closure;
    if (nullable_scope.dynamic === null) {
      return loop(nullable_scope.parent, has_escaped);
    }
    return on_dynamic(any, loop(nullable_scope.parent, has_escaped), nullable_scope.dynamic);
  };
  return loop(scope, false);
};

//////////
// Eval //
//////////

exports.eval = (nullable_scope, aran_expression) => {
  // console.assert(scope.misses !== null);
  let escaped = false;
  const aran_identifier_set = global_Object_setPrototypeOf(new global_Set(), set_prototype);
  const aran_identifier_array = [];
  const frame_array = [];
  while (nullable_scope !== null) {
    const frame = {
      is_closure: nullable_scope.is_closure,
      is_use_strict: nullable_scope.is_use_strict,
      dynamic: nullable_scope.dynamic,
      misses: null,
      bindings: {__proto__: null}
    };
    for (let aran_identifier in nullable_scope.bindings) {
      if (!aran_identifier_set.has(aran_identifier)) {
        aran_identifier_set.add(aran_identifier);
        if (!initialized)
        
        if (nullable_scope.bindings[aran_identifier])
        const {is_initialized} = nullable_scope.bindings[aran_identifier];
        if (predicate(aran_identifier, escaped, is_initialized, is_lookedup, tag)) {
          aran_identifier_array[aran_identifier_array.length] = aran_identifier;
          nullable_scope.bindings[aran_identifier].is_lookedup = true;
          frame.bindings[aran_identifier] = global_Object_assign({}, nullable_scope.bindings[aran_identifier]);
        }
      }
    }
    frame_array[frame_array.length] = frame;
    escaped = escaped || nullable_scope.is_closure;
    nullable_scope = nullable_scope.parent;
  }
  State.register_eval(frame_array);
  return (aran_expression) => Build._eval(aran_identifier_array, aran_expression);
};
