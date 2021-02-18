"use strict";

const global_Object_assign = global.Object.assign;
const global_Boolean = global.Boolean;

const Walker = require("./walker.js");

exports.wrap = (Acorn, correction) => (code, type, options, offset, _node) => (
  options = global_Object_assign(
    {
      __proto__: null,
      ecmaVersion: 2021},
    options,
    {sourceType:type}),
  _node = Acorn.parse(code, options),
  (
    correction &&
    (offset !== null) &&
    Walker.walk(
      _node,
      callback,
      {
        ranges: global_Boolean(options.ranges),
        locations: global_Boolean(options.locations),
        offset: offset})),
  _node);

// If the code does not end with a newline character Program.loc.end.column will not be correct

const callback = (node, options) => (
  node.type === "Program" ?
  (
    node.end -= (options.offset.range.start + options.offset.range.end),
    (
      options.ranges &&
      (
        node.range[1] -= (options.offset.range.start + options.offset.range.end))),
    (
      options.locations &&
      (
        node.loc.end.line -= (options.offset.line.start + options.offset.line.end)))) :
  (
    node.start -= options.offset.range.start,
    node.end -= options.offset.range.start,
    (
      options.ranges &&
      (
        node.range[0] -= options.offset.range.start,
        node.range[1] -= options.offset.range.start)),
    (
      options.locations &&
      (
        node.loc.start.line -= options.offset.line.start,
        node.loc.end.line -= options.offset.line.start))));

