
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Property = require("./property.js");
const Convert = require("./convert.js");

const loop = (strict, pattern, token, scope) => loopers[pattern.type](strict, pattern, token, scope);

loopers.Identifier = (strict, pattern, token, scope) => (
  strict === null ?
  Identifier.declare(
    pattern.name,
    Build.read(token),
    Build.primitive(void 0),
    scope) :
  Identifier.write(strict, pattern.name, token, scope));

loopers.AssignmentPattern = (strict, pattern, token, scope, $token) => Build.write(
  $token = Scope.token(scope),
  Build.conditional(
    Short.binary(
      "===",
      Build.read(token),
      Build.primitive(void 0)),
    Visit.expression(node.right, scope),
    Build.read(token)),
  loop(strict, pattern.left, $token, scope));

loopers.ObjectPattern = (strict, pattern, token, scope, $token) => ArrayLite.reduce(
  pattern.properties,
  (expression, property, $token) => Build.sequence(
    expression,
    Build.write(
      $token = Scope.token(scope),
      Property.get(
        Convert.object(
          Build.read(token)),
        (
          property.computed ?
          Visit.expression(property.key, scope) :
          Build.primitive(property.key.name || property.key.value))),
      loop(strict, property.value, $token, scope))));

// NICE-TO-HAVE:
// Normally objects involved in iteratation should be checked to provide an explicit error message.
// Here we settle down with the generic error message thrown by Reflect.get

loopers.ArrayPattern = (strict, pattern, token, scope, $token1) => Build.write(
  $token1 = Scope.token(scope),
  Build.apply(
    get(
      true, // converted even in strict mode
      Build.read(token),
      Build.builtin("Symbol.iterator")),
    Build.read(token),
    []),
  ArrayLite.reduce(
    pattern.elements,
    (expression, element, $token2) => Build.sequence(
      expression,
      Build.write(
        $token2 = Scope.token(scope),
        (
          element.type === "RestElement" ?
          Build.apply(
            Build.builtin("AranRest"),
            Build.primitive(void 0),
            [
              Build.read($token1)]) :
          Build.get(
            false, // generic error message
            Build.apply(
              get(
                false, // generic error message
                Build.read($token1),
                Build.primitive("next")),
              Build.read($token1),
              []),
            Build.primitive("value"))),
        loop(
          strict,
          element.type === "RestElement" ? element.argument : element,
          $token2,
          scope))),
    Build.primitive(void 0)));

exports.assign = loop;
