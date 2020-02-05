
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Visit = require("./index.js");

// https://tc39.github.io/ecma262/#sec-function-instances

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; } 
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

const is_strict = (nodes) => (
  nodes.length > 0 &&
  nodes[0].type === "ExpressionStatement" &&
  nodes[0].expression.type === "Literal" &&
  nodes[0].expression.value === "use strict");

exports.PROGRAM = (node, scope, _esidentifiers) => (
  _esidentifiers = Collect.Vars(node.body),
  Scope.BLOCK(
    scope,
    false,
    (
      (
        scope !== null ||
        is_strict(node.body)) ?
      _esidentifiers :
      []),
    (
      scope === null ?
      ["this"] :
      []),
    (scope) => (
      ArrayLite.concat(
        (
          scope === null ?
          Build.Expression(
            Scope.initialize(
              scope,
              "this",
              Build.builtin("global"))) :
          []),
        ArrayLite.flatMap(
          _esidentifiers,
          (
            (
              scope !== null ||
              is_strict(node)) ?
            (esidentifier) => Build.Expression(
              Scope.initialize(
                scope,
                esidentifier,
                Build.primitive(void 0))) :
            (esidentifier) => Build.Expression(
              Object.set(
                false,
                Build.builtin("global"),
                Build.primitive(esidentifier),
                Build.primitive(void 0))))),
        (
          (
            node.body.length >= 1 &&
            node.body[node.body.length - 1].type === "ExpressionStatement") ?
          ArrayLite.concat(
            Block.Body(
              ArrayLite.slice(node.body, 0, node.body.length - 1),
              scope,
              Lexic.CreateProgram(null)),
            Build.Return(
              Visit.node(node.body[node.body.length - 1].expression, scope, false, [])))) :
          Scope.Cache(
            scope,
            "ClosureProgramCompletion",
            Build.primitive(void 0),
            (cache) => ArrayLite.concat(
              Block.Body(
                node.body,
                scope,
                Lexic.CreateProgram(cache)),
              Build.Return(
                Scope.get(scope, cache)))))))));

exports.arrow = (node, scope, cache, _esidentifiers) => (
  _esidentifiers = (
    node.expression ?
    [] :
    Collect.Vars(node.body.body)),
  Build.apply(
    Build.builtin("Object.defineProperty"),
    Build.primitive(void 0),
    [
      Build.apply(
        Build.builtin("Object.defineProperty"),
        Build.primitive(void 0),
        [
          Build.closure(
            Scope.CLOSURE(
              scope,
              (
                node.body.type === "BlockStatement" ?
                is_strict(node.body.body) :
                false),
              ArrayLite.flatMap(
                node.params,
                (param) => Collect.Pattern(param)),
              [],
              (scope) => ArrayLite.concat(
                Build.Expression(
                  Build.conditional(
                    Scope.parameter("new.target"),
                    Build.throw(
                      Build.construct(
                        Build.builtin("TypeError"),
                        [
                          Build.primitive("arrow is not a constructor")])),
                    Build.primitive(void 0))),
                ArrayLite.flatMap(
                  node.params,
                  (param, index) => Build.Expression(
                    Pattern.assign1(
                      scope,
                      true,
                      (
                        param.type === "RestElement" ?
                        param.argument :
                        param),
                      (
                        param.type === "RestElement" ?
                        Build.apply(
                          Build.builtin("Array.prototype.slice"),
                          Scope.parameter("arguments"),
                          [
                            Build.primitive(index)]) :
                        Object.get(
                          Scope.parameter("arguments"),
                          Build.primitive(index)))))),
                (
                  node.expression ?
                  Build.Return(
                    Visit.node(node.body, scope, false, null)) :
                  ArrayLite.concat(
                    Build.Block(
                      [],
                      Scope.BLOCK(
                        scope,
                        false,
                        ArrayLite.concat(
                          _esidentifiers,
                          Collect.Lets(node.body.body)),
                        Collect.Consts(node.body.body),
                        (scope) => ArrayLite.concat(
                          ArrayLite.flatMap(
                            _esidentifiers,
                            (esidentifier) => Build.Expression(
                              Scope.initialize(
                                scope,
                                esidentifier,
                                Build.primitive(void 0)))),
                          Block.Body(
                            node.body.body,
                            scope,
                            Lexic.CreateArrow())))),
                    Build.Return(
                      Build.primitive(void 0))))))),
          Build.primitive("length"),
          Build.object(
            Build.primitive(null),
            [
              [
                Build.primitive("value"),
                Build.primitive(
                  (
                    (
                      params.length > 0 &&
                      params[params.length - 1].type === "RestElement") ?
                    params.length - 1 :
                    params.length))],
              [
                Build.primitive("configurable"),
                Build.primitive(true)]])]),
      Build.primitive("name"),
      Build.object(
        Build.primitive(null),
        [
          [
            Build.primitive("value"),
            (
              cache === null ?
              Build.primitive("") :
              Scope.get(scope, cache))],
          [
            Build.primitive("configurable"),
            Build.primitive(true)]])]));

exports.function = (node, scope, cache, _expression, _esidentifiers1, _esidentifiers2) => (
  _esidentifiers1 = ArrayLite.flatMap(
    node.params,
    (param) => Collect.Pattern(param)),
  _esidentifiers2 = (
    node.expression ?
    [] :
    Collect.Vars(node.body.body)),
  _expression = Scope.cache(
    scope,
    "ClosureFunctionResult",
    Build.primitive(null),
    (cache) => Build.sequence(
      Scope.set(
        scope,
        cache,
        Build.apply(
          Build.builtin("Object.defineProperty"),
          Build.primitive(void 0),
          [
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                Build.closure(
                  // function f (arguments = arguments) { return arguments }
                  // Thrown:
                  // ReferenceError: Cannot access 'arguments' before initialization
                  //     at f (repl:1:25)
                  Scope.CLOSURE(
                    scope,
                    (
                      !node.expression &&
                      is_strict(node.body.body)),
                    ArrayLite.concat(
                      esidentifiers1,
                      (
                        ArrayLite.includes(esidentifiers1, "arguments") ?
                        [] :
                        ["arguments"]),
                      (
                        (
                          node.id === null ||
                          ArrayLite.includes(esidentifiers1, node.id.name)) ?
                        [] :
                        ["arguments"])),
                    ["new.target", "this"],
                    {
                      __proto__: null,
                      [(node.id === null || ArrayLite.includes(esidentifiers1, node.id.name)) ? "this" /* dirty trick */ : node.id.name]: () => Scope.get(scope, cache),
                      [ArrayLite.includes(esidentifier1, "arguments") ? "this" /* dirty trick */ : "arguments"]: () => Build.apply(
                        Build.builtin("Object.defineProperty"),
                        Build.primitive(void 0),
                        [
                          Build.apply(
                            Build.builtin("Object.defineProperty"),
                            Build.primitive(void 0),
                            [
                              Build.apply(
                                Build.builtin("Object.defineProperty"),
                                Build.primitive(void 0),
                                [
                                  Build.apply(
                                    Build.builtin("Object.assign"),
                                    Build.primitive(void 0),
                                    [
                                      Build.object(
                                        Build.primitive("Object.prototype"),
                                        []),
                                      Scope.parameter("arguments")]),
                                  Build.primitive("length"),
                                  Build.object(
                                    Build.primitive(null),
                                    [
                                      [
                                        Build.primitive("value"),
                                        Object.get(
                                          Scope.arguments(scope),
                                          Build.primitive("length"))],
                                      [
                                        Build.primitive("writable"),
                                        Build.primitive(true)],
                                      [
                                        Build.primitive("configurable"),
                                        Build.primitive(true)]])]),
                              Build.primitive("callee"),
                              Build.object(
                                Build.primitive(null),
                                (
                                  Scope.$GetStrict(scope) ?
                                  [
                                    [
                                      Build.primitive("get"),
                                      Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                                    [
                                      Build.primitive("set"),
                                      Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
                                  [
                                    [
                                      Build.primitive("value"),
                                      Scope.callee(scope)],
                                    [
                                      Build.primitive("writable"),
                                      Build.primitive(true)],
                                    [
                                      Build.primitive("configurable"),
                                      Build.primitive(true)]]))]),
                          Build.builtin("Symbol.iterator"),
                          Build.object(
                            Build.primitive(null),
                            [
                              [
                                Build.primitive("value"),
                                Build.builtin("Array.prototype.values")],
                              [
                                Build.primitive("writable"),
                                Build.primitive(true)],
                              [
                                Build.primitive("configurable"),
                                Build.primitive(true)]])]),
                      ["new.target"]: () => Scope.parameter("new.target"),
                      ["this"]: () => Scope.parameter("this")},
                    (scope) => ArrayLite.concat(
                        ArrayLite.flatMap(
                          node.params,
                          (param, index) => Build.Expression(
                            Pattern.assign1(
                              scope,
                              true,
                              (
                                param.type === "RestElement" ?
                                param.argument :
                                param),
                              (
                                param.type === "RestElement" ?
                                Build.apply(
                                  Build.builtin("Array.prototype.slice"),
                                  Scope.arguments(scope),
                                  [
                                    Build.primitive(index)]) :
                                Object.get(
                                  Scope.arguments(scope),
                                  Build.primitive(index)))))),
                        (
                          node.expression ?
                          Build.Return(
                            Scope.cache(
                              scope,
                              "StatementReturnArgument",
                              Visit.node(node.argument, scope, false, null),
                              (cache) => Build.conditional(
                                Scope.read(scope, "new.target"),
                                Build.conditional(
                                  Build.binary(
                                    "===",
                                    Build.unary(
                                      "typeof",
                                      Scope.get(scope, cache)),
                                    Build.primitive("object")),
                                  Build.conditional(
                                    Scope.get(scope, cache),
                                    Scope.get(scope, cache),
                                    Scope.read(scope, "this")),
                                  Build.conditional(
                                    Build.binary(
                                      "===",
                                      Build.unary(
                                        "typeof",
                                        Scope.get(scope, cache)),
                                      Build.primitive("function")),
                                    Scope.get(scope, cache),
                                    Scope.read(scope, "this"))),
                                Scope.get(scope, cache)))) :
                          ArrayLite.concat(
                            Build.Block(
                              [],
                              Scope.BLOCK(
                                scope,
                                false,
                                Collect.Lets(node.body.body),
                                Collect.Consts(node.body.body),
                                (scope) => Block.Body(
                                  node.body.body,
                                  scope,
                                  Lexic.CreateFunction()))),
                            Build.Return(
                              Build.conditional(
                                Scope.read(scope, "new.target"),
                                Scope.read(scope, "this"),
                                Build.primitive(void 0)))))))),
                Build.primitive("length"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      Build.primitive(
                        (
                          (
                            params.length > 0 &&
                            params[params.length - 1].type === "RestElement") ?
                          params.length - 1 :
                          params.length))],
                    [
                      Build.primitive("configurable"),
                      Build.primitive(true)]])]),
            Build.primitive("name"),
            Build.object(
              Build.primitive(null),
              [
                [
                  Build.primitive("value"),
                  options.name()],
                [
                  Build.primitive("configurable"),
                  Build.primitive(true)]])])),
      Build.sequence(
        Build.apply(
          Build.builtin("Reflect.set"),
          Build.primitive(void 0),
          [
            Scope.get(scope, cache2),
            Build.primitive("prototype"),
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                Build.object(
                  Build.builtin("Object.prototype"),
                  []),
                Build.primitive("constructor"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                       Scope.get(scope, cache1)],
                    [
                      Build.primitive("writable"),
                      Build.primitive(true)],
                    [
                      Build.primitive("configurable"),
                      Build.primitive(true)]])])]),
        Scope.get(scope, cache2)))),
  (
    Scope.$IsStrict(scope) ?
    _expression :
    Build.apply(
      Build.builtin("Object.defineProperty"),
      Build.primitive(void 0),
      [
        Build.apply(
          Build.builtin("Object.defineProperty"),
          Build.primitive(void 0),
          [
            _expression,
            Build.primitive("arguments"),
            Build.object(
              Build.primitive(null),
              [
                [
                  Build.primitive("value"),
                  Build.primitive(null)]])]),
        Build.primitive("caller"),
        Build.object(
          Build.primitive(null),
          [
            [
              Build.primitive("value"),
              Build.primitive(null)]])])));
