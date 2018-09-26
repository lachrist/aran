
const Check = require("./1-check.js");
const Hoisting = require("./2-hoisting.js");
const Static = require("./3-static.js");
const Builtin = require("./4-builtin.js");
const Completion = require("./5-completion.js");
const Identifier = require("./6-identifier.js");
const Mixbag = require("./7-mixbag.js");

module.exports = (format, options) => Mixbag(
  Identifier(
    Completion(
      Builtin(
        Static(
          Hoisting(
            (options.validate ? Check : identity)(format)),
          options.namespace)))));
