"use strict";

const Scoping = require("./scoping.js");

ArrayLite.forEach(
  variables,
  (variable1) => ArrayLite.forEach(
    _variables,
    (variable2) => Throw.assert(
      (
        variable1.name !== variable2.name ||
        (
          (
            variable1.kind === "var" ||
            variable1.kind === "function") &&
          (
            variable2.kind === "var" ||
            variable2.kind === "function"))),
      Throw.SyntaxError,
      `Duplicate variable declaration named ${variable1.name}`))),
ArrayLite.concat(variables, _variables));
