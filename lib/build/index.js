
const Check = require("./1-check.js");
const Hoisting = require("./2-hoisting.js");
const Shorthand = require("./3-shorthand.js");
const Static = require("./4-static.js");
const Builtin = require("./5-builtin.js");
const Completion = require("./6-completion.js");
const Identifier = require("./7-identifier.js");
const Cleanup = require("./7-cleanup.js");

module.exports = (format, options) => Cleanup(
  Identifier(
    Completion(
      Builtin(
        Static(
          Shorthand(
            Hoisting(
              (options.validate ? Check : identity)(format))),
          options.namespace)))));
