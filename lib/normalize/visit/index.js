"use strict";

const global_Error = global.Error;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const State = require("../state.js");

const abort = (message) => { throw new global_Error(message) };

let initialized = false;

const wrap = (closure) => (scope, node, context) => State._visit(
  node,
  closure,
  scope,
  node,
  context);

const initialize = (sources) => (
  initialized ?
  abort(`Visit is already initialized`) :
  (
    initialized = true,
    ArrayLite.forEach(
      sources,
      (source) => global_Object_assign(exports, source)),
    ArrayLite.forEach(
      global_Reflect_ownKeys(exports),
      (key) => (
        key !== "_test_init" &&
        key !== "_prod_init" &&
        (exports[key] = wrap(exports[key]))))));

exports._test_init = initialize;

exports._prod_init = () => initialize(
  [
    require("./key.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./statement.js"),
    require("./block.js")]);
