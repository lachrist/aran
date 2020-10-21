"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const parse = (code) => (
  typeof code === "string" ?
  Acorn.parse(
    code,
    {
      __proto__: null,
      ecmaVersion: 2020}) :
  code);

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const ScopeMeta = require("../scope/meta.js");
const Program = require("./index.js");

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
  Assert.throws(
    () => Program.VISIT(
      Scope._make_global(),
      Acorn.parse(
        `123;`,
        {
          __proto__: null,
          ecmaVersion: 2020,
          sourceType: "module"}),
      {__proto__:null, mode:"script"}),
    new Error("Unfortunately, Aran only supports scripts (i.e.: native modules are not supported at the moment)"));
  Lang._match_block(
    Program.VISIT(
      Scope._extend_binding_eval(
        Scope._extend_use_strict(
          Scope._make_global()),
        ScopeMeta._primitive_box("yo")),
      parse(``),
      {
        __proto__: null,
        mode: "local-eval",
        serial: 0}),
    Lang.PARSE_BLOCK(
      `{
        return void 0;}`),
    Assert);
  Lang._match_block(
    Program.VISIT(
      Scope._make_global(),
      parse(`
        123;
        456;`),
      {
        __proto__:null,
        mode: "script"}),
    Lang.PARSE_BLOCK(
      `{
        let $this;
        $this = #global;
        123;
        return 456;}`),
    Assert);
  Lang._match_block(
    Program.VISIT(
      Scope._make_global(),
      parse(`
        123;
        let x = 456;
        {
          var y = 789;}`),
      {
        __proto__: null,
        mode: "script"}),
    Lang.PARSE_BLOCK(
      `{
        let $this, $x, _completion;
        $this = #global;
        #Reflect.defineProperty(
          #global,
          "y",
          {
            __proto__: null,
            value: void 0,
            writable: true,
            enumerable: true});
        _completion = void 0;
        _completion = 123;
        $x = 456;
        {
          (
            #Reflect.has(#global, "y") ?
            #Reflect.set(#global, "y", 789) :
            #Reflect.defineProperty(
              #global,
              "y",
              {
                __proto__: null,
                value: 789,
                writable: true,
                enumerable: true,
                configurable: true}));}
        return _completion;}`),
    Assert);
  Lang._match_block(
    Program.VISIT(
      Scope._make_global(),
      parse(`
        "use strict";
        123;
        let x = 456;
        {
          var y = 789;}`),
      {
        __proto__: null,
        mode: "global-eval"}),
    Lang.PARSE_BLOCK(
      `{
        let $this, $x, $y, _completion;
        $this = #global;
        $y = void 0;
        _completion = void 0;
        "use strict";
        _completion = 123;
        $x = 456;
        {
          $y= 789;}
        return _completion;}`),
    Assert);
});
