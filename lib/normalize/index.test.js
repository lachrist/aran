"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Parse = require("../parse.js");
const Lang = require("../lang/index.js");
const Scope = require("./scope");
const Normalize = require("./index.js");

let global_variable_array = null;

Assert.throws(
  () => Normalize(
    Parse.script(`let x = 123;`),
    {
      source: "script",
      scope: null,
      global_variable_array: [{kind:"var", name:"x"}],
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  new global.SyntaxError("Duplicate global variable named 'x' of kind let"));

Assert.throws(
  () => Normalize(
    Parse.script(`var x = 123;`),
    {
      source: "eval",
      scope: null,
      global_variable_array: [{kind:"let", name:"x"}],
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  new global.SyntaxError("Duplicate global variable named 'x' of kind var"));

["script", "eval"].forEach(
  (source) => (
    global_variable_array = [{kind:"function", name:"x"}],
    Lang._match_block(
      Normalize(
        Parse.script(`
          var x = 123;
          456;`),
        {
          source: source,
          scope: null,
          global_variable_array,
          state: {
            serials: new global.Map(),
            scopes: {__proto__:null},
            nodes: []}}),
      Lang.PARSE_BLOCK(`{
        (
          #Reflect.has(#aran.globalObjectRecord, "x") ?
          void 0 :
           #Reflect.defineProperty(
            #aran.globalObjectRecord,
            "x",
            {
              __proto__: null,
              value: void 0,
              writable: true,
              enumerable: true,
              configurable: false}));
        (
          #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
          (
            (
              #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
              #aran.deadzoneMarker) ?
            throw new #ReferenceError("Cannot write to deadzone variable x") :
            (
              #Reflect.set(#aran.globalDeclarativeRecord, "x", 123) ?
              true :
              throw new #TypeError("Cannot set object property"))) :
          (
            #Reflect.has(#aran.globalObjectRecord, "x") ?
            #Reflect.set(#aran.globalObjectRecord, "x", 123) :
            #Reflect.defineProperty(
              #aran.globalObjectRecord,
              "x",
              {
                __proto__: null,
                value: 123,
                writable: true,
                enumerable: true,
                configurable: true})));
        return 456;}`),
      Assert),
    Assert.deepEqual(
      global_variable_array,
      [
        {kind:"function", name:"x"},
        {kind:"var", name:"x"}])));

global_variable_array = [];
Lang._match_block(
  Normalize(
    Parse.script(`
      let x = 123;
      456;`),
    {
      source: "script",
      scope: null,
      global_variable_array,
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  Lang.PARSE_BLOCK(`{
    (
      #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
      throw new #SyntaxError("Variable 'x' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
       #Reflect.defineProperty(
        #aran.globalDeclarativeRecord,
        "x",
        {
          __proto__: null,
          value: #aran.deadzoneMarker,
          writable: true,
          enumerable: true,
          configurable: false}));
    (
      #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
      (
        (
          #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
          #aran.deadzoneMarker) ?
        #Reflect.defineProperty(
          #aran.globalDeclarativeRecord,
          "x",
          {
            __proto__: null,
            value: 123}) :
         throw new #SyntaxError("Variable 'x' has already been initialized (this should never happen, please consider submitting a bug repport)")) :
      throw new #SyntaxError("Variable 'x' has not yet been declared (this should never happen, please consider submitting a bug repport)"));
    return 456;}`),
  Assert);
Assert.deepEqual(
  global_variable_array,
  [{kind:"let", name:"x"}]);

global_variable_array = [];
Lang._match_block(
  Normalize(
    Parse.script(`
      let x = 123;
      456;`),
    {
      source: "script",
      scope: null,
      global_variable_array,
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  Lang.PARSE_BLOCK(`{
    (
      #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
      throw new #SyntaxError("Variable 'x' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
       #Reflect.defineProperty(
        #aran.globalDeclarativeRecord,
        "x",
        {
          __proto__: null,
          value: #aran.deadzoneMarker,
          writable: true,
          enumerable: true,
          configurable: false}));
    (
      #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
      (
        (
          #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
          #aran.deadzoneMarker) ?
        #Reflect.defineProperty(
          #aran.globalDeclarativeRecord,
          "x",
          {
            __proto__: null,
            value: 123}) :
         throw new #SyntaxError("Variable 'x' has already been initialized (this should never happen, please consider submitting a bug repport)")) :
      throw new #SyntaxError("Variable 'x' has not yet been declared (this should never happen, please consider submitting a bug repport)"));
    return 456;}`),
  Assert);
Assert.deepEqual(
  global_variable_array,
  [{kind:"let", name:"x"}]);

["eval", "module"].forEach(
  (source) => (
    global_variable_array = [],
    Lang._match_block(
      Normalize(
        Parse.script(`
          "use strict";
          var x = 123;
          let y = 456;
          789;`),
        {
          source: source,
          scope: null,
          global_variable_array,
          state: {
            serials: new global.Map(),
            scopes: {__proto__:null},
            nodes: []}}),
      Lang.PARSE_BLOCK(`{
        let $x, $y;
        $x = void 0;
        "use strict";
        $x = 123;
        $y = 456;
        ${source === "module" ? `789;` : `return 789;`} }`),
      Assert),
    Assert.deepEqual(
      global_variable_array,
      [])));

{
  const state = {
    serials: new global.Map(),
    scopes: {__proto__:null},
    nodes: []};
  Normalize(
    Parse.script(
      `(() => {
          let x = 123;
          eval(456); });`),
    {
      source: "script",
      scope: null,
      state});
  Assert.deepEqual(global.Reflect.ownKeys(state.scopes).length, 1);
  const scope = global.JSON.parse(state.scopes[global.Reflect.ownKeys(state.scopes)[0]]);
  Normalize(
    Parse.script(`var y = 123;`),
    {
      source: "eval",
      global_variable_array: [],
      scope,
      state});
  Assert.throws(
    () => Normalize(
      Parse.script(`var x = 123;`),
      {
        source: "eval",
        global_variable_array: [],
        scope,
        state}),
    new global.SyntaxError("Duplicate local variable named 'x' of kind var")) }
