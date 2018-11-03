
const Check = require("./1-check.js");
const Shorthand = require("./2-shorthand.js");
const Static = require("./3-static.js");
const Builtin = require("./4-builtin.js");
const Mangling = require("./5-mangling.js");
const Hoisting = require("./6-hoisting.js");

module.exports = (format, options) => {
  if (options.validate)
    format = Check(format);
  format = Shorthand(format);
  format = Static(format, options.namespace);
  format = Builtin(format);
  format = Mangling(format);
  format = Hoisting(format);
  return format;
};
