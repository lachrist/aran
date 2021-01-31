"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../parse-external.js");
const Lang = require("../lang/index.js");
const Scope = require("./scope");
const Transpile = require("./index.js");

let globals = null;

Assert.throws(
  () => Transpile(
    ParseExternal(`let x = 123;`),
    {
      source: "script",
      enclave: false,
      serial: null,
      globals: [{kind:"var", name:"x"}],
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  new global.SyntaxError("Duplicate global variable named 'x' of kind let"));

Assert.throws(
  () => Transpile(
    ParseExternal(`var x = 123;`),
    {
      source: "eval",
      enclave: false,
      serial: null,
      globals: [{kind:"let", name:"x"}],
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  new global.SyntaxError("Duplicate global variable named 'x' of kind var"));

["script", "eval"].forEach(
  (source) => (
    globals = [{kind:"function", name:"x"}],
    Lang.match(
      Transpile(
        ParseExternal(`
          var x = 123;`),
        {
          source: source,
          enclave: false,
          serial: null,
          globals,
          serials: new global.Map(),
          evals: {__proto__:null},
          nodes: []}),
      Lang.parseProgram(`
        ${source};
        {
          let $this, _completion;
          (
            #Reflect.getOwnPropertyDescriptor(#aran.globalObjectRecord, "x") ?
            void 0 :
             #Object.defineProperty(
              #aran.globalObjectRecord,
              "x",
              {
                __proto__: null,
                value: void 0,
                writable: true,
                enumerable: true,
                configurable: ${source === "eval"}}));
          _completion = void 0;
          $this = #aran.globalObjectRecord;
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
            (
              (
                #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
                #aran.deadzoneMarker) ?
              throw new #ReferenceError("Cannot write to non-initialized dynamic variable named x") :
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
          completion _completion; }`),
      Assert),
    Assert.deepEqual(
      globals,
      [
        {kind:"function", name:"x"},
        {kind:"var", name:"x"}])));

Lang.match(
  Transpile(
    ParseExternal(`let x = 123;`),
    {
      source: "script",
      enclave: true,
      serial: null,
      globals: [],
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  Lang.parseProgram(`
    script;
    {
      let $this, _completion;
      _completion = void 0;
      $this = #aran.globalObjectRecord;
      enclave let x = 123;
      completion _completion; }`),
  Assert);

globals = [];
Lang.match(
  Transpile(
    ParseExternal(`
      let x = 123;`),
    {
      source: "script",
      enclave: false,
      serial: null,
      globals,
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  Lang.parseProgram(`
    script;
    {
      let $this, _completion;
      (
        #Reflect.getOwnPropertyDescriptor(#aran.globalDeclarativeRecord, "x") ?
        throw new #SyntaxError("Rigid variable of kind let named 'x' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
         #Object.defineProperty(
          #aran.globalDeclarativeRecord,
          "x",
          {
            __proto__: null,
            value: #aran.deadzoneMarker,
            writable: true,
            enumerable: true,
            configurable: true}));
      _completion = void 0;
      $this = #aran.globalObjectRecord;
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
           throw new #SyntaxError("Variable named 'x' has already been initialized (this should never happen, please consider submitting a bug repport)")) :
        throw new #SyntaxError("Variable named 'x' has not yet been declared (this should never happen, please consider submitting a bug repport)"));
      completion _completion; }`),
  Assert);
Assert.deepEqual(
  globals,
  [{kind:"let", name:"x"}]);

globals = [];
Lang.match(
  Transpile(
    ParseExternal(`
      let x = 123;`),
    {
      source: "script",
      enclave: false,
      serial: null,
      globals,
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  Lang.parseProgram(`
    script;
    {
      let $this, _completion;
      (
        #Reflect.getOwnPropertyDescriptor(#aran.globalDeclarativeRecord, "x") ?
        throw new #SyntaxError("Rigid variable of kind let named 'x' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
         #Object.defineProperty(
          #aran.globalDeclarativeRecord,
          "x",
          {
            __proto__: null,
            value: #aran.deadzoneMarker,
            writable: true,
            enumerable: true,
            configurable: true}));
      _completion = void 0;
      $this = #aran.globalObjectRecord;
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
           throw new #SyntaxError("Variable named 'x' has already been initialized (this should never happen, please consider submitting a bug repport)")) :
        throw new #SyntaxError("Variable named 'x' has not yet been declared (this should never happen, please consider submitting a bug repport)"));
      completion _completion; }`),
  Assert);
Assert.deepEqual(
  globals,
  [{kind:"let", name:"x"}]);

globals = [];
Lang.match(
  Transpile(
    ParseExternal(`
      "use strict";
      var x = 123;
      let y = 456;
      789;`),
    {
      source: "eval",
      enclave: false,
      serial: null,
      globals,
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  Lang.parseProgram(`
    eval;
    {
      let $this, $x, $y, _completion;
      $x = void 0;
      _completion = void 0;
      $this = #aran.globalObjectRecord;
      "use strict";
      $x = 123;
      $y = 456;
      _completion = 789;
      completion _completion; }`),
  Assert);
Assert.deepEqual(globals, []);

globals = [];
Lang.match(
  Transpile(
    ParseExternal(`
      "use strict";
      var x = 123;
      let y = 456;
      789;`),
    {
      source: "module",
      enclave: false,
      serial: null,
      globals,
      serials: new global.Map(),
      evals: {__proto__:null},
      nodes: []}),
  Lang.parseProgram(`
    module;
    {
      let $this, $x, $y;
      $x = void 0;
      $this = #aran.globalObjectRecord;
      "use strict";
      $x = 123;
      $y = 456;
      789;
      completion void 0; }`),
  Assert);
Assert.deepEqual(globals, []);

{
  const serials = new global.Map();
  const evals = {__proto__:null};
  const nodes = [];
  Transpile(
    ParseExternal(
      `(() => {
          let x = 123;
          eval(456); });`),
    {
      source: "script",
      serial: null,
      globals: [],
      serials,
      evals,
      nodes});
  Assert.deepEqual(global.Reflect.ownKeys(evals).length, 1);
  Transpile(
    ParseExternal(`var y = 123;`),
    {
      source: "eval",
      enclave: false,
      serial: global.Reflect.ownKeys(evals)[0],
      globals: [],
      evals,
      nodes,
      serials});
  Assert.throws(
    () => Transpile(
      ParseExternal(`var x = 123;`),
      {
        source: "eval",
        enclave: false,
        serial: global.Reflect.ownKeys(evals)[0],
        globals: [],
        evals,
        nodes,
        serials}),
    new global.SyntaxError("Duplicate local variable named 'x' of kind var"));
  Lang.match(
    Transpile(
      ParseExternal(`
        "use strict";
        var x = 123;`),
      {
        source: "eval",
        enclave: false,
        serial: global.Reflect.ownKeys(evals)[0],
        globals: [],
        evals,
        nodes,
        serials}),
    Lang.parseProgram(`
      eval ${ArrayLite.join(
        ArrayLite.map(
          evals[global.Reflect.ownKeys(evals)[0]].identifiers,
          (identifier) => ` §${identifier}`),
        "")};
      {
        let $x, _completion;
        $x = void 0;
        _completion = void 0;
        _completion = "use strict";
        $x = 123;
        completion _completion; }`),
    Assert); }
