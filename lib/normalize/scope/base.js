"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Outer = require("./outer.js");
const Meta = require("./meta.js")
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");

// type DynamicFrame = (ObjectBox, UnscopablesBox)
// type ObjectBox = Box
// type UnscopablesBox = Maybe Box

// type OuterCallbacks = .outer.Callbacks
// type RegularContext = (Scope, Identifier, Callbacks)
// type Callbacks = (OnMiss, OnLiveHit, OnDeadHit, OnDynamicHit)
// type OnMiss = Scope -> Identifier -> Right -> AranExpression
// type OnLiveHit = Scope -> Identifier -> Right -> Tag -> Access -> AranExpression
// type OnDeadHit = Scope -> Identifier -> Right -> Tag -> AranExpression
// type OnDynamicHit = Scope -> Identifier -> Right -> Box -> AranExpression
// type Right = *

const deadcode = () => { throw new global_Error("This should never happen") };

const CLOSURE_DYNAMIC_FRAME_TYPE = "closure";
const WITH_DYNAMIC_FRAME_TYPE = "with";
const BLOCK_DYNAMIC_FRAME_TYPE = "block";

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

exports._extend_dynamic_program = (scope, box) => Outer._extend_dynamic(
  scope,
  ["let", "const", "class", "function", "var"],
  {
    type: PROGRAM_DYNAMIC_FRAME_TYPE,
    box});

exports._extend_dynamic_closure = (scope, box) => Outer._extend_dynamic(
  scope,
  ["var", "function"],
  {
    type: CLOSURE_DYNAMIC_FRAME_TYPE,
    box});

exports._extend_dynamic_with = (scope, box) => Outer._extend_dynamic(
  scope,
  [],
  {
    type: WITH_DYNAMIC_FRAME_TYPE,
    box});

exports._check = (scope, kind, identifier) => (

exports._get_conflict = (scope, kind, identifier) => (
  _result = Outer._declare_base(scope, kind, identifier),
  (
    _result === true ?
    (
      (
        () => { throw new global_Error() })
      ()) :
    (
      _result === false ?
      null :
      _result.type === PROGRAM_DYNAMIC_FRAME_TYPE)));

ArrayLite.reduce(
  Outer._get_conflicts_base(scope, kind, identifier),
  (result, conflict) => (
    typeof conflict === "string" ?
    (
      kind === "var" && conflict === "var" ?
      result :
      false) :
    (
      conflict.type === CLOSURE_FRAME_TYPE ?
      (
        kind === "var" ?
        result :
        "closure") :


            (
        kind === "var" && conflict.type === CLOSURE_FRAME_TYPE ?
        result :
        false) :
      ()

 ArrayLite.map(
  ArrayLite.filterOut(
    Outer._get_conflicts_base(scope, kind, identifier),
    (conflict) => (
      kind === "var" &&
      (
        typeof conflict === "string" ?
        conflict === "var" :
        conflict.type === CLOSURE_DYNAMIC_FRAME_TYPE))),
  (foo) =>


    typeof conflict === "string" ?
    conflict :
    (
      conflict.type === GLOBAL_DYNAMIC_FRAME_TYPE ?
      null :

      "program" :
      "closure")))
  ArrayLite.reduce(


exports.DeclareInitialize = (scope, kind, identifier, _nullable_dynamic_frame) => (
  (kind === "var" || kind === "function") ?
  (
    _nullable_dynamic_frame = Outer.declare_base(scope, kind, identifier),
    (
      _nullable_dynamic_frame === null ?
      Tree.Lift(
        Outer.initialize_base(
          scope,
          kind,
          identifier,
          Tree.primitive(void 0),
          this_should_never_happen)) :
      // console.assert(frame_nullable_dynamic_frame.type === CLOSURE_TYPE)
      Tree.Lift(
        Tree.conditional(
          Builtin.has(
            Meta.get(scope, _nullable_dynamic_frame.box),
            Tree.primitive(identifier)),
          Tree.primitive(void 0),
          Builtin.define_property(
            Meta.get(scope, _nullable_dynamic_frame.box),
            Tree.primitive(identifier),
            {
              __proto__: null,
              value: Tree.primitive(void 0),
              writable: true,
              enumerable: true,
              configurable: false},
            false,
            Builtin._success_result))))) :
  (
    (
      () => { throw new global_Error("Can only declare and directly initialize closure kinds") })
    ()));

exports.Declare = (scope, kind, identifier, _nullable_dynamic_frame) => (
  (kind === "let" || kind === "const" || kind === "class") ?
  (
    _nullable_dynamic_frame = Outer._declare_base(scope, kind, identifier),
    (
      _nullable_dynamic_frame === null ?
      Tree.Bundle([]) :
      // console.assert(_nullable_dynamic_frame.type === BLOCK_TYPE)
      Tree.Lift(
        Builtin.set(
          Builtin.get(
            Meta.get(scope, _nullable_dynamic_frame.box),
            Tree.primitive("@@deadzone"),
            null),
          Tree.primitive(identifier),
          Tree.primitive(null),
          null,
          false,
          callback)))) :
  (
    (
      () => { throw new global_Error("Can only declare and not directly initialize block kinds") })
    ()));

exports.initialize = (scope, kind, identifier, expression) => (
  (kind === "let" || kind === "const" || kind === "class") ?
  Outer.initialize_base(
    scope,
    kind,
    identifier,
    expression,
    (dynamic_frame) => Builtin.define_property(
      Meta.get(scope, dynamic_frame.box),
      Tree.primitive(identifier),
      {
        __proto__: null,
        value: expression,
        writable: kind === "let",
        enumerable: true,
        configurable: false},
      false,
      Builtin.delete_property( // console.assert(frame.type === BLOCK_TYPE)
        Builtin.get(
          Meta.get(scope, dynamic_frame.box),
          Tree.primitive("@@deadzone")),
        Tree.primitive(identifier),
        false,
        Builtin._success_result))) :
  (
    (
      () => { throw new global_Error("Can only initialize later block kinds") })
    ()));

const outer_callbacks = {
  on_miss: (context) => (
    is_special_identifier(context.identifier) ?
    (
      (
        () => { throw new global_Error("Missing special identifier") })
        ()) :
    context.callbacks.on_miss(context.scope, context.identifier, context.right)),
  on_live_hit: (context, writable, access) => context.callbacks.on_live_hit(context.scope, context.identifier, context.right, writable, access),
  on_dead_hit: (context, writable) => (
    is_special_identifier(context.identifier) ?
    (
      (
        () => { throw new global_Error("Special identifier in deadzone") })
        ()) :
    context.callbacks.on_dead_hit(context.scope, context.identifier, context.right, writable)),
  on_dynamic_frame: (context, dynamic_frame, expression) => (
    is_special_identifier(context.identifier) ?
    expression :
    (
      dynamic_frame.type === CLOSURE_DYNAMIC_FRAME_TYPE ?
      Tree.conditional(
        Builtin.has(
          Meta.get(context.scope, dynamic_frame.box),
          Tree.primitive(context.identifier)),
        context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.box, false),
        expression) :
      (
        dynamic_frame.type === BLOCK_DYNAMIC_FRAME_TYPE ?
        Tree.conditional(
          Builtin.has(
            Meta.get(context.scope, dynamic_frame.box),
            Tree.primitive(context.identifier)),
          context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.box, true),
          Tree.conditional(
            Builtin.has(
              Builtin.get(
                Meta.get(context.scope, dynamic_frame.box),
                Tree.primitive("@@deadzone"),
                null),
              Tree.primitive(context.identifier)),
            Builtin.throw_reference_error("Cannot access '" + context.identifier + "' before initalization"),
            expression)) :
        // console.assert(frame.kind === WITH_KIND)
        Tree.conditional(
          Tree.conditional(
            Builtin.has(
              Meta.get(context.scope, dynamic_frame.box),
              Tree.primitive(context.identifier)),
            Meta.box(
              context.scope,
              "ScopeBaseUnscopables",
              false,
              Builtin.get(
                Meta.get(context.scope, dynamic_frame.box),
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
          context.callbacks.on_dynamic_hit(context.scope, context.identifier, context.right, dynamic_frame.box, false)))))};

exports.lookup = (scope, identifier, right, callbacks) => Outer.lookup_base(scope, identifier, {
  scope,
  identifier,
  right,
  callbacks
}, outer_callbacks);
