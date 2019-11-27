
const ArrayLite = require("array-lite");
const Build = require("./build.js");
const Visit = require("./visit");
const Scope = require("./scope.js");
const Object = require("./object.js");

const visitors = {__proto__:null};

const visit = (scope, boolean, pattern, either) =>
  visitors[pattern.type](scope, boolean, pattern, either);
// Safari:
//
// > [(console.log("foo"), {})[console.log("bar")] = console.log("qux")] = []
// [Log] qux
// [Log] foo
// [Log] bar
//
// Chrome/Node/Firefox:
//
// > [(console.log("foo"), {})[console.log("bar")] = console.log("qux")] = []
// foo
// bar
// qux
//
// We choose the safari evaluation order because: if either is function, the
// right-hand side has already been evaluated. Also the safari evaluation order
// is more consistent: first right-hand side then the left-hand side.
visitors.MemberExpression = (scope, boolean, pattern, either) => (
  boolean ?
  (
    (
      () => { throw new Error("Cannot have member expression in initialization context")})
    ()) :
  (
    (
      (closure) => (
        typeof either === "function" ?
        closure(either) :
        Scope.cache(
          scope,
          "PatternMemberRight",
          either,
          (cache) => closure(
            () => Scope.get(scope, cache)))))
    (
      (generator) => Scope.cache(
        scope,
        "PatternMemberObject",
        Visit.node(pattern.object, scope, ""),
        (cache) => Object.set(
          Scope.$GetStrict(scope),
          () => Scope.get(scope, cache)),
          (
            pattern.computed ?
            Visit.node(pattern.property, scope, "") :
            Build.primitive(pattern.property.name)),
          generator()))));

visitors.Identifier = (scope, boolean, pattern, either) =>
  Scope[boolean ? "initialize" : "write"](scope, pattern.name, either);

visitors.AssignmentPattern = (scope, boolean, pattern, either) => (
  (
    (closure) => (
      typeof either === "function" ?
      closure(either) :
      Scope.cache(
        scope,
        "PatternAssignmentRight",
        expression,
        (cache) => closure(
          () => Scope.get(scope, cache)))))
  (
    (closure) => visit(
      scope,
      boolean,
      pattern.left,
      Build.conditional(
        Build.binary(
          "===",
          closure(),
          Build.primitive(void 0)),
        Visit.node(pattern.right, scope, ""),
        closure()))));

// > let thisfoo = null;
// undefined
// > let thisbar = null;
// undefined
// Reflect.defineProperty(String.prototype, "foo", {
//  get: function () {
//     thisfoo = this; 
//     return "yolo";
//   }
// });
// true
// Reflect.defineProperty(String.prototype, "bar", {
//   get: function () {
//     thisbar = this;
//     return "swag";
//   }
// });
// true
// > var {foo,bar} = "qux";
// undefined
// > thisfoo
// [String: 'qux']
// > thisbar
// [String: 'qux']
// > thisfoo === thisbar
// false
visitors.ObjectPattern = (scope, boolean, pattern, either) => (
  (
    (closure) => (
      typeof either === "function" ?
      closure(either) :
      Scope.cache(
        scope,
        "PatternObjectRight1",
        either,
        (cache) => closure(
          () => Scope.get(scope, cache)))))
  (
    (generator1) => (
      (
        pattern.properties.length &&
        pattern.properties[pattern.properties.length-1].type === "RestElement") ?
      (
        (
          function self (list, index) { return (
            pattern.properties[index].type === "RestElement" ?
            Scope.cache(
              scope,
              "PatternObjectRest",
              Build.apply(
                Build.builtin("Object.assign"),
                Build.primitive(void 0),
                [
                  Build.object(
                    Build.builtin("Object.prototype"),
                    []),
                  Scope.get(scope, cache)]),
              (cache) => (
                (
                  function self (list) { return (
                    list ?
                    Build.sequence(
                      Object.del(
                        false,
                        Scope.get(scope, cache),
                        list.car()),
                      self(list.cdr)) :
                    visit(
                      scope,
                      boolean,
                      pattern.properties[index].argument,
                      () => Scope.get(scope, cache)))})
                (list))) :
            (
              (
                (closure) => (
                  pattern.properties[index].computed ?
                  (
                    pattern.properties[index].key.type === "Literal" ?
                    closure(
                      () => Build.primitive(pattern.properties[index].key.value)) :
                    Scope.cache(
                      scope,
                      "PatternObjectKey",
                      Visit.node(pattern.properties[index].key, scope, ""),
                      (cache) => closure(
                        () => Scope.get(scope, cache)))) :
                  closure(
                    () => Build.primitive(pattern.properties[index].key.name))))
              (
                (generator2) => Build.sequence(
                  visit(
                    scope,
                    boolean,
                    pattern.properties[index].value,
                    {
                      __proto__: null,
                      expression: Object.get(
                        generator1,
                        generator2()),
                      cache: null}),
                  self(
                    {
                      __proto__: null,
                      car: generator2,
                      cdr: list},
                    index + 1)))))})
        (null, 0)) :
      (
        (
          function self (index) { return (
            index === pattern.properties.length ?
            Build.primitive(void 0) :
            Build.sequence(
              visit(
                scope,
                pattern.properties[index].value,
                boolean,
                Object.get(
                  generator,
                  (
                    pattern.properties[index].computed ?
                    Visit.node(pattern.key, scope, "") :
                    Build.primitive(pattern.key.name)))),
              self(index + 1)))})
        (0)))));

visitors.ArrayPattern = (scope, boolean, pattern, either) => (
  // Event empty pattern trigger getting a Symbol.iterator:
  // 
  // > var p = new Proxy([], {
  //   __proto__: null,
  //   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec))
  // });
  // undefined
  // > var [] = p;
  // get Symbol(Symbol.iterator)
  // undefined
  (
    (closure) => (
      typeof either === "function" ?
      closure(either) :
      Scope.cache(
        scope,
        "PatternArrayRight",
        either,
        (cache) => () => Scope.get(scope, cache))))
  (
    (closure) => Scope.cache(
      scope,
      "PatternArrayIterator",
      Build.apply(
        Object.get(
          closure,
          Build.builtin("Symbol.iterator")),
        Scope.get(scope, cache),
        []),
      (cache1) => (
        (
          (
            function self (index) { return (
              index === pattern.elements.length ?
              Build.primitive(void 0) :
              (
                pattern.elements.type === "RestElement" ?
                visit(
                  scope,
                  boolean,
                  pattern.elements[index].argument,
                  Build.apply(
                    Scope.closure(
                        scope,
                        false,
                        [],
                        [],
                        (scope) => Scope.Cache(
                          scope,
                          "HelperRestResult",
                          Build.apply(
                            Build.builtin("Array.of"),
                            Build.primitive(void 0),
                            []),
                          (cache2) => ArrayLite.concat(
                            Scope.Cache(
                              scope,
                              "PatternRestStep",
                              Build.primitive(null),
                              (cache3) => Build.While(
                                Build.sequence(
                                  Scope.set(
                                    scope,
                                    cache3,
                                    Build.apply(
                                      // Not need to convert it to an object:
                                      //
                                      // > var iterator = () => "foo";
                                      // undefined
                                      // >  var [x, y, z] = {[Symbol.iterator]:iterator};
                                      // Thrown:
                                      // TypeError: Result of the Symbol.iterator method is not an object
                                      //
                                      // Functions work:
                                      //
                                      // > var iterator = () => { var f = function () {}; f.next = () => ({}); return f; }
                                      // undefined
                                      // > var [x, y, z] = {[Symbol.iterator]:iterator};
                                      // undefined
                                      Build.apply(
                                        Build.builtin("Reflect.get"),
                                        Build.primitive(void 0),
                                        [
                                          Scope.get(scope, cache1),
                                          Build.primitive("next")]),
                                      Scope.get(scope, cache1),
                                      [])),
                                  // Not need to convert it to an object:
                                  //
                                  // > var iterator = () => ({__proto__: null, next:() => "foo"});
                                  // undefined
                                  // > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
                                  // Thrown:
                                  // TypeError: TypeError: Iterator result foo is not an object
                                  //
                                  // Functions work:
                                  // > var iterator = () => ({__proto__: null, next:() => () => {}});
                                  // undefined
                                  // > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
                                  // undefined
                                  Build.apply(
                                    Build.builtin("Reflect.get"),
                                    Build.primitive(void 0),
                                    [
                                      Scope.get(scope, cache3),
                                      Build.primitive("done")])),
                                Scope.BLOCK(
                                  scope,
                                  [],
                                  [],
                                  [],
                                  (scope) => Build.Expression(
                                    Build.apply(
                                      Build.builtin("Array.prototype.push"),
                                      Scope.get(scope, cache2),
                                      [
                                        Object.get(
                                          Scope.get(scope, cache3),
                                          Build.primitive("value"))]))))),
                            Build.Return(
                              Scope.get(scope, cache2))))),
                    Build.primitive(void 0),
                    [])) :
                Build.sequence(
                  visit(
                    scope,
                    boolean,
                    pattern.elements[index],
                    Build.apply(
                      Build.builtin("Reflect.get"),
                      Build.primitive(void 0),
                      [
                        Build.apply(
                          Build.apply(
                            Build.builtin("Reflect.get"),
                            Build.primitive(void 0),
                            [
                              Scope.get(scope, cache),
                              Build.primitive("next")]),
                          Scope.get(scope, cache),
                          []),
                        Build.primitive("value")])),
                  self(index + 1))))})
          (0))))));

exports.assign = (scope, boolean, pattern, either) => (
  pattern.type === "MemberExpression" ?
  (
    (
      () => { throw new Error("Direct MemberExpression are not considered proper assignment because of their reversed evaluation order") })
    ()) :
  visit(
    scope,
    boolean,
    pattern,
    either));

exports.assign1 = (scope, boolean, pattern, {expression1) => (
  pattern.type === "MemberExpression" ?
  (
    boolean ?
    (
      (
        () => { throw new Error("Cannot have member expression in initialization")})
      ()) :
    Scope.cache(
      scope,
      Visit.node(pattern.object, scope, ""),
      (cache1) => (
        (
          (closure) => (
            pattern.computed ?
            (
              pattern.property.type === "Literal" ?
              closure(
                Build.primitive(pattern.property.value)) :
              Scope.cache(
                scope,
                Visit.node(pattern.property, scope, ""),
                (cache2) => closure(
                  Scope.get(scope, cache2))) :
            closure(
              Build.primitive(pattern.property.name))))
        (
          (expression2) => Scope.cache(
            scope,
            expression1,
            (cache2) => Build.sequence(
              set(
                scope,
                cache1,
                expression2,
                Scope.get(scope, cache2)),
              Scope.get(scope, cache2)))))) :
  Scope.cache(
    scope,
    expression1,
    (identifier) => Build.sequence(
      visit(
        scope,
        boolean,
        pattern,
        Scope.get(scope, cache)),
      Scope.get(scope, cache))));

exports.assign2 = (scope, boolean, pattern, either) => (
  pattern.type === "MemberExpression" ?
  (
    boolean ?
    (
      (
        () => { throw new Error("Cannot have member expression in initialization")})
      ()) :
    
    
    Scope.cache(
      scope,
      Visit.node(pattern.object, scope, ""),
      (cache) => set(
        scope,
        cache,
        (
          pattern.computed ?
          Visit.node(pattern.property, scope, "") :
          Build.primitive(pattern.property.name)),
        expression))) :
  visit(
    scope,
    boolean,
    pattern,
    expression));

// with (new Proxy({__proto__:null, x:0}, {
//   __proto__: null,
//   has: (tgt, key) => (console.log("has", key), Reflect.has(tgt, key)),
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
//   set: (tgt, key, val, rec) => (console.log("set", key), Reflect.set(tgt, key, val, rec)) 
// })) {
//   console.log(++x);
// }
exports.update1 = (scope, prefix, operator, pattern, expression1) => (
  pattern.type === "MemberExpression" ?
  Scope.cache(
    scope,
    "PatternUpdate1Object",
    Visit.node(pattern.object, scope, ""),
    (cache1) => (
        (
          (closure) => (
            pattern.computed ?
            (
              pattern.property.type === "Literal" ?
              closure(
                Build.primitive(pattern.property.value),
                Build.primitive(pattern.property.value)) :
              Scope.cache(
                scope,
                Visit.node(pattern.property, scope, ""),
                (cache2) => closure(
                  Scope.get(scope, cache2),
                  Scope.get(scope, cache2)))) :
            closure(
              Build.primitive(pattern.property.name),
              Build.primitive(pattern.property.name))))
        (
          (expression2, expression3) => Build.sequence(
            Scope.set(
              scope,
              cache1,
              objectify(scope, cache1)),
            Build.sequence(
              (
                prefix ?
                Scope.cache(
                  scope,
                  "PatternUpdate1Value1",
                  Build.binary(
                    operator,
                    Object.get(
                      Scope.get(scope, cache1),
                      expression2),
                    expression1),
                  (cache2) => Build.sequence(
                    Build.apply(
                      Build.builtin("Reflect.set"),
                      Build.primitive(
                      [
                        Scope.get(scope, cache1),
                        expression3,
                        Scope.get(scope, cache2)])),
                    Scope.get(scope, cache2))) :
                Scope.cache(
                  scope,
                  "PatternUpdate1Value2",
                  expression1,
                  (cache2) => Build.sequence(
                    Build.apply(
                      Build.builtin("Reflect.set"),
                      Build.primitive(void 0),
                      [
                        Scope.get(scope, cache1),
                        expression3,
                        Build.binary(
                          operator,
                          Scope.get(scope, cache2),
                          expression1)]),
                    Scope.get(scope, cache2))))))))) :
  (
    pattern.type === "Identifier" ?
    (
      prefix ?
      Scope.cache(
        scope,
        "ScopeUpdate1Value3",
        Build.binary(
          operator,
          Scope.read(scope, pattern.name),
          expression1),
        (cache1) => Build.sequence(
          Scope.write(
            scope,
            pattern.name,
            Scope.get(scope, cache1)),
          Scope.get(scope, cache1))) :
      Scope.cache(
        scope,
        "ScopeUpdate1Value4",
        Scope.read(scope, pattern.name),
        (cache1) => Build.sequence(
          Scope.write(
            scope,
            pattern.name,
            Build.binary(
              operator,
              Scope.get(scope, cache1),
              expression1)),
          Scope.get(scope, cache1)))) :
    (
      (
        () => { throw new Error("Invalid left-hand side on update") })
      ())));

exports.update2 = (scope, operator, pattern, expression1) => (
  pattern.type === "MemberExpression" ?
  Scope.cache(
    scope,
    "PatternUpdate2Object",
    Visit.node(pattern.object, scope, ""),
    (cache1) => (
      (
        (closure) => (
          pattern.computed ?
          (
            pattern.property.type === "Literal" ?
            closure(
              Build.primitive(pattern.property.value),
              Build.primitive(pattern.property.value)) :
            Scope.cache(
              scope,
              Visit.node(pattern.property, scope, ""),
              (cache2) => closure(
                Scope.get(scope, cache2),
                Scope.get(scope, cache2)))) :
          closure(
            Build.primitive(pattern.property.name),
            Build.primitive(pattern.property.name))))
      (
        (expression2, expression3) => Build.sequence(
          Scope.set(
            scope,
            cache1,
            objectify(scope, cache1)),
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Scope.get(cache1),
              expression2,
              Build.binary(
                operator,
                Build.apply(
                  Build.builtin("Reflect.get"),
                  Build.primitive(void 0),
                  [
                    Scope.get(scope, cache1),
                    expression3]),
                expression1)))))) :
  (
    pattern.type === "Identifier" ?
    Scope.write(
      scope,
      pattern.name,
      Build.Build.binary(
        operator,
        Scope.read(scope, pattern.name),
        expression1)) :
    (
      (
        () => { throw new Error("Invalid left-hand side on update") })
      ())));
