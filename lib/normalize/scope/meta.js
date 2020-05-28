
"use strict";

// Invariant hypothesis: `Core._declare`, `Core.initialize`, and `Core.lookup` are only access in `Meta` and `Base`. 
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.box` and `Meta.Box` via side effects.

// type MetaIdentifier = <Strings which are valid JS identifier that starts with a `_`>
// type Box = Either MetaIdentifier Primitive

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring

const ArrayLite = require("array-lite");
const Core = require("./core.js");
const Build = require("../build.js");

const global_Error = global.Error;

///////////////////////////
// Declare && Initialize //
///////////////////////////

const declare_initialize_meta = (context, aran_expression) => {
  let counter = 1;
  const depth = Core._get_depth(context.scope);
  let meta_identifier = "_" + context.identifier + "_" + depth + "_";
  while (Core._is_declared(context.scope, meta_identifier + counter)) {
    counter++;
  }
  meta_identifier += counter;
  Core._declare(context.scope, meta_identifier, context.writable);
  return {
    aran_expression: Core.initialize(scope, meta_identifier, either_primitive_aran_expression),
    box: meta_identifier
  };
};

const dispatch_callbacks = {
  primitive: (scope, aran_expression, primitive) => ({
    remainder: null,
    box: typeof primitive === "string" ? "@" + primitive : primitive
  }),
  builtin: (scope, aran_expression, name) => ({
    remainder: null,
    box: "#" + name
  }),
  arrow: declare_initialize_meta,
  function: declare_initialize_meta,
  read: (context, aran_expression, aran_identifier) => {
    if (Core._is_writable(context.scope, aran_identifier)) {
      return declare_initialize_meta(context, aran_expression);
    }
    return {
      remainder: null,
      box: aran_identifier
    };
  },
  // Consumers //
  write: (context, aran_expression, aran_identifier, right_aran_expression) => ({
    remainder: aran_expression,
    box: void 0
  }),
  sequence: (context, aran_expression, first_aran_expression, second_aran_expression) => {
    const result = Dispatch.expression(second_aran_expression, callbacks, context);
    return {
      remainder: result.remainder === null ? first_aran_expression : Build.sequence(first_aran_expression, result.remainder),
      box: result.box
    };
  },
  conditional: declare_initialize_meta,
  throw: (context, aran_expression, argument_aran_expression) => ({
    remainder: aran_expression,
    box: void 0
  }),
  eval: declare_initialize_meta,
  // Combiners //
  apply: declare_initialize_meta,
  construct: declare_initialize_meta,
  unary: declare_initialize_meta,
  binary: declare_initialize_meta,
  object: declare_initialize_meta
};

const make = (scope, identifier, writable, aran_expression, callback1, callback2) => {
  const context = {scope, identifier, writable};
  const result = writable ? declare_initialize_meta(context, aran_expression) : Dispatch._expression(aran_expression, callbacks, context);
  return result.remainder === null ? callback1(result.box) : callback2(result.remainder, result.box);
};

exports.box = (scope, identifier, aran_expression, callback) => {
  return make(scope, identifier, aran_expression, callback, (aran_expression, box) => {
    return Build.sequence(aran_expression, callback(box));
  });
};

exports.Box = (scope, identifier, aran_expression, callback) => {
  return make(scope, identifier, aran_expression, callback, (aran_expression, box) => {
    return ArrayLite.concat(Build.Lift(aran_expression), callback(box));
  });
};

///////////////////
// Read && Write //
///////////////////

const lookup_callbacks = {
  on_live_hit: (nullable_aran_expression, writable, access) => {
    if (!writable && nullable_aran_expression !== null) {
      throw new global_Error("Writing to a constant meta-identifier");
    }
    return access(nullable_aran_expression);
  },
  on_dead_hit: /* istanbul ignore next */ (nullable_aran_expression, wriable) => {
    // console.assert(false);
  },
  on_miss: /* istanbul ignore next */ (nullable_aran_expression) => {
    // console.assert(false);
  },
  on_dynamic_frame: (nullable_aran_expression, dynamic, aran_expression) => aran_expression
};

const ONE = [1];

exports.get = (scope, box) => {
  if (typeof box === "string") {
    if (box[0] === "#") {
      return Build.builtin(global_Reflect_apply(global_String_prototype_substring, box, ONE));
    }
    if (box[0] === "@") {
      return Build.primitive(global_Reflect_apply(global_String_prototype_substring, box, ONE));
    }
    return Core.lookup(scope, box, null, lookup_callbacks);
  }
  return Build.primitive(box);
};

exports.set = (scope, box, aran_expression) => {
  if (typeof box !== "string" || box[0] === "#" || box[0] === "@") {
    throw new global_Error("Cannot set an inlined box");
  }
  return Core.lookup(scope, box, aran_expression, callbacks);
};
