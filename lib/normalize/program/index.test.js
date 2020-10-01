"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const ArrayLite = require("array-lite");
const Program = require("./index.js");

const parse = (code) => (
  typeof code === "string" ?
  Acorn.parse(
    code,
    {
      __proto__: null,
      ecmaVersion: 2020}) :
  code);

const base = (identifier) => (
  identifier === "new.target" ?
  "$0newtarget" :
  "$" + identifier);

const meta = (identifier) => "_" + identifier;

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {
  Assert.throws(
    () => Program.VISIT(
      Scope._make_root(),
      Acorn.parse(
        `123;`,
        {
          __proto__: null,
          ecmaVersion: 2020,
          sourceType: "module"})),
    new Error("Unfortunately, Aran only supports scripts (i.e.: native modules are not supported at the moment)"));
  Lang._match_block(
    Program.VISIT(
      Scope._make_root(),
      parse(`123;`)),
    Lang.PARSE_BLOCK(
      `{
        let ${base("this")};
        ${base("this")} = #global;
        return 123;}`),
    Assert);
  Lang._match_block(
    Program.VISIT(
      Scope._make_root(),
      parse(`
        123;
        let x = 456;
        {
          var y = 789;}`)),
    Lang.PARSE_BLOCK(
      `{
        let ${base("this")}, ${base("x")}, ${meta("completion")};
        ${base("this")} = #global;
        #Reflect.defineProperty(
          #global,
          "y",
          {
            __proto__: null,
            value: void 0,
            writable: true,
            enumerable: true});
        ${meta("completion")} = void 0;
        ${meta("completion")} = 123;
        ${base("x")} = 456;
        {
          #Reflect.set(#global, "y", 789);}
        return ${meta("completion")};}`),
    Assert);
  Lang._match_block(
    Program.VISIT(
      Scope._make_root(),
      parse(`
        "use strict";
        123;
        let x = 456;
        {
          var y = 789;}`)),
    Lang.PARSE_BLOCK(
      `{
        let ${base("this")}, ${base("x")}, ${base("y")}, ${meta("completion")};
        ${base("this")} = #global;
        ${base("y")} = void 0;
        ${meta("completion")} = void 0;
        "use strict";
        ${meta("completion")} = 123;
        ${base("x")} = 456;
        {
          ${base("y")} = 789;}
        return ${meta("completion")};}`),
    Assert);
  Lang._match_block(
    Program.VISIT(
      Scope._make_root(),
      parse(`eval(x)`)
});
