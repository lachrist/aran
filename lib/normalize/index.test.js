"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Normalize = require("./index.js");
const Lang = require("../lang/index.js");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

const scopes = {__proto__:null};

Lang._match_block(
  Normalize(
    null,
    parse(`
      "use strict";
      let x = 123;
      eval(456);`),
    {
      __proto__: null,
      serials: new Map(),
      scopes: scopes,
      nodes: []}),
  Lang.PARSE_BLOCK(`{
    let $x, $this, _eval;
    $this = #global;
    "use strict";
    $x = 123;
    return (
      _eval = (
        #Reflect.has(#global, "eval") ?
        #Reflect.get(#global, "eval") :
        throw new #ReferenceError("eval is not defined")),
      (
        (_eval === #eval) ?
        eval(§$this, §$x, §_eval, 456) :
        _eval(456)));}`),
  Assert);

Assert.deepEqual(Reflect.ownKeys(scopes).length, 1);

Lang._match_block(
  Normalize(
    Reflect.ownKeys(scopes)[0],
    parse(`x`),
    {
      __proto__: null,
      serials: new Map(),
      scopes: scopes,
      nodes: []}),
  Lang.PARSE_BLOCK(`{
    return $x;}`),
  Assert);

Assert.throws(
  () => Normalize(
    "foo",
    parse(`x`),
    {
      __proto__: null,
      serials: new Map(),
      scopes: scopes,
      nodes: []}),
  new Error("The provided serial number does not correspond to a previously registered scope..."));
