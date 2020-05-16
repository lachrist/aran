
const ArrayLite = require("array-lite");
const Build = require("./build.js");
const Visit = require("./visit");
const Scope = require("./scope.js");
const Object = require("./object.js");
const Throw = require("../throw.js");

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

exports._collect = (pattern) => {
  const patterns = [pattern];
  const identifiers = [];
  while (length > 0) {
    const pattern = patterns[patterns.length - 1];
    patterns.length--;
    if (pattern.type === "AssignmentPattern") {
      patterns[patterns.length] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index = 0; index < pattern.elements.length; index++) {
        if (pattern.element[index] !== null) {
          if (pattern.elements[index].type === "RestElement") {
            patterns[patterns.length] = pattern.elements[index].argument;
          } else {
            patterns[patterns.length] = pattern.elements[index];
          }
        }
      }
    } else if (pattern.type === "ObjectPattern") {
      for (let index = 0; index < pattern.properties.length; index++) {
        if (pattern.properties[index].type === "RestElement") {
          patterns[patterns.length] = pattern.properties[index].argument;
        } else {
          patterns[patterns.length] = pattern.properties[index].value;
        }
      }
    } else {
      // console.assert(pattern.type === "Identifier");
      if (!ArrayLite.includes(identifiers, pattern.name)) {
        identifiers[identifiers.length] = pattern.name;
      }
    }
  }
  return identifiers; 
};

exports.assign1 = (pattern, scope, cache, is_initialization) => visit(pattern, scope, is_initialization, cache);

exports.assign2 = (pattern, scope, nullable_expression, is_initialization) => Scope.cache(
  scope,
  "PatternAssign2Right",
  (
    nullable_expression === null ?
    void 0 :
    (
      nullable_expression.type === "Literal" ?
      nullable_expression.value :
      Visit.node(
        nullable_expression,
        scope,
        false,
        (
          pattern.type === "Identifier" ?
          Scope.$Cache(scope, pattern.name) :
          null)))),
  (cache) => visit(scope, is_initialization, pattern, cache));

const visit = (pattern, scope, cache, is_initialization) => visitors[pattern.type](scope, pattern, cache, is_initialization);

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
// has already been evaluated (or it has no side effects -- e.g. primitive).
visitors.MemberExpression = ({computed:is_computed, object:expression1, property:expression2}, scope, cache1, is_initialization) => (
  is_initialization ?
  Throw("Cannot initialize member expressions") :
  (
    Scope.$GetStrict(scope) ?
    Object.set(
      true,
      Visit.node(expression1, scope, false, null),
      (
        is_computed ?
        Visit.node(expression2, scope, false, null) :
        Build.primitive(expression2.name)),
      Scope.get(scope, cache1)) :
    Scope.cache(
      scope,
      "PatternMemberObject",
      (
        expression1.type === "Literal" ?
        expression1.value :
        Visit.node(expression1, scope, false, null)),
      (cache2) => Scope.cache(
        scope,
        "PatternMemberProperty",
        (
          is_computed ?
          (
            expression2.type === "Literal" ?
            expression2.value :
            Visit.node(expression2, scope, false, null) :
          Build.primitive(expression2.name)),
        (cache3) => Object.set(
          false,
          Object.objectify(
            () => Scope.get(scope, cache2)),
          Scope.get(scope, cache3),
          Scope.get(scope, cache1))))));

visitors.Identifier = ({name:identifier}, scope, cache, is_initialization) => Scope[is_initialization ? "initialize" : "write"](
  scope,
  identifier,
  Scope.get(scope, cache));

visitors.AssignmentPattern = ({left:pattern, right:expression}, scope, cache, is_initialization) => Scope.cache(
  scope,
  "PatternAssignmentChild",
  Build.conditional(
    Build.binary(
      "===",
      Scope.get(scope, cache),
      Build.primitive(void 0)),
    Visit.node(expression, scope, false, null),
    Scope.get(scope, cache)),
  (cache) => visit(pattern, scope, cache, is_initialization));

// We have to check if null or undefined before and even if no properties:
//
// > var {[(console.log("yo"), "foo")]:foo} = null;
// Thrown:
// TypeError: Cannot destructure 'undefined' or 'null'.
// > var {} = null;
// Thrown:
// TypeError: Cannot destructure 'undefined' or 'null'.

// BUT we have to call Object at each property:
//
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

visitors.ObjectPattern = ({properties}, scope, cache1, is_initialization) => Build.conditional(
  Build.conditional(
    Build.binary(
      "===",
      Scope.get(scope, cache1),
      Build.primitive(null)),
    Build.primitive(true),
    Build.binary(
      "===",
      Scope.get(scope, cache1),
      Build.primitive(void 0))),
  Build.throw(
    Build.construct(
      Build.builtin("TypeError"),
      [
        Build.primitive("Cannot destructure 'undefined' or 'null'")])),
  (
    (
      properties.length &&
      properties[properties.length-1].type === "RestElement") ?
    (
      (
        function self (index, list) { return (
          properties[index].type === "RestElement" ?
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
                  visit(scope, is_initialization, properties[index].argument)(cache2))})
              (list))) :
          Scope.cache(
            scope,
            "PatternObjectRestKey",
            (
              properties[index].key.type === "Literal" ?
              properties[index].key.value :
              (
                properties[index].computed ?
                Visit.node(properties[index].key, scope, false, null) :
                properties[index].key.name)),
            (cache2) => Build.sequence(
              Scope.cache(
                scope,
                "PatternObjectRestChild",
                Object.get(
                  Object.objectify(
                    () => Scope.get(scope, cache1)),
                  Scope.get(scope, cache2)),
                visit(scope, is_initialization, properties[index].value)),
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
          index === properties.length ?
          Build.primitive(void 0) :
          Build.sequence(
            Scope.cache(
              scope,
              "PatternObjectChild",
              Object.get(
                Object.objectify(
                  () => Scope.get(scope, cache1)),
                (
                  properties[index].computed ?
                  Visit.node(properties[index].key, scope, false, null) :
                  Build.primitive(properties[index].key.name))),
              visit(scope, properties[index][index].value, is_initialization)),
            self(index + 1)))})
      (0)));

// Even empty pattern trigger getting a Symbol.iterator:
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

visitors.ArrayPattern = ({elements}, scope, cache1, is_initialization) => Scope.cache(
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
          index === elements.length ?
          Build.primitive(void 0) :
          (
            elements[index].type === "RestElement" ?
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
                visit(scope, is_initialization, elements[index].argument)(cache3))) :
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
                visit(scope, is_initialization, elements[index])),
              self(index + 1))))})
      (0))));
