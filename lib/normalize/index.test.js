"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Parse = require("../parse.js");
const Lang = require("../lang/index.js");
const Normalize = require("./index.js");

let global_array_variable = null

global_array_variable = [];
Lang._match_block(
  Normalize(
    null,
    Parse.script(`
      var x = 123;
      456;`),
    {
      source: "script",
      global_array_variable,
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  Lang.PARSE_BLOCK(`{
    return 456; }`),
  Assert);

Lang._match_block(
  Normalize(
    null,
    Parse.script(`var x = 123;`),
    {
      source: "module",
      global_array_variable: [],
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  Lang.PARSE_BLOCK(`{
    123; }`),
  Assert);

Lang._match_block(
  Normalize(
    null,
    Parse.script(`123;`),
    {
      source: "module",
      global_array_variable: [],
      state: {
        serials: new global.Map(),
        scopes: {__proto__:null},
        nodes: []}}),
  Lang.PARSE_BLOCK(`{
    123; }`),
  Assert);

// const scopes = {__proto__:null};
//
// Lang._match_block(
//   Normalize(
//     null,
//     Parse.script(`
//       "use strict";
//       let x = 123;
//       eval(456);`),
//     {
//       source: "global-eval",
//       state: {
//         serials: new global.Map(),
//         scopes: scopes,
//         nodes: []}}),
//   Lang.PARSE_BLOCK(`{
//     let $x, $this, _eval;
//     $this = #global;
//     "use strict";
//     $x = 123;
//     return (
//       _eval = (
//         #Reflect.has(#global, "eval") ?
//         #Reflect.get(#global, "eval") :
//         throw new #ReferenceError("eval is not defined")),
//       (
//         (_eval === #eval) ?
//         eval(456) :
//         _eval(456)));}`),
//   Assert);

// Assert.deepEqual(global.Reflect.ownKeys(scopes).length, 1);

// Lang._match_block(
//   Normalize(
//     parse(`x`),
//     {
//       __proto__: null,
//       mode: "local-eval",
//       serial: global.Reflect.ownKeys(scopes)[0]},
//     {
//       __proto__: null,
//       serials: new Map(),
//       scopes: scopes,
//       nodes: []}),
//   Lang.PARSE_BLOCK(`{
//     return $x;}`),
//   Assert);
