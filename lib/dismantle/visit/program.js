
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope.js");
const Short = require("../short.js");
const Lexical = require("../lexical");

const Array_isArray = Array.isArray;

exports.Program = (node, scope, $names1, $names2, $names3) => (
  (
    scope ?
    (
      Array_isArray(scope) ?
      (
        $names1 = scope,
        $names2 = ArrayLite.filter(node.AranVariableNames, (name) => !ArrayLite.includes(scope, name)),
        $names3 = []) :
      (
        $names1 = [],
        $names2 = node.AranVariableNames,
        $names3 = [])) :
    (
      node.AranStrict ?
      (
        $names1 = [],
        $names2 = node.AranVariableNames,
        $names3 = []) :
      (
        $names1 = [],
        $names2 = [],
        $names3 = node.AranVariableNames))),
  Lexical.BLOCK(
    node.AranStrict,
    ArrayLite.concat($names1, $names2),
    [],
    (scope) => ArrayLite.concat(
      Build.Write(
        0,
        Build.primitive(void 0)),
      ArrayLite.flatMap(
        $names1,
        (name) => Lexical.Declare(
          name,
          Build.prelude(name),
          scope)),
      ArrayLite.flatMap(
        $names2,
        (name) => Lexical.Declare(
          name,
          Build.primitive(void 0),
          scope)),
      ArrayLite.flatMap(
        $names3,
        (name) => Build.Expression(
          Short.define(
            Build.builtin("global"),
            Build.primitive(name),
            Short.initialize(
              [
                [
                  "init",
                  Build.primitive("value"),
                  Build.primitive(void 0)],
                [
                  "init",
                  Build.primitive("writable"),
                  Build.primitive(true)],
                [
                  "init",
                  Build.primitive("enumerable"),
                  Build.primitive(true)]]))))),
    node.body,
    (
      !scope || Array_isArray(scope) ?
      Scope.Root() :
      scope)));
