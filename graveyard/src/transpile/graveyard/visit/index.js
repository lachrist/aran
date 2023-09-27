"use strict";

const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const State = require("../state.js");

let initialized = false;

const wrap = (closure) => (scope, node, context) => State.visit(
  node,
  closure,
  scope,
  node,
  context);

const initialize = (sources) => (
  Throw.assert(!initialized, null, `Visit is already initialized`),
  initialized = true,
  ArrayLite.forEach(
    sources,
    (source) => ArrayLite.forEach(
        global_Reflect_ownKeys(source),
        (key) => exports[key] = wrap(source[key]))));

exports.initializeTest = initialize;

/* istanbul ignore next */
exports.initializeProd = () => initialize(
  [
    require("./other.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./link-statement.js"),
    require("./hoisted-statement.js"),
    require("./statement.js"),
    require("./block.js")]);
