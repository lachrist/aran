"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

require("./tree.js")._toggle_debug_mode();
const Instrument = require("./instrument.js");
const Lang = require("./lang");

const NAMESPACE = "FOO";

const trap = (name, args) => `(
  #Reflect.get(${NAMESPACE}, ${JSON.stringify(name)})
  (
    @${NAMESPACE}
    ${ArrayLite.join(ArrayLite.map(args, (arg) => `, ${arg}`), "")}))`;

Lang._match_block(
  Instrument(
    Lang.PARSE_BLOCK(`{
      123;}`),
    {
      __proto__: null,
      tag: "program",
      pointcut: true,
      serials: new Map(),
      nodes: [],
      namespace: NAMESPACE}),
  Lang.PARSE_BLOCK(`{
    ${trap("primitive", "123", "void 0")};}`));
