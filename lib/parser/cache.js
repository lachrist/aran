"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_Map = global.Map;
const global_Map_prototype_has = global.Map.prototype.has;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Map_prototype_set = global.Map.prototype.set;

const Throw = require("../throw.js");

const has = (map, key) => global_Reflect_apply(
  global_Map_prototype_has,
  map,
  [key]);

const get = (map, key) => (
  Throw.assert(
    has(map, key),
    null,
    `Cache miss`),
  global_Reflect_apply(
    global_Map_prototype_get,
    map,
    [key]));

const set = (map, key, value) => (
  Throw.assert(
    !has(map, key),
    null,
    `Cache overwritting`),
  global_Reflect_apply(
    global_Map_prototype_set,
    map,
    [key, value]));

exports.make = () => ({
  hoistings: new global_Map(),
  stricts: new global_Map(),
  evals: new global_Map(),
  sources: new global_Map()});

exports.setHoisting = (query, node, variables) => set(query.hoistings, node, variables);
exports.getHoisting = (query, node) => get(query.hoistings, node);

exports.setUseStrictDirective = (query, node, boolean) => set(query.stricts, node, boolean);
exports.hasUseStrictDirective = (query, node) => get(query.stricts, node);

exports.setDirectEvalCall = (query, node, boolean) => set(query.evals, node, boolean);
exports.hasDirectEvalCall = (query, node) => get(query.evals, node);

exports.setSource = (query, node, source) => set(query.sources, node, source);
exports.getSource = (query, node, source) => get(query.sources, node);
