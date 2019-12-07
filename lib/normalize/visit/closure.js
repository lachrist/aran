
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const global_Array_from = global.Array.from;

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

const freeof = (nodes) => {
  nodes = global_Array_from(nodes);
  let length = nodes.length;
  const object = {
    __proto__: null,
    ["new.target"]: false,
    ["this"]: false,
    ["arguments"]: false
  };
  while (length > 0) {
    const node = nodes[--length];
    if ("type" in node) {
      if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
        continue;
      }
      if (node.type === "MetaProperty") {
        object["new.target"] = true;
      } else if (node.type === "Identifier" && node.name in object) {
        object[node.name] = true;
      }
      if (
        (
          node.type === "CallExpression" &&
          node.callee.type === "Identifier" &&
          node.callee.name === "eval" &&
          node.arguments.length > 0 &&
          ArrayLite.every(
            node.arguments,
            (argument) => argument.type !== "SpreadElement"))) {
        return {
          __proto__: null,
          ["new.target"]: true,
          ["this"]: true,
          ["arguments"]: true,
        };
      }
    }
    for (let key in node) {
      if (typeof node[key] === "object" && node[key]) {
        nodes[length++] = node[key];
      }
    }
  }
  return object;
};

exports.ArrowFunctionExpression = (node, scope, boolean, cache) => Build.apply(
  Build.builtin("Object.defineProperty"),
  Build.primitive(void 0),
  [
    Build.apply(
      Build.builtin("Object.defineProperty"),
      Build.primitive(void 0),
      [
        Build.closure(
          Scope.BLOCK(
            scope,
            {
              __proto__: null,
              closure: "arrow",
              strict: (
                !node.expression &&
                node.body.body.length > 0 &&
                node.body.body[0].type === "ExpressionStatement" &&
                node.body.body[0].expression.type === "Literal" &&
                node.body.body[0].expression.value === "use strict")},
            ArrayLite.flatMap(node.params, Pattern.$Names),
            [],
            (scope) => ArrayLite.concat(
              Build.Expression(
                Build.conditional(
                  Scope.newtarget(scope),
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
                        Scope.arguments(scope),
                        [
                          Build.primitive(index)]) :
                      Object.get(
                        Scope.arguments(scope),
                        Build.primitive(index)))))),
              (
                node.expression ?
                Build.Return(
                  Visit.node(node.body, scope, false, null)) :
                ArrayLite.concat(
                  Build.Block(
                    Visit.NODE(node.body, scope, "arrow", [], null)),
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
          Build.primitive(true)]])]);

exports.FunctionExpression = (node, scope, boolean, cache1) => (
  (
    (identifiers, object) => (
      (
        (expression) => (
          Scope.$GetStrict(scope) ?
          expression :
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Object.defineProperty"),
                Build.primitive(void 0),
                [
                  expression,
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
                    Build.primitive(null)]])])))
      (
        Scope.cache(
          scope,
          "ClosureFunctionResult",
          Build.primitive(null),
          (cache2) => Build.sequence(
            Scope.set(
              scope,
              cache2,
              Build.apply(
                Build.builtin("Object.defineProperty"),
                Build.primitive(void 0),
                [
                  Build.apply(
                    Build.builtin("Object.defineProperty"),
                    Build.primitive(void 0),
                    [
                      Build.closure(
                        Scope.BLOCK(
                          scope,
                          {
                            __proto__: null,
                            closure: "function",
                            strict: (
                              node.body.body.length > 0 &&
                              node.body.body[0].type === "ExpressionStatement" &&
                              node.body.body[0].expression.type === "Literal" &&
                              node.body.body[0].expression.value === "use strict")},
                          ArrayLite.concat(
                            (
                              (
                                node.id !== null &&
                                !ArrayLite.includes(identifiers, node.id.name)) ?
                              [node.id.name] :
                              []),
                            (
                              (
                                object["arguments"] &&
                                !ArrayLite.includes(identifiers, "arguments")) ?
                              ["arguments"] :
                              []),
                            // > function f (x, [x]) {}
                            // Thrown:
                            // function f (x, [x]) {}
                            //                 ^
                            // 
                            // SyntaxError: Duplicate parameter name not allowed in this context
                            // > function f (x, x) {}
                            // undefined
                            (
                              (
                                Scope.$GetStrict(scope) ||
                                ArrayLite.some(
                                  node.params,
                                  (params) => params.type !== "Identifier")) ?
                              identifiers :
                              ArrayLite.filter(
                                identifiers,
                                (identifier, index) => ArrayLite.lastIndexOf(identifiers, identifier) === index))),
                          ArrayLite.concat(
                            (
                              object["new.target"] ?
                              ["new.target"] :
                              []),
                            (
                              object["this"] ?
                              ["this"] :
                              [])),
                          (scope) => ArrayLite.concat(
                            // First: this and new.target:
                            // > function f (x = this) { return x }
                            // undefined
                            // > f()
                            // Object [global] { ... }
                            // > function f (x = new.target) { return x }
                            // undefined
                            // > new f()
                            // [Function: f]
                            (
                              object["new.target"] ?
                              Build.Expression(
                                Scope.initialize(
                                  scope,
                                  "new.target",
                                  Scope.newtarget(scope))) :
                              []),
                            (
                              object["this"] ?
                              Build.Expression(
                                Scope.initialize(
                                  scope,
                                  "this",
                                  Scope.this(scope))) :
                              []),
                            (
                              object["arguments"] ?
                              Build.Expression(
                                Scope.initialize(
                                  scope,
                                  "arguments",
                                  Build.apply(
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
                                                  Scope.arguments(scope)]),
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
                                            Build.primitive(true)]])]))) :
                              []),
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
                            Build.block(
                              Visit.NODE(node.body, scope, "function", [], null)),
                            Build.Return(
                              Build.conditional(
                                Scope.read(scope, "new.target"),
                                Scope.read(scope, "this"),
                                Build.primitive(void 0)))))),
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
              Scope.get(scope, cache2)))))))
  (
    ArrayLite.flatMap(
      node.params,
      Pattern.$Names),
    freeof(node.body.body)));
