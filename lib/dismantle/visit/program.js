
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope.js");

exports.Program = (node, scope1) => {
  const identifiers1 = ArrayLite.flatMap(node.body, Query.HoistVariables);
  if (!scope1 && !node.AranStrict)
    return Build.BLOCK(
      [],
      ArrayLite.concat(
        ArrayLite.flatMap(
          identifiers1,
          (identifier) => Build.Expression(
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                Build.builtin("global"),
                Build.primitive(identifier),
                Build.apply(
                  Build.builtin("AranInitialize"),
                  Build.primitive(void 0),
                  [
                    Build.primitive("init"),
                    Build.primitive("value"),
                    Build.primitive(void 0),
                    Build.primitive("init"),
                    Build.primitive("writable"),
                    Build.primitive(true),
                    Build.primitive("init"),
                    Build.primitive("enumerable"),
                    Build.primitive(true)])]))),
        Build.Block(
          Short.BLOCK(
            node.body,
            Scope.Root()))));
  const identifiers2 = Array_isArray(scope1) ? scope1 : [];
  const scope2 = Scope.Block(
    ArrayLite.concat(identifiers1, identifiers2),
    [],
    (
      scope1 && !Array_isArray(scope1) ?
      scope1 :
      Scope.Root()));
  const statements = ArrayLite.concat(
    ArrayLite.flatMap(
      identifiers1,
      (identifier) => Short.Declare(
        identifier,
        Build.primitive(void 0),
        scope2)),
    ArrayLite.flatMap(
      identifiers2,
      (identifier) => Short.Declare(
        identifier,
        Build.prelude(identifier),
        scope2)));
  return Build.BLOCK(
    Scope.qualifiers(scope2),
    ArrayLite.concat(
      statements,
      Build.Block(
        Short.BLOCK(node.body, scope2))));
};
