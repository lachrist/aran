
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

exports.ArrowFunctionExpression = (node, scope, name) => Scope.token(
  scope,
  Build.closure(
    Scope.__BLOCK__(
      Scope.ExtendArrow(scope),
      ArrayLite.flatMap(node.params, Query.PatternNames),
      [],
      (scope) => ArrayLite.concat(
        Build.Expression(
          Build.conditional(
            Build.argument("new.target"),
            Build.throw(
              Build.construct(
                Build.builtin("TypeError"),
                [
                  Build.primitive(name+" is not a constructor")])),
            Build.argument("this"))),
        Scope.Token(
          scope,
          Build.argument("length"),
          (token2) => ArrayLite.concat(
            ArrayLite.flatMap(
              (
                (
                  node.params.length &&
                  node.params[node.params.length-1].type === "RestElement") ?
                ArrayLite.slice(node.params, 0, node.params.length - 1) :
                node.params),
              (pattern, index) => Scope.Assign(
                scope,
                true,
                pattern,
                Build.conditional(
                  Build.binary(
                    "<",
                    Build.primitive(index),
                    Scope.read(scope, token2)),
                  Build.argument("next"),
                  Build.primitive(void 0)))),
            (
              (
                node.params.length &&
                node.params[node.params.length-1].type === "RestElement") ?
              Scope.Token(
                scope,
                Build.apply(
                  Build.builtin("Array.of"),
                  Build.primitive(void 0),
                  []),
                (token3) => ArrayLite.concat(
                  Scope.Token(
                    Build.primitive(node.params.length-1),
                    (token4) => Build.While(
                      [],
                      Build.binary(
                        "<",
                        Scope.read(scope, token4),
                        Scope.read(scope, token2)),
                      Scope.BLOCK(
                        scope,
                        [],
                        [],
                        (scope) => ArrayLite.concat(
                          Build.Token(
                            Build.argument("next"),
                            (token5) => Build.Expression(
                              Build.apply(
                                Build.builtin("Array.prototype.push"),
                                Scope.read(scope, token3),
                                [
                                  Scope.read(scope, token5)])),
                            scope),
                          Scope.Write(
                            scope,
                            token4,
                            Build.binary(
                              "+",
                              Scope.read(scope, token4),
                              Build.primitive(1))))))),
                  Scope.Assign(
                    scope,
                    true,
                    pattern.argument,
                    Scope.read(scope, token3)))) :
              Scope.Token(
                scope,
                Build.primitive(node.params.length),
                (token3) => Build.While(
                  [],
                  Build.binary(
                    "<",
                    Scope.read(scope, token3),
                    Scope.read(scope, token2)),
                  Scope.BLOCK(
                    scope,
                    [],
                    [],
                    (scope) => ArrayLite.concat(
                      Build.Expression(
                        Build.argument("next")),
                      Scope.Write(
                        scope,
                        token3,
                        Build.binary(
                          "+",
                          Scope.read(scope, token3),
                          Build.primitive(1)))))))))),
        (
          node.expression ?
          [] :
          Visit.NODES(node.body.body, scope, []))),
      (scope) => (
        node.expression ?
        Visit.node(node.body, scope, "") :
        Build.primitive(void 0)))),
  // https://tc39.github.io/ecma262/#sec-function-instances
  (token1) => Build.sequence(
    Scope.token(
      scope,
      Build.apply(
        Build.builtin("Object.create"),
        Build.primitive(void 0),
        [
          Build.primitive(null)]),
      (token2) => Build.sequence(
        Build.apply(
          Build.builtin("Reflect.set"),
          Build.primitive(void 0),
          [
            Scope.read(scope, token2),
            Build.primitive("value"),
            Build.primitive(
              (
                node.params.length && node.params[node.params.length-1].type === "RestElement" ?
                node.params.length - 1 :
                node.params.length))]),
        Build.sequence(
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token2),
              Build.primitive("configurable"),
              Build.primitive(true)]),
          Build.apply(
            Build.builtin("Reflect.defineProperty"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token1),
              Build.primitive("length"),
              Scope.read(scope, token2)])))),
    Build.sequence(
      Scope.token(
        scope,
        Build.apply(
          Build.builtin("Object.create"),
          Build.primitive(void 0),
          [
            Build.primitive(null)]),
        (token2) => Build.sequence(
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token2),
              Build.primitive("value"),
              Build.primitive(name)]),
          Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token2),
                Build.primitive("configurable"),
                Build.primitive(true)]),
            Build.apply(
              Build.builtin("Reflect.defineProperty"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token1),
                Build.primitive("name"),
                Scope.read(scope, token2)])))),
    Build.sequence(
      Scope.token(
        scope,
        Build.apply(
          Build.builtin("Object.create"),
          Build.primitive(void 0),
          [
            Build.primitive(null)]),
        (token2) => Build.sequence(
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token2),
              Build.primitive("value"),
              Build.primitive(void 0)]),
          Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token2),
                Build.primitive("writable"),
                Build.primitive(true)]),
            Build.apply(
              Build.builtin("Reflect.defineProperty"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token1),
                Build.primitive("prototype"),
                Scope.read(scope, token2)])))),
      Scope.read(scope, token1)))));

exports.FunctionExpression = (node, scope, name) => Scope.token(
  scope,
  Build.primitive(void 0),
  (token1) => Scope.write(
    scope,
    token1,
    Build.closure(
      Scope.__BLOCK__(
        Scope.ExtendFunction(scope),
        ArrayLite.concat(
          (
            (
              node.id &&
              !ArrayLite.includes(
                ArrayLite.flatMap(node.params, Query.PatternNames),
                node.id.name)) ?
            [node.id.name] :
            []),
          (
            !ArrayLite.includes(
              ArrayLite.flatMap(node.params, Query.PatternNames),
              "arguments") ?
            ["arguments"] :
            []),
          (
            (
              Scope.GetStrict(scope) ||
              ArrayLite.some(
                node.params,
                (pattern) => pattern.type !== "Identifier")) ?
            ArrayLite.flatMap(node.params, Query.PatternNames) :
            ArrayLite.filter(
              ArrayLite.map(node.params, (pattern) => pattern.name),
              (name, index, array) => ArrayLite.lastIndexOf(array, name) === index))),
        ["new.target", "this"],
        (scope) => ArrayLite.concat(
          (
            (
              node.id  &&
              !ArrayLite.includes(
                ArrayLite.flatMap(node.params, Query.PatternNames),
                node.id.name)) ?
            Scope.Initialize(
              scope,
              node.id.name,
              Scope.read(scope, token1)) :
            []),
          Scope.Initialize(
            scope,
            "new.target",
            Build.argument("new.target")),
          Scope.Initialize(
            scope,
            "this",
            Build.conditional(
              Scope.read(scope, "new.target"),
              Build.sequence(
                Build.argument("this"),
                Build.apply(
                  Build.builtin("Object.create"),
                  Build.primitive(void 0),
                  [
                    Scope.token(
                      scope,
                      Build.apply(
                        Build.builtin("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, "new.target"),
                          Build.primitive("prototype")]),
                      (token) => Build.conditional(
                        Build.binary(
                          "===",
                          Build.unary(
                            "typeof",
                            Scope.read(scope, token)),
                          Build.primitive("object")),
                        Build.conditional(
                          Scope.read(scope, token),
                          Scope.read(scope, token),
                          Build.builtin("Object.prototype")),
                        Build.conditional(
                          Build.binary(
                            "===",
                            Build.unary(
                              "typeof",
                              Scope.read(scope, token)),
                            Build.primitive("function")),
                          Scope.read(scope, token),
                          Build.builtin("Object.prototype"))))])),
              Build.argument("this"))),
          Scope.Token(
            scope,
            Build.argument("length"),
            (token2) => (
              (
                ArrayLite.includes(
                  ArrayLite.flatMap(node.params, Query.PatternNames),
                  "arguments") ||
                Query.IsArgumentsFree(
                  ArrayLite.concat(node.params, [node]))) ?
              ArrayLite.concat(
                ArrayLite.flatMap(
                  (
                    (
                      node.params.length &&
                      node.params[node.params.length-1].type === "RestElement") ?
                    ArrayLite.slice(node.params, 0, node.params.length - 1) :
                    node.params),
                  (pattern, index1) => Scope.Assign(
                    scope,
                    (
                      Scope.GetStrict(scope) ||
                      ArrayLite.some(node.params, (pattern) => pattern.type !== "Identifier") ||
                      ArrayLite.every(node.params, (pattern, index2) => (
                        index1 <= index2 ||
                        pattern.name !== node.params[index1].name))),
                    pattern,
                    Build.conditional(
                      Build.binary(
                        "<",
                        Build.primitive(index1),
                        Scope.read(scope, token2)),
                      Build.argument("next"),
                      Build.primitive(void 0)))),
                (
                  (
                    node.params.length &&
                    node.params[node.params.length-1].type === "RestElement") ?
                  Scope.Token(
                    scope,
                    Build.apply(
                      Build.builtin("Array.of"),
                      Build.primitive(void 0),
                      []),
                    (token3) => ArrayLite.concat(
                      Scope.Token(
                        scope,
                        Build.primitive(node.params.length-1),
                        (token4) => Build.While(
                          [],
                          Build.binary(
                            "<",
                            Scope.read(scope, token4),
                            Scope.read(scope, token2)),
                          Scope.BLOCK(
                            scope,
                            [],
                            [],
                            (scope) => ArrayLite.concat(
                              Scope.Token(
                                scope,
                                Build.argument("next"),
                                (token5) => Build.Expression(
                                  Build.apply(
                                    Build.builtin("Array.prototype.push"),
                                    Scope.read(scope, token3),
                                    [
                                      Scope.read(scope, token5)])),
                                scope),
                              Scope.Write(
                                scope,
                                token4,
                                Build.binary(
                                  "+",
                                  Scope.read(scope, token4),
                                  Build.primitive(1))))))),
                      Scope.Assign(
                        scope,
                        true,
                        node.params[node.params.length-1].argument,
                        Scope.read(scope, token3)))) :
                  Scope.Token(
                    scope,
                    Build.primitive(node.params.length),
                    (token3) => Build.While(
                      [],
                      Build.binary(
                        "<",
                        Scope.read(scope, token3),
                        Scope.read(scope, token2)),
                      Scope.BLOCK(
                        scope,
                        [],
                        [],
                        (scope) => ArrayLite.concat(
                          Build.Expression(
                            Build.argument("next")),
                          Scope.Write(
                            scope,
                            token3,
                            Build.binary(
                              "+",
                              Scope.read(scope, token3),
                              Build.primitive(1))))))))) :
              ArrayLite.concat(
                Scope.Initialize(
                  scope,
                  "arguments",
                  Build.apply(
                    Build.builtin("Object.create"),
                    Build.primitive(void 0),
                    [
                      Build.primitive(null)])),
                ArrayLite.flatMap(
                  (
                    (
                      node.params.length &&
                      node.params[node.params.length-1].type === "RestElement") ?
                    ArrayLite.slice(node.params, 0, node.params.length-1) :
                    node.params),
                  (pattern, index1) => Scope.Token(
                    scope,
                    Build.conditional(
                      Build.binary(
                        "<",
                        Build.primitive(index1),
                        Scope.read(scope, token2)),
                      Build.argument("next"),
                      Build.primitive(void 0)),
                    (token3) => ArrayLite.concat(
                      Scope.Assign(
                        scope,
                        (
                          Scope.GetStrict(scope) ||
                          ArrayLite.some(node.params, (pattern) => pattern.type !== "Identifier") ||
                          ArrayLite.every(node.params, (pattern, index2) => (
                            index1 <= index2 ||
                            pattern.name !== node.params[index1].name))),
                        pattern,
                        Scope.read(scope, token3)),
                      Build.If(
                        [],
                        Build.binary(
                          "<",
                          Build.primitive(index1),
                          Scope.read(scope, token2)),
                        Scope.BLOCK(
                          scope,
                          [],
                          [],
                          (scope) => Build.Expression(
                            Build.apply(
                              Build.builtin("Reflect.set"),
                              Build.primitive(void 0),
                              [
                                Scope.read(scope, "arguments"),
                                Build.primitive(index1),
                                Scope.read(scope, token3)]))),
                        Scope.BLOCK(
                          scope,
                          [],
                          [],
                          (scope) => []))))),
                Scope.Token(
                  scope,
                  (
                    (
                      node.params.length &&
                      node.params[node.params.length-1].type === "RestElement") ?
                    Build.primitive(node.params.length - 1) :
                    Build.primitive(node.params.length)),
                  (token3) => Build.While(
                    [],
                    Build.binary(
                      "<",
                      Scope.read(scope, token3),
                      Scope.read(scope, token2)),
                    Scope.BLOCK(
                      scope,
                      [],
                      [],
                      (scope) => ArrayLite.concat(
                        Scope.Token(
                          scope,
                          Build.argument("next"),
                          (token4) => Build.Expression(
                            Build.apply(
                              Build.builtin("Reflect.set"),
                              Build.primitive(void 0),
                              [
                                Scope.read(scope, "arguments"),
                                Scope.read(scope, token3),
                                Scope.read(scope, token4)]))),
                        Scope.Write(
                          scope,
                          token3,
                          Build.binary(
                            "+",
                            Scope.read(scope, token3),
                            Build.primitive(1))))))),
                Scope.Token(
                  scope,
                  Build.apply(
                    Build.builtin("Object.create"),
                    Build.primitive(void 0),
                    [
                      Build.primitive(null)]),
                  (token3) => ArrayLite.concat(
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("value"),
                          Scope.read(scope, token2)])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("writable"),
                          Build.primitive(true)])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("configurable"),
                          Build.primitive(true)])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.defineProperty"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, "arguments"),
                          Build.primitive("length"),
                          Scope.read(scope, token3)])))),
                (
                  (
                    node.params.length &&
                    node.params[node.params.length-1].type === "RestElement") ?
                  Scope.Assign(
                    scope,
                    true,
                    node.params[node.params.length-1].argument,
                    Build.apply(
                      Build.builtin("Array.prototype.slice"),
                      Scope.read(scope, "arguments"),
                      [
                        Build.primitive(node.params.length-1)])) :
                  []),
                Scope.Token(
                  scope,
                  Build.apply(
                    Build.builtin("Object.create"),
                    Build.primitive(void 0),
                    [
                      Build.primitive(null)]),
                  (token3) => ArrayLite.concat(
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          (
                            Scope.GetStrict(scope) ?
                            Build.primitive("get") :
                            Build.primitive("value")),
                          (
                            Scope.GetStrict(scope) ?
                            Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get") :
                            Scope.read(scope, token1))])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          (
                            Scope.GetStrict(scope) ?
                            Build.primitive("set") :
                            Build.primitive("writable")),
                          (
                            Scope.GetStrict(scope) ?
                            Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set") :
                            Build.primitive(true))])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("configurable"),
                          (
                            Scope.GetStrict(scope) ?
                            Build.primitive(false) :
                            Build.primitive(true))])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.defineProperty"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, "arguments"),
                          Build.primitive("callee"),
                          Scope.read(scope, token3)])))),
                Scope.Token(
                  scope,
                  Build.apply(
                    Build.builtin("Object.create"),
                    Build.primitive(void 0),
                    [
                      Build.primitive(null)]),
                  (token3) => ArrayLite.concat(
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("value"),
                          Build.builtin("Array.prototype.values")])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("writable"),
                          Build.primitive(true)])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token3),
                          Build.primitive("configurable"),
                          Build.primitive(true)])),
                    Build.Expression(
                      Build.apply(
                        Build.builtin("Reflect.defineProperty"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, "arguments"),
                          Build.builtin("Symbol.iterator"),
                          Scope.read(scope, token3)])))),
                Build.Expression(
                  Build.apply(
                    Build.builtin("Reflect.setPrototypeOf"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, "arguments"),
                      Build.builtin("Object.prototype")]))))),
          Build.Block(
            Visit.NODES(node.body, scope, [])),
          Build.Return(
            Build.conditional(
              Scope.read(scope, "new.target"),
              Scope.read(scope, "this"),
              Build.primitive(void 0)))))),
    // https://tc39.github.io/ecma262/#sec-function-instances
    Build.sequence(
      Scope.token(
        scope,
        Build.apply(
          Build.builtin("Object.create"),
          Build.primitive(void 0),
          [
            Build.primitive(null)]),
        (token2) => Build.sequence(
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token2),
              Build.primitive("value"),
              Build.primitive(
                (
                  node.params.length && node.params[node.params.length-1].type === "RestElement" ?
                  node.params.length - 1 :
                  node.params.length))]),
          Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token2),
                Build.primitive("configurable"),
                Build.primitive(true)]),
            Build.apply(
              Build.builtin("Reflect.defineProperty"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token1),
                Build.primitive("length"),
                Scope.read(scope, token2)])))),
      Build.sequence(
        Scope.token(
          scope,
          Build.apply(
            Build.builtin("Object.create"),
            Build.primitive(void 0),
            [
              Build.primitive(null)]),
          (token2) => Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token2),
                Build.primitive("value"),
                Build.primitive(node.id ? node.id.name : name)]),
            Build.sequence(
              Build.apply(
                Build.builtin("Reflect.set"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token2),
                  Build.primitive("configurable"),
                  Build.primitive(true)]),
              Build.apply(
                Build.builtin("Reflect.defineProperty"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token1),
                  Build.primitive("name"),
                  Scope.read(scope, token2)])))),
      Build.sequence(
        Scope.token(
          scope,
          Build.apply(
            Build.builtin("Object.create"),
            Build.primitive(void 0),
            [
              Build.primitive(null)]),
          (token2) => Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token2),
                Build.primitive("value"),
                Scope.token(
                  scope,
                  Build.apply(
                    Build.builtin("Object.create"),
                    Build.primitive(void 0),
                    [
                      Build.builtin("Object.prototype")]),
                  (token3) => Scope.token(
                    scope,
                    Build.apply(
                      Build.builtin("Object.create"),
                      Build.primitive(void 0),
                      [
                        Build.primitive(null)]),
                    (token4) => Build.sequence(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token4),
                          Build.primitive("value"),
                          Scope.read(scope, token1)]),
                      Build.sequence(
                        Build.apply(
                          Build.builtin("Reflect.set"),
                          Build.primitive(void 0),
                          [
                            Scope.read(scope, token4),
                            Build.primitive("writable"),
                            Build.primitive(true)]),
                        Build.sequence(
                          Build.apply(
                            Build.builtin("Reflect.defineProperty"),
                            Build.primitive(void 0),
                            [
                              Scope.read(scope, token3),
                              Build.primitive("constructor"),
                              Scope.read(scope, token4)]),
                          Scope.read(scope, token3))))))]),
            Build.sequence(
              Build.apply(
                Build.builtin("Reflect.set"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token2),
                  Build.primitive("writable"),
                  Build.primitive(true)]),
              Build.apply(
                Build.builtin("Reflect.defineProperty"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token1),
                  Build.primitive("prototype"),
                  Scope.read(scope, token2)])))),
        Scope.read(scope, token1))))));
