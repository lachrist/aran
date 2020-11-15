"use strict";

const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");
const Meta = require("./layer-3-meta.js");

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

const abort = (message) => { throw new global_Error(message) };

const GLOBAL_DYNAMIC_FRAME_TYPE = "global";
const LOCAL_DYNAMIC_FRAME_TYPE = "local";
const WITH_DYNAMIC_FRAME_TYPE = "with";

global_Object_assign(exports, Meta);
delete exports._declare_base;
delete exports._initialize_base;
delete exports._lookup_base;
delete exports._get_foreground_base;
delete exports._extend_dynamic;

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

// const special_outer_callbacks = {
//   on_miss: (context) => {
//     throw new global_Error("Missing special identifier");
//   },
//   on_dead_hit: (context, writable) => {
//     throw new global_Error("Special identifier in deadzone");
//   },
//   on_frame: (context, frame, expression) => expression,
//   on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context, scope, context.identifier, context.right, writable, access)
// };

const is_special_identifier = (identifier) => (
  identifier === "this" ||
  identifier === "new.target");

exports._get_foreground = Meta._get_foreground_base;

exports._extend_dynamic = (scope, nullable_box_1, nullable_box_2, nullable_box_3) => Meta._extend_dynamic(
  scope,
  {
    with: nullable_box_1,
    block: nullable_box_2,
    closure: nullable_box_3});

// exports._extend_dynamic_block = (scope, box1, box2) => {};
//
// exports._extend_dynamic_closure = (scope, box1, box2) => {};
//
// exports._extend_dynamic_global = (scope box1, box2) => Meta._extend_dynamic(
//   scope,
//   {
//     type: GLOBAL_DYNAMIC_FRAME_TYPE,
//     box: Meta._builtin_box("#globalDeclarativeRecord")});
//
// exports._extend_dynamic_local = (scope, box) => Meta._extend_dynamic(
//   scope,
//   {
//     type: LOCAL_DYNAMIC_FRAME_TYPE,
//     box});
//
// exports._extend_dynamic_with = (scope, box) => Meta._extend_dynamic(
//   scope,
//   [],
//   {
//     type: WITH_DYNAMIC_FRAME_TYPE,
//     box});

exports.DeclareInitialize = (scope, kind, identifier, _nullable_dynamic_frame) => (
  (
    kind !== "var" &&
    kind !== "function") ?
  abort("Can only declare-and-initialize closure-scoped variables") :
  (
    _nullable_dynamic_frame = Meta._declare_base(scope, identifier, true),
    (
      _nullable_dynamic_frame === null ?
      Tree.Lift(
        Meta._initialize_base(scope, identifier, Tree.primitive(void 0)).value) : // console.assert(_result.done === true)
      (
        _nullable_dynamic_frame.closure === null ?
        abort("Missing closure level of dynamic frame for declaration-and-initialization of closure-scoped variable") :
        Tree.Lift(
          Tree.conditional(
            Builtin.has(
              Meta.get(scope, _nullable_dynamic_frame.closure),
              Tree.primitive(identifier)),
            Tree.primitive(void 0),
            Builtin.define_property(
              Meta.get(scope, _nullable_dynamic_frame.closure),
              Tree.primitive(identifier),
              {
                __proto__: null,
                value: Tree.primitive(void 0),
                writable: true,
                enumerable: true,
                configurable: false},
              false,
              Builtin._success_result)))))));

// exports.DeclareInitialize = (scope, kind, identifier) => (
//   (kind !== "var" && kind !== "function") ?
//   abort("Can only declare-and-initialize closure-scoped variables") :
//   (
//     _nullable_dynamic_frame = Meta.declare_base(scope, identifier, true),
//     (
//       _nullable_dynamic_frame === null ?
//       Meta.initialize_base(scope, identifier, Tree.primitive(void 0), deadcode) :
//       (
//         (
//           _nullable_dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ||
//           _nullable_dynamic_frame.type === LOCAL_DYNAMIC_FRAME_TYPE) ?
//         Tree.Lift(
//           Tree.conditional(
//             Builtin.has(
//               Meta.get(scope, _nullable_dynamic_frame.box),
//               Tree.primitive(identifier)),
//             Tree.primitive(void 0),
//             Builtin.defineProperty(
//               Meta.get(scope, _nullable_dynamic_frame.box),
//               Tree.primitive(identifier),
//               {
//                 __proto__: null,
//                 value: Tree.primitive(void 0),
//                 writable: true,
//                 enumerable: true,
//                 configurable: false},
//               false,
//               Builtin._success_result))) :
//         (
//           _nullable_dynamic_frame.type === LOCAL_DYNAMIC_FRAME_TYPE ?
//           Tree.Lift(
//             Builtin.set(
//               Meta.get(scope, _nullable_dynamic_frame.box),
//               Tree.primitive(identifier),
//               Tree.primitive(void 0),
//               null,
//               false,
//               Builtin._success_result)) :
//           abort("Cannot declare-and-initialize closure-scoped variable on with dynamic frame"))))));

exports.Declare = (scope, kind, identifier, _nullable_dynamic_frame) => (
  (
    kind !== "let" &&
    kind !== "const" &&
    kind !== "class" &&
    kind !== "param") ?
  abort("Can only declare (and not initialize right after) block-scoped variables") :
  (
    _nullable_dynamic_frame = Meta._declare_base(scope, identifier, kind === "let"),
    (
      _nullable_dynamic_frame === null ?
      Tree.Bundle([]) :
      (
        _nullable_dynamic_frame.block === null ?
        abort("Missing block level of dynamic frame for declaration of block-scoped variable") :
        Tree.Lift(
          Builtin.define_property(
            Meta.get(scope, _nullable_dynamic_frame.block),
            Tree.primitive(identifier),
            {
              __proto__: null,
              value: Builtin.grab("@deadzone"),
              writable: kind === "let",
              enumerable: true,
              configurable: false},
            false,
            Builtin._success_result))))));

// exports.Declare = (scope, kind, identifier) => (
//   (kind !== "let" && kind !== "const" && kind !== "class" && kind !== "param") ?
//   abort("Can only declare block-scoped variables") :
//   (
//     _nullable_dynamic_frame = Meta.declare_base(scope, identifier, kind === "let"),
//     (
//       _nullable_dynamic_frame === null ?
//       Tree.Bundle([]) :
//       (
//         _nullable_dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
//         Tree.Lift(
//           Builtin.defineProperty(
//             Builtin.grab("#globalObjectRecord"),
//             Tree.primitive(identifier),
//             {
//               __proto__: null,
//               value: Builtin.grab("#globalObjectRecordDeadzone"),
//               writable: kind === "let",
//               enumerable: true,
//               configurable: true},
//             false,
//             Builtin._success_result)) :
//         abort("Cannot declare block-scoped variable on with/closure dynamic frame")))));

exports.initialize = (scope, kind, identifier, expression, _result) => (
  (
    kind !== "let" &&
    kind !== "const" &&
    kind !== "class") ?
  abort("Can only initialize (and not declare right before) block-scoped variables") :
  (
    _result = Meta._initialize_base(
      scope,
      identifier,
      expression),
    (
      _result.done ?
      _result.value :
      (
        _result.value.block === null ?
        abort("Missing block level of dynamic frame for initialization of block-scoped variable") :
        Builtin.define_property(
          Meta.get(scope, _result.value.block),
          Tree.primitive(identifier),
          {
            __proto__: null,
            value: expression},
          false,
          Builtin._success_result)))));

// const initialize_callback = (dynamic_frame, identifier, expression) => (
//   _nullable_dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
//   Tree.Lift(
//     Builtin.defineProperty(
//       Builtin.grab("#globalDeclarativeRecord"),
//       Tree.primitive(identifier),
//       {
//         __proto__: null,
//         value: expression},
//       false,
//       Builtin._success_result)) :
//   abort("Cannot initialize block-scoped variable on with/closure dynamic frame"));
//
// exports.initialize = (scope, identifier, kind, expression) => (
//   (kind !== "let" && kind !== "const" && kind !== "function") ?
//   abort("Can only initialize block-scoped variables") :
//   Meta._initialize_base(
//     scope,
//     identifier,
//     expression,
//     initialize_callback));

// exports.DeclareInitialize
//
//   (
//     _nullable_dynamic_frame === null ?
//     Tree.Lift(
//       Meta.initialize_base(
//         scope,
//         kind,
//         identifier,
//         Tree.primitive(void 0),
//         this_should_never_happen)) :
//     // console.assert(frame_nullable_dynamic_frame.type === CLOSURE_TYPE)
//     Tree.Lift(
//       Tree.conditional(
//         Builtin.has(
//           Meta.get(scope, _nullable_dynamic_frame.box),
//           Tree.primitive(identifier)),
//         Tree.primitive(void 0),
//         Builtin.define_property(
//           Meta.get(scope, _nullable_dynamic_frame.box),
//           Tree.primitive(identifier),
//           {
//             __proto__: null,
//             value: Tree.primitive(void 0),
//             writable: true,
//             enumerable: true,
//             configurable: false},
//           false,
//           Builtin._success_result)))));

// exports.Declare = (scope, identifier, kind, _nullable_dynamic_frame) => (
//   (kind === "let" || kind === "const" || kind === "class") ?
//   (
//     _nullable_dynamic_frame = Meta._declare_base(scope, kind, identifier),
//     (
//       _nullable_dynamic_frame === null ?
//       Tree.Bundle([]) :
//       // console.assert(_nullable_dynamic_frame.type === BLOCK_TYPE)
//       Tree.Lift(
//         Builtin.set(
//           Builtin.get(
//             Meta.get(scope, _nullable_dynamic_frame.box),
//             Tree.primitive("@@deadzone"),
//             null),
//           Tree.primitive(identifier),
//           Tree.primitive(null),
//           null,
//           false,
//           callback)))) :
//   (
//     (
//       () => { throw new global_Error("Can only declare and not directly initialize block kinds") })
//     ()));

// exports.initialize = (scope, kind, identifier, expression) => (
//   (kind === "let" || kind === "const" || kind === "class") ?
//   Meta.initialize_base(
//     scope,
//     kind,
//     identifier,
//     expression,
//     (dynamic_frame) => Builtin.define_property(
//       Meta.get(scope, dynamic_frame.box),
//       Tree.primitive(identifier),
//       {
//         __proto__: null,
//         value: expression,
//         writable: kind === "let",
//         enumerable: true,
//         configurable: false},
//       false,
//       Builtin.delete_property( // console.assert(frame.type === BLOCK_TYPE)
//         Builtin.get(
//           Meta.get(scope, dynamic_frame.box),
//           Tree.primitive("@@deadzone")),
//         Tree.primitive(identifier),
//         false,
//         Builtin._success_result))) :
//   (
//     (
//       () => { throw new global_Error("Can only initialize later block kinds") })
//     ()));

const lookup_callback_object = {
  on_miss: (context) => (
    is_special_identifier(context.identifier) ?
    abort("Missing special identifier") :
    context.callbacks.on_miss(context.scope, context.identifier, context.right)),
  on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context.scope, context.identifier, context.right, writable, access),
  on_dead_hit: (context, writable) => (
    is_special_identifier(context.identifier) ?
    abort("Special identifier in deadzone") :
    context.callbacks.on_dead_hit(context.scope, context.identifier, context.right)),
  on_dynamic_frame: (context, dynamic_frame, expression) => (
    expression = (
      dynamic_frame.closure === null ?
      expression :
      Tree.conditional(
        Builtin.has(
          Meta.get(context.scope, dynamic_frame.closure),
          Tree.primitive(context.identifier)),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.closure, false),
        expression)),
  expression = (
    dynamic_frame.block === null ?
    expression :
    Tree.conditional(
      Builtin.has(
        Meta.get(context.scope, dynamic_frame.block),
        Tree.primitive(context.identifier)),
      Tree.conditional(
        Tree.binary(
          "===",
          Builtin.get(
            Meta.get(context.scope, dynamic_frame.block),
            Tree.primitive(context.identifier),
            null),
          Builtin.grab("@deadzone")),
        context.callbacks.on_dead_hit(context.scope, context.identifier, context.right),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.block, true)),
      expression)),
    expression = (
      dynamic_frame.with === null ?
      expression :
      Tree.conditional(
        Tree.conditional(
          Builtin.has(
            Meta.get(context.scope, dynamic_frame.with),
            Tree.primitive(context.identifier)),
          Meta.box(
            context.scope,
            "ScopeBaseUnscopables",
            false,
            Builtin.get(
              Meta.get(context.scope, dynamic_frame.with),
              Builtin.grab("Symbol.unscopables"),
              null),
            (unscopables_box) => Tree.conditional(
              Tree.conditional(
                Tree.binary(
                  "===",
                  Tree.unary(
                    "typeof",
                    Meta.get(context.scope, unscopables_box)),
                  Tree.primitive("object")),
                Meta.get(context.scope, unscopables_box),
                Tree.binary(
                  "===",
                  Tree.unary(
                    "typeof",
                    Meta.get(context.scope, unscopables_box)),
                  Tree.primitive("function"))),
              Builtin.get(
                Meta.get(context.scope, unscopables_box),
                Tree.primitive(context.identifier),
                null),
              Tree.primitive(false))),
          Tree.primitive(true)),
        expression,
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.with, false))),
    expression)};

exports.lookup = (scope, identifier, right, callbacks) => Meta.lookup_base(
  scope,
  identifier,
  {
    scope,
    identifier,
    right,
    callbacks},
  lookup_callback_object);
