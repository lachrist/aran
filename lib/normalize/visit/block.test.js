"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../../tree.js")._toggle_debug_mode();

const Parse = require("../../../parse.js");
const Tree = require("../../../tree.js");
const Lang = require("../../../lang");
const State = require("../../state.js");
const Completion = require("../../completion.js");
const Scope = require("../../scope");
const Body = require("./body.js");

// (
//   node.type === "LabeledStatement" ?
//   Statement.Visit(
//     scope,
//     node.body,
//     {
//       __proto__: context,
//       completion: Completion._register_label(context.completion)}) :
//   (
//     node.type === "BlockStatement" ?
//     Tree.Lone(
//       [],
//       Scope.BLOCK(
//         scope,
//         null,
//         [],
//         (scope) => Common.Body(scope, nodes, context.completion))) :
//     (
//       node.type === "EmptyStatement" ?
//       Tree.Bundle([]) :
//       Assert.fail()))

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  const Statement = {
    _hoisted_context: {
      type: "hoisted",
      completion: Completion._make_empty()},
    _default_context: {
      type: "default",
      completion: Completion._make_empty()},
    Visit: (scope, node, context) => (
      node.type === "EmptyStatement" ?
      Tree.Lift(
        Tree.primitive("*empty*")) :
      (
        Assert.deepEqual(node.type, "ExpressionStatement"),
        Assert.deepEqual(node.expression.type, "Literal"),
        Assert.deepEqual(typeof node.expression.value, "string"),
        Tree.Lift(
          Tree.primitive(
            (
              context.type +
              (
                Completion._is_last(context.completion) ?
                "!" :
                ".") +
              node.expression.value)))))};
  Body._resolve_circular_dependencies(Statement);
  Lang._match_block(
    Scope.MODULE(
      false,
      [],
      (scope) => Body.Body(
        scope,
        Parse.script(`"foo"; "bar"; ; ;`).body,
        Completion._make_full())),
    Lang.PARSE_BLOCK(`{
      "hoisted.foo";
      "hoisted.bar";
      "*empty*";
      "*empty*";
      "default.foo";
      "default!bar";
      "*empty*";
      "*empty*"; }`),
    Assert);
  Lang._match_block(
    Scope.MODULE(
      false,
      [],
      (scope) => Body.Switch(
        scope,
        Parse.script(`
          switch (123) {
            case 456: "foo";
            case 789: "bar"; }`).body[0].cases,
        Completion._make_full(),
        (scope, node, callback) => callback(scope))),
    Lang.PARSE_BLOCK(`{
      "hoisted.foo";
      "hoisted.bar";
      "default.foo";
      "default!bar"; }`),
    Assert);

}, []);



// SwitchStatement //
success(
  true,
  true,
  [
    {kind:"function", name: "f"}],
  `
    switch (!1) {
      case 2:
        3;
        let x = 4;
        function f () { 5; }
      default:
        x;
        6; }`,
  {
    completion: Completion._make_full()},
  `{
    let $f, _completion, _discriminant, _matched;
    _completion = void 0;
    $f = void 0;
    _completion = void 0;
    _discriminant = !1;
    _matched = false;
    $: {
      let $x, _x, _constructor;
      _x = false;
      $f = (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            function () {
              let $f, $newtarget, $this, $arguments;
              $f = void 0;
              $arguments = void 0;
              $f = callee;
              $newtarget = new.target;
              $this = (
                new.target ?
                {__proto__:#Reflect.get(new.target, "prototype")} :
                this);
              $arguments = #Object.assign(
                #Object.create(
                  #Object.prototype,
                  {
                    __proto__: null,
                    length: {
                      __proto__: null,
                      value: #Reflect.get(arguments, "length"),
                      writable: true,
                      enumerable: false,
                      configurable: true},
                    callee: {
                      __proto__: null,
                      get: #Function.prototype.arguments.__get__,
                      set: #Function.prototype.arguments.__set__,
                      enumerable: false,
                      configurable: false},
                    [#Symbol.iterator]: {
                      __proto__: null,
                      value: #Array.prototype.values,
                      writable: true,
                      enumerable: false,
                      configurable: true}}),
                arguments);
              {
                5;
                return ($newtarget ? $this : void 0); } },
            "length",
            {
              __proto__: null,
              value: 0,
              writable: false,
              enumerable: false,
              configurable: true}),
          "name",
          {
            __proto__: null,
            value: "f",
            writable: false,
            enumerable: false,
            configurable: true}),
        #Object.defineProperty(
          _constructor,
          "prototype",
          {
            __proto__: null,
            value: #Object.create(
              #Object.prototype,
              {
                __proto__: null,
                constructor: {
                  __proto__: null,
                  value: _constructor,
                  writable: true,
                  enumerable: false,
                  configurable: true}}),
            writable: true,
            enumerable: false,
            configurable: false}));
      if (
        (
          _matched ?
          true :
          (
            (_discriminant === 2) ?
            (
              _matched = true,
              true) :
            false)))
      {
        3;
        ($x = 4, _x = true); }
      else {}
      _matched = true;
      {
        (
          _x ?
          $x :
          throw new #ReferenceError("Cannot read from deadzone variable x"));
        _completion = 6; } } }`);
