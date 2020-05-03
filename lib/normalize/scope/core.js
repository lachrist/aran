"use strict";

// Invariant hypothesis: `scope` is a black box outside this module.

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

////////////
// Extend //
////////////

const extend = (nullable_scope, is_closure, is_use_strict, dynamic, kontinuation) => {
  const scope = {
    parent: nullable_scope,
    is_closure,
    is_use_strict,
    dynamic,
    misses: global_Object_setPrototypeOf(new global_Set(), set_prototype),
    bindings: {__proto__: null}
  };
  for (let index = 0; index < para_stratified_identifier)
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
  // console.assert(nullable_scope === null || nullable_scope.misses !== null);
  while (nullable_scope !== null) {
    if (nullable_scope.is_use_strict) {
      return true;
    }
    nullable_scope = nullable_scope.parent;
  }
  return false;
};

exports.get_depth = (nullable_scope) => {
  // console.assert(nullable_scope === null || nullable_scope.misses !== null);
  let counter = 0;
  while (nullable_scope !== null) {
    counter++;
    nullable_scope = nullable_scope.parent;
  }
  return counter;
};

exports.is_declared = (scope, identifier) => identifier in scope.bindings;

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
  return Build._write(identifier, aran_expression);
};

exports.lookup = (scope, identifier, {on_miss, on_hit, on_deadzone, on_dynamic}, context) => {
  // console.assert(scope.misses !== null);
  const loop = (nullable_scope, enclosed) => {
    if (nullable_scope === null) {
      return callback_object.on_miss(context);
    }
    if (identifier in nullable_scope.bindings) {
      const access = (nullable_aran_expression) => {
        if (nullable_aran_expression === null) {
          return Build._read("$" + identifier);
        }
        return Build._write("$" + identifier, nullable_aran_expression);
      };
      const {initialized, tag} = nullable_scope.bindings[identifier];
      if (initialized) {
        return on_hit(context, tag, access);
      }
      if (!escaped) {
        return on_deadzone(context);
      }
      scope.bindings[identifier].has_dynamic_deadzone = true;
      return Build.conditional(Build._read("_" + identifier), on_hit(context, tag, access), on_deadzone(context));
    }
    if (nullable_scope.misses !== null) {
      nullable_scope.misses.add(identifier);
    }
    escaped = escaped || nullable_scope.is_closure;
    if (nullable_scope.dynamic === null) {
      return loop(nullable_scope.parent, escaped);
    }
    return on_dynamic(any, loop(nullable_scope.parent, escaped), nullable_scope.dynamic);
  };
  return loop(scope, false);
};

const PARAMETERS = {
  __proto__: null,
  "this": "THIS",
  "new.target": "NEW_TARGET",
  "arguments": "ARGUMENTS",
  "error": "ERROR"
};

exports.read_parameter = (scope, parameter_name) => Build._read(PARAMETERS[parameter_name]);

// const GLOBAL_PARA_IDENTIFIER_ARRAY = ["this"];
// const CATCH_BLOCK_PARA_IDENTIFIER_ARRAY = ["error"];
// const BLOCK_PARA_IDENTIFIER_ARRAY = [];
// const ARROW_PARA_IDENTIFIER_ARRAY = ["arguments"];
// const FUNCTION_PARA_IDENTIFIER_ARRAY = ["new.target", "this", "arguments"];
//
// exports.access_parameter = (nullable_scope, parameter_name, nullable_aran_expression) => {
//   while (nullable_scope !== null) {
//     for (let index = 0; index < nullable_scope.parameters.length; index++) {
//       if (parameter_name === nullable_scope.parameters[index]) {
//         if (nullable_aran_expression === null) {
//           return Build._read(PARAMETERS[parameter_name]);
//         }
//         return Build._write(PARAMETERS[parameter_name], nullable_aran_expression);
//       }
//     }
//     nullable_scope = nullable_scope.parent;
//   }
//   throw new global_Error("Missing parameter");
// };

//////////
// Eval //
//////////

exports.eval = (nullable_scope, aran_expression) => {
  // console.assert(nullable_scope === null || nullable_scope.misses !== null);
  let escaped = false;
  const identifier_set = global_Object_setPrototypeOf(new global_Set(), set_prototype);
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
    for (let identifier in nullable_scope.bindings) {
      if (!identifier_set.has(identifier)) {
        identifier_set.add(identifier);
        stratified_identifier_array[stratified_identifier_array.length] = "$" + identifier;
        if (escaped && !nullable_scope.bindings[identifier].initialized) {
          nullable_scope.bindings[identifier].has_dynamic_deadzone = true;
          stratified_identifier_array[stratified_identifier_array.length] = "_" + identifier;
        }
      }
    }
    frame_array[frame_array.length] = frame;
    escaped = escaped || nullable_scope.is_closure;
    nullable_scope = nullable_scope.parent;
  }
  State.register_eval(frame_array);
  return Build._eval(stratified_identifier_array, aran_expression);
};
