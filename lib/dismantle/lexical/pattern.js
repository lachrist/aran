
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Short = require("../short.js");
const Scope = require("./scope.js");
const Name = require("./name.js");
const Visit = require("../visit");

const loop = (strict, pattern, expression1, expression2, scope) => loopers[pattern.type](strict, pattern, expression1, expression2, scope);

exports.assign = loop;

const loopers = {};

loopers.Identifier = (strict, pattern, expression1, expression2, scope) => (
  strict === null ?
  Scope.declare(pattern, expression1, expression2, scope) :
  Name.write(strict, pattern, expression1, expression2, scope));

loopers.AssignmentPattern = (strict, pattern, expression1, expression2) => Scope.token(
  expression1,
  (token) => loop(
    strict,
    pattern.left,
    Build.conditional(
      Build.binary(
        "===",
        Build.read(token),
        Build.primitive(void 0)),
      Visit.expression(node.right, scope),
      Build.read(token)),
    expression2,
    scope),
  scope);

loopers.ObjectPattern = (strict, pattern, expression1, expression2, $token1, $token2) => Scope.token(
  expression1,
  (token1) => Scope.token(
    Build.conditional(
      Build.binary(
        "===",
        Build.read(token1),
        Build.primitive(null)),
      Build.apply(
        Build.builtin("AranThrowTypeError"),
        Build.primitive(void 0),
        [
          "Cannot destructure 'null'"]),
      Build.conditional(
        Build.binary(
          "===",
          Build.read(token1),
          Build.primitive(null)),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            "Cannot destructure 'undefined'"]),
        Build.apply(
          Build.builtin("Object"),
          Build.primitive(void 0),
          [
            Build.read(token1)]))),
    (token2) => ArrayLite.reduceRight(
      param.properties,
      (expression3, property) => loop(
        strict,
        property.value,
        Build.apply(
          Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.read(token2),
            (
              property.computed ?
              Visit.expression(property.key, scope) :
              Build.primitive(property.key.name || property.key.value))]),
        expression3,
        scope),
      expression2),
    scope),
  scope);

loopers.ArrayPattern = (strict, pattern, expression1, expression2, scope) => Scope.token(
  expression1,
  (token1) => Scope.token(
    Build.apply(
      Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [  
          Build.apply(
            Build.builtin("Object"),
            Build.primitive(void 0),
            [token1]),
          Build.builtin("iterator")]),
      Build.read(token1),
      []),
    (token2) => ArrayLite.reduceRight(
      node.elements,
      (expression3, pattern) => loop(
        strict,
        (
          pattern.type === "RestElement" ?
          Build.apply(
            Build.builtin("AranRest"),
            Build.primitive(void 0),
            [
              Build.read(token2)]) :
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.apply(
                  Build.builtin("Reflect.get"),
                  Build.primitive(void 0),
                  [
                    Build.read(token2),
                    Build.primitive("next")]),
                Build.read(token2),
                []),
              Build.primitive("value")])),
        (
          pattern.type === "RestElement" ?
          pattern.argument :
          pattern),
        expression3,
        scope),
      expression2),
    scope),
  scope);
