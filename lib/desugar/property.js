
const Build = require("./build.js");
const Scope = require("./scope");

const objectify = (scope, token) => Build.conditional(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Scope.read(scope, token)),
    Build.primitive("object")),
  Scope.read(scope, token),
  Build.conditional(
    Build.binary(
      "===",
      Scope.read(scope, token),
      Build.primitive(void 0)),
    Scope.read(scope, token),
    Build.apply(
      Build.builtin("Object"),
      Build.primitive(void 0),
      [
        Scope.read(scope, token)])));

exports.set = (scope, token, expression1, expression2) => (
  Scope.GetStrict(scope) ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),
      [
        Scope.read(scope, token),
        expression1,
        expression2]),
    Build.primitive(true),
    Build.apply(
      Build.builtin("AranThrowTypeError"),
      Build.primitive(void 0),
      [
        Build.primitive("Cannot assign object property")])) :
  Build.apply(
    Build.builtin("Reflect.set"),
    Build.primitive(void 0),
    [
      objectify(scope, token),
      expression1,
      expression2]));

exports.get = (scope, token, expression) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [
    objectify(scope, token),
    expression]);

exports.getunsafe = (expression1, expression2) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.setunsafe = (expression1, expression2, expression3) => Build.apply(
  Build.builtin("Reflect.set"),
  Build.primitive(void 0),
  [expression1, expression2, expression3]);
