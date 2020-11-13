"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const OuterCore = require("./outer-core.js");
const MantleMeta = require("./mantle-meta.js");
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");

// type DynamicFrame = (ObjectBox, UnscopablesBox)
// type ObjectBox = Box
// type UnscopablesBox = Maybe Box

// type OuterCoreCallbacks = .outer.Callbacks
// type RegularContext = (Scope, Identifier, Callbacks)
// type Callbacks = (OnMiss, OnLiveHit, OnDeadHit, OnDynamicHit)
// type OnMiss = Scope -> Identifier -> Right -> AranExpression
// type OnLiveHit = Scope -> Identifier -> Right -> Tag -> Access -> AranExpression
// type OnDeadHit = Scope -> Identifier -> Right -> Tag -> AranExpression
// type OnDynamicHit = Scope -> Identifier -> Right -> Box -> AranExpression
// type Right = *

const deadcode = () => { throw new global_Error("This should never happen") };

const abort = (message) => { throw new global_Error(message) };

const GLOBAL_DYNAMIC_FRAME_TYPE = "global";
const LOCAL_DYNAMIC_FRAME_TYPE = "local";
const WITH_DYNAMIC_FRAME_TYPE = "with";

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

exports._extend_dynamic_global = (scope) => OuterCore._extend_dynamic(
  scope,
  {
    type: GLOBAL_DYNAMIC_FRAME_TYPE,
    box: null});

exports._extend_dynamic_local = (scope, box) => OuterCore._extend_dynamic(
  scope,
  {
    type: LOCAL_DYNAMIC_FRAME_TYPE,
    box});

exports._extend_dynamic_with = (scope, box) => OuterCore._extend_dynamic(
  scope,
  [],
  {
    type: WITH_DYNAMIC_FRAME_TYPE,
    box});

exports.DeclareInitialize = (scope, kind, identifier) => (
  (kind !== "var" && kind !== "function") ?
  abort("Can only declare-and-initialize closure-scoped variables") :
  (
    _nullable_dynamic_frame = OuterCore.declare_base(scope, identifier, true),
    (
      _nullable_dynamic_frame === null ?
      OuterCore.initialize_base(scope, identifier, Tree.primitive(void 0), deadcode) :
      (
        _nullable_dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
        Tree.Lift(
          Tree.conditional(
            Builtin.has(
              Builtin.grab("#globalObjectRecord"),
              Tree.primitive(identifier)),
            Tree.primitive(void 0),
            Builtin.defineProperty(
              Builtin.grab("#globalObjectRecord"),
              Tree.primitive(identifier),
              {
                __proto__: null,
                value: Tree.primitive(void 0),
                writable: true,
                enumerable: true,
                configurable: false},
              false,
              Builtin._success_result))) :
        (
          _nullable_dynamic_frame.type === LOCAL_DYNAMIC_FRAME_TYPE ?
          Tree.Lift(
            Builtin.set(
              MantleMeta.get(scope, _nullable_dynamic_frame.box),
              Tree.primitive(identifier),
              Tree.primitive(void 0),
              null,
              false,
              Builtin._success_result)) :
          abort("Cannot declare-and-initialize closure-scoped variable on with dynamic frame"))))));

exports.Declare = (scope, kind, identifier) => (
  (kind !== "let" && kind !== "const" && kind !== "class" && kind !== "param") ?
  abort("Can only declare block-scoped variables") :
  (
    _nullable_dynamic_frame = OuterCore.declare_base(scope, identifier, kind === "let"),
    (
      _nullable_dynamic_frame === null ?
      Tree.Bundle([]) :
      (
        _nullable_dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
        Tree.Lift(
          Builtin.defineProperty(
            Builtin.grab("#globalObjectRecord"),
            Tree.primitive(identifier),
            {
              __proto__: null,
              value: Builtin.grab("#globalObjectRecordDeadzone"),
              writable: kind === "let",
              enumerable: true,
              configurable: true},
            false,
            Builtin._success_result)) :
        abort("Cannot declare block-scoped variable on with/closure dynamic frame")))));

const initialize_callback = (dynamic_frame, identifier, expression) => (
  _nullable_dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
  Tree.Lift(
    Builtin.defineProperty(
      Builtin.grab("#globalDeclarativeRecord"),
      Tree.primitive(identifier),
      {
        __proto__: null,
        value: expression},
      false,
      Builtin._success_result)) :
  abort("Cannot initialize block-scoped variable on with/closure dynamic frame"));

exports.initialize = (scope, identifier, kind, expression) => (
  (kind !== "let" && kind !== "const" && kind !== "function") ?
  abort("Can only initialize block-scoped variables") :
  OuterCore._initialize_base(
    scope,
    identifier,
    expression,
    initialize_callback));

// exports.DeclareInitialize
//
//   (
//     _nullable_dynamic_frame === null ?
//     Tree.Lift(
//       OuterCore.initialize_base(
//         scope,
//         kind,
//         identifier,
//         Tree.primitive(void 0),
//         this_should_never_happen)) :
//     // console.assert(frame_nullable_dynamic_frame.type === CLOSURE_TYPE)
//     Tree.Lift(
//       Tree.conditional(
//         Builtin.has(
//           MantleMeta.get(scope, _nullable_dynamic_frame.box),
//           Tree.primitive(identifier)),
//         Tree.primitive(void 0),
//         Builtin.define_property(
//           MantleMeta.get(scope, _nullable_dynamic_frame.box),
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
//     _nullable_dynamic_frame = OuterCore._declare_base(scope, kind, identifier),
//     (
//       _nullable_dynamic_frame === null ?
//       Tree.Bundle([]) :
//       // console.assert(_nullable_dynamic_frame.type === BLOCK_TYPE)
//       Tree.Lift(
//         Builtin.set(
//           Builtin.get(
//             MantleMeta.get(scope, _nullable_dynamic_frame.box),
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
//   OuterCore.initialize_base(
//     scope,
//     kind,
//     identifier,
//     expression,
//     (dynamic_frame) => Builtin.define_property(
//       MantleMeta.get(scope, dynamic_frame.box),
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
//           MantleMeta.get(scope, dynamic_frame.box),
//           Tree.primitive("@@deadzone")),
//         Tree.primitive(identifier),
//         false,
//         Builtin._success_result))) :
//   (
//     (
//       () => { throw new global_Error("Can only initialize later block kinds") })
//     ()));

const outer_callbacks = {
  on_miss: (context) => (
    is_special_identifier(context.identifier) ?
    abort("Missing special identifier") :
    context.callbacks.on_miss(context.scope, context.identifier, context.right)),
  on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context.scope, context.identifier, context.right, writable, access),
  on_dead_hit: (context, writable) => (
    is_special_identifier(context.identifier) ?
    abort("Special identifier in deadzone") :
    context.callbacks.on_dead_hit(context.scope, context.identifier, context.right, writable)),
  on_dynamic_frame: (context, dynamic_frame, expression) => (
    is_special_identifier(context.identifier) ?
    expression :
    (
      dynamic_frame.type === LOCAL_DYNAMIC_FRAME_TYPE ?
      Tree.conditional(
        Builtin.has(
          MantleMeta.get(context.scope, dynamic_frame.box),
          Tree.primitive(context.identifier)),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.box, false),
        expression) :
      (
        dynamic_frame.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
        Tree.conditional(
          Builtin.has(
            Builtin.grab()
            Tree.primitive(context.identifier)),
          Builtin.conditional(
            Tree.binary(
              "===",
              Builtin.get(
                MantleMeta.get(context.scope, dynamic_frame.box),
                Tree.primitive(context.identifier)),
              Builtin.grab("#globalDeclarativeRecordDeadzone")),
            Builtin.throw_reference_error("Cannot access '" + context.identifier + "' before initalization"),
            context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.box, true)),
          expressin) :
        // console.assert(frame.kind === WITH_KIND)
        Tree.conditional(
          Tree.conditional(
            Builtin.has(
              MantleMeta.get(context.scope, dynamic_frame.box),
              Tree.primitive(context.identifier)),
            MantleMeta.box(
              context.scope,
              "ScopeBaseUnscopables",
              false,
              Builtin.get(
                MantleMeta.get(context.scope, dynamic_frame.box),
                Builtin.grab("Symbol.unscopables"),
                null),
              (unscopables_box) => Tree.conditional(
                Tree.conditional(
                  Tree.binary(
                    "===",
                    Tree.unary(
                      "typeof",
                      MantleMeta.get(context.scope, unscopables_box)),
                    Tree.primitive("object")),
                  MantleMeta.get(context.scope, unscopables_box),
                  Tree.binary(
                    "===",
                    Tree.unary(
                      "typeof",
                      MantleMeta.get(context.scope, unscopables_box)),
                    Tree.primitive("function"))),
                Builtin.get(
                  MantleMeta.get(context.scope, unscopables_box),
                  Tree.primitive(context.identifier),
                  null),
                Tree.primitive(false))),
            Tree.primitive(true)),
          expression,
          context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.box, false)))))};

exports.lookup = (scope, identifier, right, callbacks) => OuterCore.lookup_base(
  scope,
  identifier,
  {
    scope,
    identifier,
    right,
    callbacks},
  outer_callbacks);
