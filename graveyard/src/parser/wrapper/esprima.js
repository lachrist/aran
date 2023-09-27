"use strict";

const global_Object_assign = global.Object.assign;
const global_Boolean = global.Boolean;

const Walker = require("./walker.js");

const names = {
  __proto__: null,
  "module": "parseModule",
  "script": "parseScript"};

exports.wrap = (Esprima, correction) => (code, type, options, offset, _node) => (
  options = global_Object_assign({__proto__:null}, options),
  _node = Esprima[names[type]](code, options),
  (
    correction &&
    (offset !== null) &&
    (
      global_Boolean(options.range) ||
      global_Boolean(options.loc)) &&
    Walker.walk(
      _node,
      callback,
      {
        range: global_Boolean(options.range),
        loc: global_Boolean(options.loc),
        offset: offset})),
  _node);

const callback = (node, options) => (
  node.type === "Program" ?
  (
    (
      options.range &&
      (
        node.range[1] -= (options.offset.range.start + options.offset.range.end))),
    (
      options.loc &&
      (
        node.loc.end.line -= (options.offset.line.start + options.offset.line.end)))) :
  (
    (
      options.range &&
      (
        node.range[0] -= options.offset.range.start,
        node.range[1] -= options.offset.range.start)),
    (
      options.loc &&
      (
        node.loc.start.line -= options.offset.line.start,
        node.loc.end.line -= options.offset.line.start))));
