
const ArrayLite = require("array-lite");
const Build = require("./build.js");
const Visit = require("./visit");
const Scope = require("./scope.js");
const Object = require("./object.js");

// Depth first:
//
// var iterator = () => ({
//   __proto__: null,
//   counter: 0,
//   next: function () {
//     console.log("yo", this.counter);
//     this.counter++;
//     return {
//       __proto__: null,
//       done: this.counter > 5,
//       value: undefined
//     }
//   }
// });
// var x, y;
// [(console.log("foo"), {})[(console.log("bar"))], x = console.log("qux"), y] = {__proto__:null, [Symbol.iterator]: iterator};
// foo
// bar
// yo 0
// yo 1
// qux
// yo 2

exports.assign1 = (scope, isinit, $pattern, cache) => visit(scope, isinit, $pattern)(cache);

exports.assign2 = (scope, isinit, $pattern, expression) => Scope.cache(
  scope,
  "PatternAssign2Right",
  expression,
  visit(scope, isinit, $pattern));

exports.assign3 = (scope, isinit, $pattern, $expression) => Scope.cache(
  scope,
  "PatternAssign3Right",
  (
    $expression === null ?
    void 0 :
    (
      $expression.type === "Literal" ?
      $expression.value :
      Visit.node(
        $expression,
        scope,
        false,
        (
          $pattern.type === "Identifier" ?
          Scope.$Cache(scope, $pattern.name) :
          null)))),
  visit(scope, isinit, $pattern));

const visit = (scope, isinit, $pattern) => visitors[$pattern.type](scope, isinit, $pattern);

const visitors = {__proto__:null};

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
// We choose the safari evaluation order because for consistency reason:
// visitors of this file receives a cache as right-hand side which means that it
// has already been evaluated or it has no side effects (e.g. primitive).
visitors.MemberExpression = (scope, isinit, $pattern) => (cache1) => (
  Scope.$GetStrict(scope) ?
  Object.set(
    true,
    Visit.node($pattern.object, scope, false, null),
    (
      $pattern.computed ?
      Visit.node($pattern.property, scope, false, null) :
      Build.primitive($pattern.property.name)),
    Scope.get(scope, cache1)) :
  Scope.cache(
    scope,
    "PatternMemberObject",
    (
      $pattern.object.type === "Literal" ?
      $pattern.object.value :
      Visit.node($pattern.object, scope, false, null)),
    (cache2) => Scope.cache(
      scope,
      "PatternMemberProperty",
      (
        $pattern.computed ?
        (
          $pattern.property.type === "Literal" ?
          $pattern.property.value :
          Visit.node($pattern.property, scope, false, null) :
        Build.primitive($pattern.property.name)),
      (cache3) => Object.set(
        false,
        Object.objectify(
          () => Scope.get(scope, cache2)),
        Scope.get(scope, cache3),
        Scope.get(scope, cache1)))));

visitors.Identifier = (scope, isinit, $pattern) => (cache) => Scope[isinit ? "initialize" : "write"](
  scope,
  $pattern.name,
  Scope.get(scope, cache));

visitors.AssignmentPattern = (scope, isinit, $pattern) => (cache) => Scope.cache(
  scope,
  "PatternAssignmentChild",
  Build.conditional(
    Build.binary(
      "===",
      Scope.get(scope, cache),
      Build.primitive(void 0)),
    Visit.node($pattern.right, scope, false, null),
    Scope.get(scope, cache)),
  visit(scope, isinit, $pattern.left));

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
visitors.ObjectPattern = (scope, isinit, $pattern) => (cache1) => (
  (
    $pattern.properties.length &&
    $pattern.properties[$pattern.properties.length-1].type === "RestElement") ?
  (
    (
      function self (index, list) { return (
        $pattern.properties[index].type === "RestElement" ?
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
              Scope.get(scope, cache1)]),
          (cache2) => (
            (
              function self (list) { return (
                list ?
                Build.sequence(
                  Object.del(
                    false,
                    Scope.get(scope, cache2),
                    Scope.get(scope, list.car)),
                  self(list.cdr)) :
                visit(scope, isinit, $pattern.properties[index].argument)(cache2))})
            (list))) :
        Scope.cache(
          scope,
          "PatternObjectRestKey",
          (
            $pattern.properties[index].key.type === "Literal" ?
            $pattern.properties[index].key.value :
            (
              $pattern.properties[index].computed ?
              Visit.node($pattern.properties[index].key, scope, false, null) :
              $pattern.properties[index].key.name)),
          (cache2) => Build.sequence(
            Scope.cache(
              scope,
              "PatternObjectRestChild",
              Object.get(
                Object.objectify(
                  () => Scope.get(scope, cache1)),
                Scope.get(scope, cache2)),
              visit(scope, isinit, $pattern.properties[index].value)),
            self(
              index + 1,
              {
                __proto__: null,
                car: cache2,
                cdr: list}))))})
    (0, null)) :
  (
    (
      function self (index) { return (
        index === $pattern.properties.length ?
        Build.primitive(void 0) :
        Build.sequence(
          Scope.cache(
            scope,
            "PatternObjectChild",
            Object.get(
              Object.objectify(
                () => Scope.get(scope, cache1)),
              (
                $pattern.properties[index].computed ?
                Visit.node($pattern.key, scope, false, null) :
                Build.primitive($pattern.key.name))),
            visit(scope, $pattern.properties[index].value, isinit)),
          self(index + 1)))})
    (0)));

// Event empty $pattern trigger getting a Symbol.iterator:
// 
// > var p = new Proxy([], {
//   __proto__: null,
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec))
// });
// undefined
// > var [] = p;
// get Symbol(Symbol.iterator)
// undefined
//
// Not need to convert it to an object:
//
// > var iterator = () => "foo";
// undefined
// >  var [x, y, z] = {[Symbol.iterator]:iterator};
// Thrown:
// Typeglobal_Error: Result of the Symbol.iterator method is not an object
//
// Functions work:
//
// > var iterator = () => { var f = function () {}; f.next = () => ({}); return f; }
// undefined
// > var [x, y, z] = {[Symbol.iterator]:iterator};
// undefined
//
// Not need to convert it to an object:
//
// > var iterator = () => ({__proto__: null, next:() => "foo"});
// undefined
// > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
// Thrown:
// Typeglobal_Error: Typeglobal_Error: Iterator result foo is not an object
//
// Functions work:
// > var iterator = () => ({__proto__: null, next:() => () => {}});
// undefined
// > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
// undefined

visitors.ArrayPattern = (scope, isinit, $pattern) => (cache1) => Scope.cache(
  scope,
  "PatternArrayIterator",
  Build.apply(
    Object.get(
      () => Scope.get(scope, cache1),
      Build.builtin("Symbol.iterator")),
    Scope.get(scope, cache1),
    []),
  (cache2) => (
    (
      (
        function self (index) { return (
          index === $pattern.elements.length ?
          Build.primitive(void 0) :
          (
            $pattern.elements.type === "RestElement" ?
            Scope.cache(
              scope,
              "PatternArrayRestChild",
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                []),
              (cache3) => Build.sequence(
                Build.apply(
                  Build.closure(
                    Scope.BLOCK(
                      scope,
                      {
                        __proto__: null,
                        closure: "arrow"},
                      [],
                      [],
                      (scope) => ArrayLite.concat(
                        Scope.Cache(
                          scope,
                          "PatternArrayRestStep",
                          Build.primitive(null),
                          (cache4) => Build.While(
                            Build.sequence(
                              Scope.set(
                                scope,
                                cache4,
                                Build.apply(
                                  Object.get(
                                    Scope.get(scope, cache2),
                                    Build.primitive("next")),
                                  Scope.get(scope, cache2),
                                  [])),
                              Object.get(
                                Scope.get(scope, cache4),
                                Build.primitive("done"))),
                            Scope.BLOCK(
                              scope,
                              null,
                              [],
                              [],
                              (scope) => Build.Expression(
                                Build.apply(
                                  Build.builtin("Array.prototype.push"),
                                  Scope.get(scope, cache3),
                                  [
                                    Object.get(
                                      Scope.get(scope, cache4),
                                      Build.primitive("value"))]))))),
                        Build.Return(
                          Build.primitive(void 0))))),
                  Build.primitive(void 0),
                  []),
                visit(scope, isinit, $pattern.elements[index].argument)(cache3))) :
            Build.sequence(
              Scope.cache(
                scope,
                "PatternArrayChild",
                Object.get(
                  Build.apply(
                    Object.get(
                      Scope.get(scope, cache2),
                      Build.primitive("next")),
                    Build.primitive(void 0),
                    []),
                  Build.primitive("value")),
                visit(scope, isinit, $pattern.elements[index])),
              self(index + 1))))})
      (0))));
