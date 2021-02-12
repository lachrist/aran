"use strict";

const ArrayLite = require("array-lite");
const Variable = require("./variable.js");

const scope = (source, variables) => (
  Throw.assert(source.type === "eval", null, `Invalid source for scope extensions`),
  {
    type: source.type,
    enclave: source.enclave,
    global: source.global,
    strict: source.strict,
    function: source.function,
    identifiers: ArrayLite.concat(
      source.identifiers,
      ArrayLite.map(
        ArrayLite.filter(variables, Variable.isRigid),
        Variable.getName))});