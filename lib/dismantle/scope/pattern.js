
const ArrayLite = require("array-lite");
const Build = require("./build.js");
const Scope = require("./index.js");
const Visit = require("../visit");

const visitors = {};

visitors.MemberExpression = (scope, boolean, pattern, expression1, expression2) => (
  boolean ?
  (() => { throw new Error("Cannot have member expression in initialization context")}) :
  Scope.token(
    scope,
    Visit.node(pattern.object, scope, ""),
    (token) => set(
      scope,
      token,
      (
        pattern.computed ?
        Visit.node(pattern.property, scope, "") :
        Build.primitive(pattern.property.name)),
      expression1,
      expression2)));

visitors.Identifier = (scope, boolean, pattern, expression1, expression2) => (
  boolean ?
  Scope.initialize(scope, pattern.name, expression1, expression2) :
  Scope.write(scope, pattern.name, expression1, expression2));

visitors.AssignmentPattern = (scope, boolean, pattern, expression1, expression2) => Scope.token(
  scope,
  expression1,
  (token) => visitors[pattern.type](
    scope,
    boolean,
    node.left,
    Build.conditional(
      Build.binary(
        "===",
        Scope.read(scope, token),
        Build.primitive(void 0)),
      Visit.node(node.right, scope),
      Scope.read(scope, token)),
    expression2));

visitors.ObjectPattern = (scope, boolean, pattern, expression1, expression2) => Scope.token(
  scope,
  expression1,
  (token1) => Scope.token(
    scope,
    Build.conditional(
      Build.binary(
        "===",
        Scope.read(scpoe, token1),
        Build.primitive(null)),
      Build.apply(
        Build.builtin("AranThrowTypeError"),
        Build.primitive(void 0),
        [
          Build.primitive("Cannot destructure 'null'")]),
      Build.conditional(
        Build.binary(
          "===",
          Scope.read(scope, token1),
          Build.primitive(null)),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot destructure 'undefined'")]),
        Build.apply(
          Build.builtin("Object"),
          Build.primitive(void 0),
          [
            Scope.read(scope, token1)]))),
    (token2) => ArrayLite.reduceRight(
      pattern.properties,
      (expression3, pattern) => visitors[pattern.type](
        scope,
        boolean,
        pattern.value,
        Build.get(
          Scope.read(scope, token2),
          (
            pattern.computed ?
            Visit.node(pattern.key, scope) :
            Build.primitive(pattern.key.name || pattern.key.value))),
        expression3),
      expression2)));

visitors.ArrayPattern = (scope, boolean, pattern, expression1, expression2) => Scope.token(
  scope,
  expression1,
  (token1) => Scope.token(
    scope,
    Build.apply(
      Build.get(
        Build.apply(
          Build.builtin("Object"),
          Build.primitive(void 0),
          [token1]),
        Build.builtin("Symbol.iterator")),
      Scope.read(scope, token1),
      []),
    (token2) => ArrayLite.reduceRight(
      node.elements,
      (expression3, pattern) => visitors[pattern.type](
        scope,
        boolean,
        (
          node.type === "RestElement" ?
          node.argument :
          node),
        (
          node.type === "RestElement" ?
          Build.apply(
            Build.builtin("AranRest"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token2)]) :
          Build.get(
            Build.apply(
              Build.get(
                Scope.read(scope, token2),
                Build.primitive("next")),
              Scope.read(scope, token2),
              []),
              Build.primitive("value"))),
        expression3),
      expression2)));

const set = (scope, token, expression1, expression2, expression3) => (
  Scope.GetStrict(scope) ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),
      [
        Scope.read(scope, token),
        expression1,
        expression2]),
    expression3,
    Build.apply(
      Build.builtin("AranThrowTypeError"),
      Build.primitive(void 0),
      [
        Build.primitive("Cannot assign object property")])) :
  Build.sequence(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),
      [
        Build.conditional(
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Build.read(token1)),
            Build.primitive("object")),
          Build.read(token1),
          Build.conditional(
            Build.binary(
              "===",
              Build.read(token1),
              Build.primitive(void 0)),
            Build.read(token1),
            Build.apply(
              Build.builtin("Object"),
              Build.primitive(void 0),
              [
                Build.read(token1)]))),
        expression1,
        expression2]),
    expression3));

exports.update = (scope, prefix, operator, pattern, expression) => (
  pattern.type === "MemberExpression" ?
  Scope.token(
    scope,
    Visit.node(pattern.object, scope, ""),
    (token1) => Scope.token(
      scope,
      (
        node.computed ?
        Visit.node(pattern.property, scope, "") :
        Build.primitive(pattern.property.name)),
      (token2) => Scope.token(
        scope,
        (
          prefix ?
          Build.binary(
            "+",
            Build.get(
              Scope.read(scope, token1),
              Scope.read(scope, token2)),
            expression) :
          Build.get(
            Scope(scope, token1),
            Scope.read(scope, token2))),
        expression,
        (token3) => set(
          scope,
          token1,
          Scope.read(scope, token2),
          (
            prefix ?
            Scope.read(scope, token3) :
            Build.binary(
              operator,
              Scope.read(scope, token3),
              expression)),
          Scope.read(scope, token3))))) :
  (
    pattern.type === "Identifier" ?
    Scope.token(
      scope,
      (
        prefix ?
        Build.binary(
          operator,
          Scope.read(scope, pattern.name),
          expression) :
        Scope.read(scope, pattern.name)),
      (token) => Scope.write(
        scope,
        pattern.name,
        (
          prefix ?
          Scope.read(scope, token) :
          Build.binary(
            operator,
            Scope.read(scope, token),
            expression)),
        Scope.read(scope, token))) :
    (() => { throw new Error("Pattern cannot be updated")})));

exports.assign = (scope, boolean, pattern, expression) => (
  pattern.type === "MemberExpression" ?
  (
    boolean ?
    (() => { throw new Error("Cannot have member expression in initialization")}) :
    (
      pattern.computed ?
      Scope.token(
        scope,
        Visit.node(pattern.object, scope, ""),
        (token1) => Scope.token(
          scope,
          Visit.node(pattern.property, scope, ""),
          (token2) => Scope.token(
            scope,
            expression,
            (token3) => set(
              scope,
              token1,
              Scope.read(scope, token2),
              Scope.read(scope, token3),
              Scope.read(scope, token3))))) :
      Scope.token(
        scope,
        Visit.node(pattern.object, scope, ""),
        (token1) => Scope.token(
          scope,
          expression,
          (token2) => set(
            scope,
            token1,
            Build.primitive(pattern.property.name),
            Build.read(token2),
            Build.read(token2)))))) :
  Scope.token(
    scope,
    expression,
    (token) => visitors[pattern.type](
      scope,
      boolean,
      pattern,
      Scope.read(scope, token),
      Scope.read(scope, token))));
