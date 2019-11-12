
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Visit = require("../visit");
const Scope = require("./scope.js");

const objectify = (scope, identifier) => Build.conditional(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Scope.Build.read(scope, identifier)),
    Build.primitive("object")),
  Scope.Build.read(scope, identifier),
  Build.conditional(
    Build.binary(
      "===",
      Scope.read(scope, identifier),
      Build.primitive(void 0)),
    Scope.Build.read(scope, identifier),
    Build.apply(
      Build.builtin("Object"),
      Build.primitive(void 0),
      [
        Scope.Build.read(scope, identifier)])));

const set = (scope, identifier, expression1, expression2) => (
  Scope.Build.IsStrict(scope) ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),
      [
        Scope.Build.read(scope, identifier),
        expression1,
        expression2]),
    Build.primitive(true),
    Build.throw(
      Build.construct(
        Build.builtin("TypeError"),
        [
          Build.primitive("Cannot assign object property")]))) :
  Build.apply(
    Build.builtin("Reflect.set"),
    Build.primitive(void 0),
    [
      objectify(scope, identifier),
      expression1,
      expression2]));

const get = (scope, identifier, expression) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [
    objectify(scope, identifier),
    expression]);

const visitors = {__proto__:null};

const visit = (scope, boolean, pattern, expression1, expression2) =>
  visitors[pattern.type](scope, boolean, pattern, expression1, expression2);

visitors.MemberExpression = (scope, boolean, pattern, expression1, expression2) => (
  boolean ?
  (() => { throw new Error("Cannot have member expression in initialization context")}) :
  Scope.Build.mole(
    scope,
    "pattern_member",
    Visit.node(pattern.object, scope, ""),
    (identifier) => Build.sequence(
      set(
        scope,
        identifier,
        (
          pattern.computed ?
          Visit.node(pattern.property, scope, "") :
          Build.primitive(pattern.property.name)),
        expression1),
      expression2)));

visitors.Identifier = (scope, boolean, pattern, expression1, expression2) =>
  Scope.Build[boolean ? "initialize" : "write"](scope, pattern.name, expression1, expression2);

visitors.AssignmentPattern = (scope, boolean, pattern, expression1, expression2) => Scope.Build.mole(
  scope,
  "pattern_assignment",
  expression1,
  (identifier) => visit(
    scope,
    boolean,
    pattern.left,
    Build.conditional(
      Build.binary(
        "===",
        Scope.Build.read(scope, identifier),
        Build.primitive(void 0)),
      Visit.node(pattern.right, scope, ""),
      Scope.Build.read(scope, identifier)),
    expression2));

visitors.ObjectPattern = (scope, boolean, pattern, expression1, expression2) => Scope.mole(
  scope,
  "pattern_object_right",
  expression1,
  (identifier1) => (
    (
      pattern.properties.length &&
      pattern.properties[pattern.properties.length-1].type === "RestElement") ?
    (
      pattern.properties.length === 1 ?
      visit(
        scope,
        boolean,
        pattern.properties[1].argument,
        Build.apply(
          Build.builtin("Object.assign"),
          Build.primitive(void 0),
          [
            Build.object(
              Build.builtin("Object.prototype"),
              []),
            expression1]),
        expression2) :
      (
        (
          function self (list, index) { return (
            pattern.properties[index].type === "RestElement" ?
            Scope.mole(
              scope,
              "pattern_object_rest",
              Build.apply(
                Build.builtin("Object.assign"),
                Build.primitive(void 0),
                [
                  Build.object(
                    Build.builtin("Object.prototype"),
                    []),
                  Scope.Build.read(identifier1)])
              (identifier2) => (
                (
                  function self (list) { return (
                    list ?
                    Build.sequence(
                      Build.apply(
                        Build.builtin("Reflect.deleteProperty"),
                        Build.primitive(void 0),
                        [
                          Scope.Build.read(identifier2),
                          (
                            list.tag ?
                            Scope.Build.read(list.car) :
                            Build.primitive(list.car))]),
                      self(list.cdr)) :
                    visit(
                      scope,
                      boolean,
                      pattern.properties[index].argument,
                      Scope.Build.read(identifier2),
                      expression2))})
                (list))) :
            (
              (
                (!patterns[index].computed) ||
                patterns[index].key.type === "Literal") ?
              visit(
                scope,
                boolean,
                pattern.value,
                get(
                  scope,
                  identifier1,
                  Build.primitive(
                    (
                      patterns[index].computed ?
                      patterns[index].key.value :
                      patterns[index].key.name))),
                self(
                  {
                    __proto__: null,
                    tag: false,
                    car: (
                      patterns[index].computed ?
                      patterns[index].key.value :
                      patterns[index].key.name),
                    cdr: list},
                  index + 1)) :
              Scope.mole(
                scope,
                "pattern_object_key",
                Visit.node(pattern.key, scope, ""),
                (identifier2) => visit(
                  scope,
                  boolean,
                  pattern.value,
                  get(
                    scope,
                    identifier1,
                    Scope.Build.read(scope, identifier2)),
                  self(
                    {
                      __proto__: null,
                      tag: true,
                      car: identifier2,
                      cdr: list},
                    index + 1)))))})
        (null, 0))) :
    ArrayLite.reduceRight(
      pattern.properties,
      (pattern, expression3) => visit(
        scope,
        pattern.value,
        boolean,
        get(
          scope,
          identifier1,
          (
            pattern.properties[index].computed ?
            Visit.node(pattern.key, scope, "") :
            Build.primitive(pattern.key.name))),
        expression3),
      expression2)));

visitors.ArrayPattern = (scope, boolean, pattern, expression1, expression2) => Scope.mole(
  scope,
  expression1,
  (identifier1) => Scope.mole(
    scope,
    Build.apply(
      get(
        scope,
        identifier,
        Build.builtin("Symbol.iterator")),
      Scope.read(scope, identifier),
      []),
    (identifier1) => ArrayLite.reduceRight(
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
            Build.closure(
              Scope.Build.BLOCK(
                scope,
                {
                  __proto__: null,
                  closure: "arrow"},
                [],
                [],
                [],
                (scope) => Scope.Build.Mole(
                  scope,
                  "pattern_array_rest",
                  Build.apply(
                    Build.builtin("Array.of"),
                    Build.primitive(void 0),
                    []),
                  (identifier2) => ArrayLite.concat(
                    Scope.Build.Mole(
                      scope,
                      "pattern_array_step",
                      Build.primitive(null),
                      (identifier3) => Build.While(
                        Scope.Build.write(
                          identifier3,
                          Build.apply(
                            Build.apply(
                              Build.builtin("Reflect.get"),
                              Build.primitive(void 0),
                              [
                                Scope.Build.read(scope, identifier1),
                                Build.primitive("next")]),
                            Scope.Build.read(scope, identifier1),
                            []),
                          Build.apply(
                            Build.get(
                              Build.builtin("Reflect.get"),
                              Build.primitive(void 0),
                              [
                                Scope.Build.read(identifier3),
                                Build.primitive("done")]))),
                        Scope.Build.BLOCK(
                          scope,
                          {
                            __proto__: null},
                          [],
                          [],
                          (scope) => Build.Expression(
                            Build.apply(
                              Build.builtin("Array.prototype.push"),
                              Scope.Build.read(identifier2),
                              [
                                Build.apply(
                                  Build.builtin("Reflect.get"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.Build.read(identifier3),
                                    Build.primitive("value")])]))))),
                    Build.Return(
                      Scope.Build.read(scope, identifier2)))))),
            Build.primitive(void 0),
            []) :
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.apply(
                  Build.builtin("Reflect.get"),
                  Build.primitive(void 0),
                  [
                    Scope.read(scope, identifier),
                    Build.primitive("next")]),
                Scope.read(scope, identifier),
                []),
              Build.primitive("value")])),
        expression3),
      expression2)));

exports.Assign = (scope, boolean, pattern, expression) => (
  pattern.type === "MemberExpression" ?
  (
    boolean ?
    (
      (
        () => { throw new Error("Cannot have member expression in initialization")})
      ()) :
    Scope.Mole(
      scope,
      Visit.node(pattern.object, scope, ""),
      (identifier) => Build.Expression(
        set(
          scope,
          identifier,
          (
            pattern.computed ?
            Visit.node(pattern.property, scope, "") :
            Build.primitive(pattern.property.name)),
          expression)))) :
  Build.Expression(
    visit(
      scope,
      boolean,
      pattern,
      expression,
      Build.primitive(void 0))));

exports.assign = (scope, boolean, pattern, expression1) => (
  pattern.type === "MemberExpression" ?
  (
    boolean ?
    (
      (
        () => { throw new Error("Cannot have member expression in initialization")})
      ()) :
    Scope.Build.mole(
      scope,
      "pattern_assign_member_object",
      Visit.node(pattern.object, scope, ""),
      (identifier1) => (
        (
          (closure) => (
            pattern.computed ?
            Scope.Build.mole(
              scope,
              "pattern_assign_member_key",
              Visit.node(pattern.property, scope, ""),
              (identifier2) => closure(
                Scope.Build.read(identifier2))) :
            closure(
              Build.primitive(
                pattern.property.type === "Identifier" ?
                pattern.property.name :
                pattern.property.value))))
        (
          (expression2) => Scope.Build.mole(
            scope,
            "pattern_assign_member_value",
            expression1,
            (identifier2) => set(
              scope,
              identifier1,
              expression2,
              identifier2)))))) :
  Scope.Build.mole(
    scope,
    expression,
    (identifier) => visit(
      scope,
      boolean,
      pattern,
      Scope.Build.read(scope, identifier),
      Scope.Build.read(scope, identifier))));

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

