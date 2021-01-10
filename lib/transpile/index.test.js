"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

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
      scope: null,
      serial: null,
      globals: [{kind:"var", name:"x"}],
      serials: new global.Map(),
      scopes: {__proto__:null},
      nodes: []}),
  new global.SyntaxError("Duplicate global variable named 'x' of kind let"));

Assert.throws(
  () => Transpile(
    ParseExternal(`var x = 123;`),
    {
      source: "eval",
      enclave: false,
      scope: null,
      serial: null,
      globals: [{kind:"let", name:"x"}],
      serials: new global.Map(),
      scopes: {__proto__:null},
      nodes: []}),
  new global.SyntaxError("Duplicate global variable named 'x' of kind var"));

["script", "eval"].forEach(
  (source) => (
    globals = [{kind:"function", name:"x"}],
    Lang._match(
      Transpile(
        ParseExternal(`
          var x = 123;
          456;`),
        {
          source: source,
          enclave: false,
          scope: null,
          serial: null,
          globals,
          serials: new global.Map(),
          scopes: {__proto__:null},
          nodes: []}),
      Lang._parse_program(`{
        let $this;
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
        return 456;}`),
      Assert),
    Assert.deepEqual(
      globals,
      [
        {kind:"function", name:"x"},
        {kind:"var", name:"x"}])));

Lang._match(
  Transpile(
    ParseExternal(`let x = 123;`),
    {
      source: "script",
      enclave: true,
      scope: null,
      serial: null,
      globals: [],
      serials: new global.Map(),
      scopes: {__proto__:null},
      nodes: []}),
  Lang._parse_program(`{
    let $this, _completion;
    _completion = void 0;
    $this = #aran.globalObjectRecord;
    enclave let x = 123;
    return _completion; }`),
  Assert);

globals = [];
Lang._match(
  Transpile(
    ParseExternal(`
      let x = 123;
      456;`),
    {
      source: "script",
      enclave: false,
      scope: null,
      serial: null,
      globals,
      serials: new global.Map(),
      scopes: {__proto__:null},
      nodes: []}),
  Lang._parse_program(`{
    let $this;
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
    return 456;}`),
  Assert);
Assert.deepEqual(
  globals,
  [{kind:"let", name:"x"}]);

globals = [];
Lang._match(
  Transpile(
    ParseExternal(`
      let x = 123;
      456;`),
    {
      source: "script",
      enclave: false,
      scope: null,
      serial: null,
      globals,
      serials: new global.Map(),
      scopes: {__proto__:null},
      nodes: []}),
  Lang._parse_program(`{
    let $this;
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
    return 456;}`),
  Assert);
Assert.deepEqual(
  globals,
  [{kind:"let", name:"x"}]);

["eval", "module"].forEach(
  (source) => (
    globals = [],
    Lang._match(
      Transpile(
        ParseExternal(`
          "use strict";
          var x = 123;
          let y = 456;
          789;`),
        {
          source: source,
          enclave: false,
          scope: null,
          serial: null,
          globals,
          serials: new global.Map(),
          scopes: {__proto__:null},
          nodes: []}),
      Lang._parse_program(`{
        let $this, $x, $y;
        $x = void 0;
        $this = #aran.globalObjectRecord;
        "use strict";
        $x = 123;
        $y = 456;
        ${source === "module" ? `789;` : `return 789;`} }`),
      Assert),
    Assert.deepEqual(
      globals,
      [])));

{
  const serials = new global.Map();
  const scopes = {__proto__:null};
  const nodes = [];
  Transpile(
    ParseExternal(
      `(() => {
          let x = 123;
          eval(456); });`),
    {
      source: "script",
      scope: null,
      serial: null,
      globals: [],
      serials,
      scopes,
      nodes});
  Assert.deepEqual(global.Reflect.ownKeys(scopes).length, 1);
  Transpile(
    ParseExternal(`var y = 123;`),
    {
      source: "eval",
      enclave: false,
      scope: global.JSON.parse(scopes[global.Reflect.ownKeys(scopes)[0]].stringified),
      serial: null,
      globals: [],
      scopes,
      nodes,
      serials});
  Assert.throws(
    () => Transpile(
      ParseExternal(`var x = 123;`),
      {
        source: "eval",
        enclave: false,
        scope: null,
        serial: global.Reflect.ownKeys(scopes)[0],
        globals: [],
        scopes,
        nodes,
        serials}),
    new global.SyntaxError("Duplicate local variable named 'x' of kind var")) }
