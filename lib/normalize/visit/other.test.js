"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("../../parse.js");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init(
  [
    require("./other.js"),
    {
      expression: (scope, node, context) => (
        Assert.deepEqual(context, null),
        Assert.deepEqual(node.type, "Literal"),
        Tree.primitive(node.value))}]);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // quasi //

  Assert.throws(
    () => Visit.quasi(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {computed: false}),
    new global.Error("Invalid quasi node")),

  Lang._match_expression(
    Visit.quasi(
      Scope._make_root(),
      Parse.script("`foo`").body[0].expression.quasis[0],
      null),
    Lang.parse_expression(`"foo"`),
    Assert);

  // key //

  Assert.throws(
    () => Visit.key(
      Scope._make_root(),
      Parse.script(`!123;`).body[0].expression,
      {computed: false}),
    new global.Error("Invalid non-computed key node")),

  Lang._match_expression(
    Visit.key(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {computed: true}),
    Lang.parse_expression(`123`),
    Assert);

  Lang._match_expression(
    Visit.key(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {computed: false}),
    Lang.parse_expression(`123`),
    Assert);

  Lang._match_expression(
    Visit.key(
      Scope._make_root(),
      Parse.script(`foo;`).body[0].expression,
      {computed: false}),
    Lang.parse_expression(`"foo"`),
    Assert);

  // member //

  Assert.throws(
    () => Visit.member(
      Scope._make_root(),
      Parse.script(`123[456];`).body[0].expression,
      {}),
    new global.Error("Missing callback"));

  Assert.throws(
    () => Visit.member(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {}),
    new global.Error("Invalid member node"));

  Lang._match_expression(
    Visit.member(
      Scope._make_root(),
      Parse.script(`123[456];`).body[0].expression,
      {callback: (box, expression) => Tree.sequence(
        Scope.get(
          Scope._make_root(),
          box),
        expression)}),
    Lang.parse_expression(`(
      123,
      #Reflect.get(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        456))`),
    Assert);

  Lang._match_expression(
    Visit.member(
      Scope._make_root(),
      Parse.script(`123?.[456];`).body[0].expression.expression,
      {callback: (box, expression) => Tree.sequence(
        Scope.get(
          Scope._make_root(),
          box),
        expression)}),
    Lang.parse_expression(`(
      123,
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          456)))`),
    Assert);

});
