
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Visit = require("../visit");
const Scope = require("./index.js");

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
      Build.primordial("Object"),
      Build.primitive(void 0),
      [
        Scope.read(scope, token)])));

const set = (scope, token, expression1, expression2) => (
  Scope.GetStrict(scope) ?
  Build.conditional(
    Build.apply(
      Build.primordial("Reflect.set"),
      Build.primitive(void 0),
      [
        Scope.read(scope, token),
        expression1,
        expression2]),
    Build.primitive(true),
    Build.apply(
      Scope.read(
        scope,
        Scope.GetToken(scope, "HelperThrowTypeError")),
      Build.primitive(void 0),
      [
        Build.primitive("Cannot assign object property")])) :
  Build.apply(
    Build.primordial("Reflect.set"),
    Build.primitive(void 0),
    [
      objectify(scope, token),
      expression1,
      expression2]));

const get = (scope, token, expression) => Build.apply(
  Build.primordial("Reflect.get"),
  Build.primitive(void 0),
  [
    objectify(scope, token),
    expression]);

const visitors = {};

const visit = (scope, boolean, pattern, expression1, expression2) =>
  visitors[pattern.type](scope, boolean, pattern, expression1, expression2);

visitors.MemberExpression = (scope, boolean, pattern, expression1, expression2) => (
  boolean ?
  (() => { throw new Error("Cannot have member expression in initialization context")}) :
  Scope.token(
    scope,
    Visit.node(pattern.object, scope, ""),
    (token) => Build.sequence(
      set(
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
  (token) => visit(
    scope,
    boolean,
    pattern.left,
    Build.conditional(
      Build.binary(
        "===",
        Scope.read(scope, token),
        Build.primitive(void 0)),
      Visit.node(pattern.right, scope, ""),
      Scope.read(scope, token)),
    expression2));

visitors.ObjectPattern = (scope, boolean, pattern, expression1, expression2) => Scope.token(
  scope,
  expression1,
  (token1) => (    
    (
      pattern.properties.length &&
      pattern.properties[pattern.properties.length-1].type === "RestElement") ?
    Scope.token(
      scope,
      Build.apply(
        Build.primordial("Array.of"),
        Build.primitive(void 0),
        []),
      (token2) => ArrayLite.reduceRight(
        pattern.properties,
        (expression3, pattern) => (
          pattern.type === "RestElement" ?
          visit(
            scope,
            boolean,
            pattern.argument,
            Build.apply(
              Scope.read(
                scope,
                Scope.GetToken(scope, "HelperObjectRest")),
              Build.primitive(void 0),
              [
                objectify(
                  scope,
                  Scope.read(scope, token1)),
                Scope.read(scope, token2)]),
            expression3) :      
          Scope.token(
            scope,
            (
              pattern.computed ?
              Visit.node(pattern.key, scope, "") :
              Build.primitive(pattern.key.name || pattern.key.value)),
            (token3) => Build.sequence(
              Build.apply(
                Build.primordial("Array.prototype.push"),
                Scope.read(token2),
                [
                  Scope.read(scope, token3)]),
              visit(
                scope,
                boolean,
                pattern.value,
                get(
                  scope,
                  token1,
                  Scope.read(scope, token3)),
                expression3)))),
        expression2)) :
    ArrayLite.reduceRight(
      pattern.properties,
      (expression3, pattern) => visit(
        scope,
        boolean,
        pattern.value,
        get(
          scope,
          token1,
          (
            pattern.computed ?
            Visit.node(pattern.key, scope, "") :
            Build.primitive(pattern.key.name || pattern.key.value))),
        expression3),
      expression2)));

visitors.ArrayPattern = (scope, boolean, pattern, expression1, expression2) => Scope.token(
  scope,
  expression1,
  (token) => Scope.token(
    scope,
    Build.apply(
      get(
        scope,
        token,
        Build.primordial("Symbol.iterator")),
      Scope.read(scope, token),
      []),
    (token) => ArrayLite.reduceRight(
      pattern.elements,
      (expression3, pattern) => visit(
        scope,
        boolean,
        (
          pattern.type === "RestElement" ?
          pattern.argument :
          pattern),
        (
          pattern.type === "RestElement" ?
          Build.apply(
            Scope.read(
              scope,
              Scope.GetToken(scope, "HelperIteratorRest")),
            Build.primitive(void 0),
            [
              Scope.read(scope, token)]) :
          Build.apply(
            Build.primordial("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.apply(
                  Build.primordial("Reflect.get"),
                  Build.primitive(void 0),
                  [
                    Scope.read(scope, token),
                    Build.primitive("next")]),
                Scope.read(scope, token),
                []),
              Build.primitive("value")])),
        expression3),
      expression2)));

exports.Update = (scope, operator, pattern, expression) => (
  pattern.type === "MemberExpression" ?
  Scope.Token(
    scope,
    Visit.node(pattern.object, scope, ""),
    (token1) => Scope.Token(
      scope,
      (
        pattern.computed ?
        Visit.node(pattern.property, scope, "") :
        Build.primitive(pattern.property.name)),
      (token2) => Build.Expression(
        set(
          scope,
          token1,
          Scope.read(scope, token2),
          Build.binary(
            operator,
            get(
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
    Scope.Token(
      scope,
      Visit.node(pattern.object, scope, ""),
      (token) => Build.Expression(
        set(
          scope,
          token,
          (
            pattern.computed ?
            Visit.node(pattern.property, scope, "") :
            Build.primitive(pattern.property.name)),
          expression)))) :
  (
    pattern.type === "Identifier" ?
    Scope[boolean ? "Initialize" : "Write"](
      scope,
      pattern.name,
      expression) :
    Build.Expression(
      visit(
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
        pattern.computed ?
        Visit.node(pattern.property, scope, "") :
        Build.primitive(pattern.property.name)),
      (token2) => Scope.token(
        scope,
        (
          prefix ?
          Build.binary(
            "+",
            get(
              scope,
              token1,
              Scope.read(scope, token2)),
            expression) :
          get(
            scope,
            token1,
            Scope.read(scope, token2))),
        (token3) => Build.sequence(
          set(
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
              set(
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
            set(
              scope,
              token1,
              Build.primitive(pattern.property.name),
              Scope.read(scope, token2)),
            Scope.read(scope, token2)))))) :
  Scope.token(
    scope,
    expression,
    (token) => visit(
      scope,
      boolean,
      pattern,
      Scope.read(scope, token),
      Scope.read(scope, token))));
