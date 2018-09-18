
const ArrayLite = require("array-lite");
const Static = require("./static.js");
const Identifier = require("./identifier.js");
const Protect = require("./protect.js");
const Strict = require("./strict.js");
const Completion = require("./completion.js");

const Object_create = Object.create;
const Object_assign = Object.assign;

module.exports = (format, namespace) => {
  const static = Static(format, namespace);
  const protect = Protect(format, static);
  const strict = Strict(format, static);
  const identifier = Identifier(format, static);
  const completion = Completion(format, static);
  return Object_assign(
    Object_create(format),
    protect,
    strict,
    identifier,
    completion,
    {
      eval: (expression) => format.apply(
        format.read("eval"),
        [
          expression]),
      Setup: () => format.If(
        static.load("global"),
        [],
        ArrayLite.concat(
          protect.Setup(),
          strict.Setup(),
          completion.Setup(),
          identifier.Setup()))});
};
