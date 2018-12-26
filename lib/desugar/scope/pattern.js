
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Visit = require("../visit");
const Property = require("../property.js");
const Scope = require("./index.js");

const visitors = {};

visitors.MemberExpression = (scope, boolean, pattern, expression1, expression2) => (
  boolean ?
  (() => { throw new Error("Cannot have member expression in initialization context")}) :
  Scope.token(
    scope,
    Visit.node(pattern.object, scope, ""),
    (token) => Build.sequence(
      Property.set(
        scope,
        token,
        (
          pattern.computed ?
          Visit.node(pattern.property, scope, "") :
          Build.primitive(pattern.property.name)),
        expression1),
      expression2)));

visitors.Identifier = (scope, boolean, pattern, expression1, expression2) =>
  Scope[boolean ? "initialize" : "write"](scope, pattern.name, expression1, expression2);

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
  (token) => ArrayLite.reduceRight(
    pattern.properties,
    (expression3, pattern) => visitors[pattern.type](
      scope,
      boolean,
      pattern.value,
      Property.get(
        scope,
        token,
        (
          pattern.computed ?
          Visit.node(pattern.key, scope) :
          Build.primitive(pattern.key.name || pattern.key.value))),
      expression3),
    expression2));

visitors.ArrayPattern = (scope, boolean, pattern, expression1, expression2) => Scope.token(
  scope,
  expression1,
  (token) => Scope.token(
    scope,
    Build.apply(
      Property.get(
        scope,
        token,
        Build.builtin("Symbol.iterator")),
      Scope.read(scope, token),
      []),
    (token) => ArrayLite.reduceRight(
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
              Scope.read(scope, token)]) :
          Property.getunsafe(
            Build.apply(
              Property.getunsafe(
                Scope.read(scope, token),
                Build.primitive("next")),
              Scope.read(scope, token),
              []),
            Build.primitive("value"))),
        expression3),
      expression2)));

exports.Update = (scope, operator, pattern, expression) => (
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
      (token2) => Build.Expression(
        Property.set(
          scope,
          token1,
          Scope.read(scope, token2),
          Build.binary(
            operator,
            Property.get(
              scope,
              token1,
              Scope.read(scope, token2)),
            expression))))) :
  (
    pattern.type === "Identifier" ?
    Scope.Write(
      scope,
      pattern.name,
      Build.binary(
        operator,
        Scope.read(scope, pattern.name),
        expression)) :
    (() => { throw new Error("Pattern cannot be updated")})));

exports.Assign = (scope, boolean, pattern, expression) => (
  pattern.type === "MemberExpression" ?
  (
    boolean ?
    (() => { throw new Error("Cannot have member expression in initialization")}) :
    Build.Expression(
      Scope.token(
        scope,
        Visit.node(scope, pattern.object),
        (token) => Property.set(
          scope,
          token,
          (
            pattern.computed ?
            Visit.node(scope, pattern.property) :
            Build.primitive(pattern.property.name)),
          expression)))) :
  (
    pattern.type === "Identifier" ?
    Scope[boolean ? "Initialize" : "Write"](
      scope,
      pattern.name,
      expression) :
    Build.Expression(
      visitors[pattern.type](
        scope,
        boolean,
        pattern,
        expression,
        Build.primitive(void 0)))));

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
            Property.get(
              scope,
              token1,
              Scope.read(scope, token2)),
            expression) :
          Property.get(
            scope,
            token1,
            Scope.read(scope, token2))),
        expression,
        (token3) => Build.sequence(
          Property.set(
            scope,
            token1,
            Scope.read(scope, token2),
            (
              prefix ?
              Scope.read(scope, token3) :
              Build.binary(
                operator,
                Scope.read(scope, token3),
                expression))),
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
            (token3) => Build.sequence(
              Property.set(
                scope,
                token1,
                Scope.read(scope, token2),
                Scope.read(scope, token3)),
              Scope.read(scope, token3))))) :
      Scope.token(
        scope,
        Visit.node(pattern.object, scope, ""),
        (token1) => Scope.token(
          scope,
          expression,
          (token2) => Build.sequence(
            Property.set(
              scope,
              token1,
              Build.primitive(pattern.property.name),
              Build.read(token2)),
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
