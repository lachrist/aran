
const ArrayLite = require("array-lite");
const Build = require("../../build.js");
const Visit = require("../visit.js");

const fresh = (identifiers, identifier) => (
  ArrayLite.includes(identifiers, identifier) ?
  fresh(identifiers, "$" + identifier) :
  identifier);

const undeclarables = (tag) => {
  if (tag === "program")
    return ["@this"];
  if (tag === "closure")
    return ["@callee", "@new.target", "@this", "@arguments"];
  if (tag === "catch")
    return ["@error"];
  return [];
};

exports.BLOCK = ({1:labels, 2:identifiers, 3:statements, 4:serial}, options) => Build.BLOCK(
  [],
  [],
  Build.Try(
    Build.BLOCK(
      labels,
      identifiers,
      ArrayLite.concat(
        (
          (
            (identifier1, identifiers) => Build.Block(
              Build.BLOCK(
                [],
                [identifier1],
                ArrayLite.concat(
                  Build.Assign(
                    identifier1,
                    options.trap.enter(
                      Build.primitive(tag),
                      Build.object(
                        Build.primitive(null),
                        ArrayLite.map(
                          identifiers
                          (identifier2) => [
                            Build.primitive(identifier2),
                            Build.read(identifier2)])))),
                  ArrayLite.flatMap(
                    identifiers,
                    (identifier2) => Build.Assign(
                      identifier2,
                      Build.apply(
                        Build.intrinsic("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Build.read(identifier1),
                          Build.primitive(identifier2)])))))))
          (
            fresh(identifiers, "$"),
            ArrayLite.concat(undeclarables(tag, identifiers)))),
        ArrayLite.flatMap(
          statements,
          (statement) => Visit.Statement(
            statement,
            {
              __proto__: null,
              trap:options.trap})),
        Build.Expression(
          options.trap.completion(serial)))),
    Build.BLOCK([], [], []),
    Build.BLOCK(
      [],
      [],
      Build.Expression(
        options.trap.leave(serial)))));
