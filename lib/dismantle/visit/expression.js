
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");
const Property = require("../property.js");

const Reflect_apply = global.Reflect.apply;
const String_prototype_substring = String.prototype.substring;

exports.ThisExpression = (node, scope, name) => Scope.read(scope, "this");

exports.ArrayExpression = (node, scope, name) => (
  ArrayLite.some(
    node.elements,
    (node) => node && node.type === "SpreadElement") ?
  Build.apply(
    Build.builtin("Array.prototype.concat"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (node) => (
        node ?
        (
          node.type === "SpreadElement" ?
          Visit.node(node.argument, scope, "") :
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              Visit.node(node, scope, "")])) :
        Build.primitive(void 0)))) :
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (node) => (
        node ?
        Visit.node(node, scope, "") :
        Build.primitive(void 0)))));

exports.ObjectExpression = (node, scope, name) => (
  ArrayLite.every(
    node.properties,
    (node) => node.kind === "init") ?
  Build.apply(
    Build.aran("Object.fromEntries"),
    Build.primitive(void 0),
    [
      Build.apply(
        Build.builtin("Array.of"),
        Build.primitive(void 0),
        ArrayLite.map(
          ArrayLite.filter(
            node.properties,
            (node) => node.kind === "init"),
          (property) => Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              (
                property.computed ?
                Visit.node(property.key, scope) :
                Build.primitive(property.key.name || property.key.value)),
              Visit.node(
                property.value,
                scope,
                (
                  property.computed ?
                  null :
                  property.key.name || property.key.value))])))]) :
  ArrayLite.reduceRight(
    node.properties,
    (expression, property) => Build.apply(
      (
        property.kind === "init" ?
        Build.builtin("AranDefineDataProperty") :
        Build.builtin("AranDefineAccessorProperty")),
      Build.primitive(void 0),
      [
        expression,
        (
          property.computed ?
          Visit.node(property.key, scope) :
          Build.primitive(property.key.name || property.key.value)),
        (
          property.kind === "set" ?
          Visit.node(
            property.value,
            scope,
            (
              property.computed ?
              null :
              property.key.name || property.key.value)) :
          Build.primitive(void 0)),
        (
          property.kind === "set" ?
          Visit.node(
            property.value,
            scope,
            (
              property.computed ?
              null :
              property.key.name || property.key.value)) :
          (
            property.kind === "get" ?
            Build.primitive(void 0) :
            Build.priitive(true))),
        Build.primitive(true),
        Build.primitive(true)]),
    Build.apply(
      Build.builtin("Object.create"),
      Build.primitive(void 0),
      [
        Build.buitlin("Object.prototype")])));

exports.SequenceExpression = (node, scope, name) => ArrayLite.reduceRight(
  node.expressions,
  (expression, node) => (
    expression ?
    Build.sequence(
      Visit.node(node, scope, ""),
      expression) :
    Visit.node(node, scope, "")),
  null);

exports.UnaryExpression = (node, scope, name) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Scope.typeof(scope, node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Build.conditional(
        Build.apply(
          Build.builtin("Reflect.deleteProperty"),
          Build.primitive(void 0),
          [
            Scope.token(
              scope,
              Visit.node(node.argument.object, scope, ""),
              (token) => Build.conditional(
                Build.binary(
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
                  Build.primitive(token),
                  Build.apply(
                    Build.builtin("Object"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, token)])))),
            (
              node.argument.computed ?
              Visit.node(node.argument.property, scope, "") :
              Build.primitive(node.argument.property.name))]),
        Build.primitive(true),
        (
          node.AranStrict ?
          Build.apply(
            Build.builtin("AranThrowTypeError"),
            Build.primitive(void 0),
            [
              Build.primitive("Cannot delete object property")]) :
          Build.primitive(false))) :
      (
        node.argument.type === "Identifier" ?
        Scope.delete(scope, node.argument.name) :
        Build.sequence(
          Visit.node(node.argument, scope, ""),
          Build.primitive(true)))) :
    Build.unary(
      node.operator,
      Visit.node(node.argument, scope, ""))));

exports.BinaryExpression = (node, scope, name) => Build.binary(
  node.operator,
  Visit.node(node.left, scope, ""),
  Visit.node(node.right, scope, ""));

exports.AssignmentExpression = (node, scope, name) => (
  node.operator === "=" ?
  Scope.assign(
    scope,
    false,
    node.left,
    Visit.expression(scope, node.right, "")) :
  Scope.update(
    scope,
    true,
    Reflect_apply(
      String_prototype_substring,
      node.operator,
      [0, node.operator.length-1]),
    node.left,
    Visit.expression(scope, node.right, "")));

exports.UpdateExpression = (node, scope, name) => Scope.update(
  scope,
  node.prefix,
  node.operator[0],
  node.argument,
  Build.primitive(1));

exports.LogicalExpression = (node, scope, name) => Scope.token(
  scope,
  Visit.node(node.left, scope),
  (token) => Build.conditional(
    Scope.read(scope, token),
    (
      node.operator === "&&" ?
      Visit.node(node.right, scope) :
      Scope.read(scope, token)),
    (
      node.operator === "||" ?
      Visit.node(node.right, scope) :
      Scope.read(scope, token))));

exports.ConditionalExpression = (node, scope, name) => Build.conditional(
  Visit.node(node.test, scope),
  Visit.node(node.consequent, scope),
  Visit.node(node.alternate, scope));

exports.NewExpression = (node, scope, name) => (
  ArrayLite.every(
    node.arguments,
    (node) => node.type !== "SpreadElement") ?
  Build.construct(
    Visit.node(node.callee, scope, ""),
    ArrayLite.map(
      node.arguments,
      (node) => Visit.node(node, scope, ""))) :
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.node(node.callee, scope),
      Build.apply(
        Build.builtin("Array.prototype.concat"),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          []),
        ArrrayLite.map(
          node.arguments,
          (node) => (
            node.type === "SpreadElement" ?
            Visit.node(node.argument, scope) :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.node(node, scope)]))))]));

exports.CallExpression = (node, scope) => (
  node.callee.type === "MemberExpression" ?
  Scope.token(
    scope,
    Visit.node(node.callee.object, scope, ""),
    (token) => (
      ArrayLite.every(
        node.arguments,
        (node) => node.type !== "SpreadElement") ?
      Build.apply(
        Property.get(
          scope,
          token,
          (
            node.callee.computed ?
            Visit.node(node.callee.property, scope, "") :
            Build.primitive(node.callee.property.name))),
        Scope.read(scope, token),
        ArrayLite.map(
          node.arguments,
          (node) => Visit.node(node, scope))) :
      Build.apply(
        Build.builtin("Reflect.apply"),
        Build.primitive(void 0),
        [
          Property.get(
            scope,
            token,
            (
              node.callee.computed ?
              Visit.node(node.callee.property, scope, "") :
              Build.primitive(node.callee.property.name))),
          Scope.read(scope, token),
          Build.apply(
            Build.builtin("Array.prototype.concat"),
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              []),
            ArrayLite.map(
              node.arguments,
              (node) => (
                argument.type === "SpreadElement" ?
                Visit.node(node.argument, scope) :
                Build.apply(
                  Build.builtin("Array.of"),
                  Build.primitive(void 0),
                  [
                    Visit.node(node, scope)]))))]))) :
  (
    (
      node.callee.type === "Identifier" &&
      node.callee.name === "eval") ?
    Lexical.token(
      Lexical.read("eval", scope),
      (token1) => Lexical.token(
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            node.arguments,
            (node) => Visit.node(node, scope))),
        (token2) => Build.conditional(
          Build.binary(
            "===",
            Scope.read(scope, token1),
            Build.builtin("eval")),
          Build.eval(
            Property.getunsafe(
              Scope.read(scope, token2),
              Build.primitive(0))),
          Build.apply(
            Scope.read(scope, token1),
            Build.primitive(void 0),
            ArrayLite.map(
              node.arguments,
              (node, index) => Property.getunsafe(
                Scope.read(scope, token2),
                Build.primitive(index))))),
        scope),
      scope) :
    Build.apply(
      Visit.node(node.callee, scope),
      Build.primitive(void 0),
      ArrayLite.map(
        node.arguments,
        (node) => Visit.node(node, scope)))));

exports.MemberExpression = (node, scope, name) => Scope.token(
  scope,
  Visit.node(node.object, scope),
  (token) => Property.get(
    scope,
    token,
    (
      node.computed ?
      Visit.node(node.property, scope) :
      Build.primitive(node.property.name))));

exports.MetaProperty = (node, scope, name) => Scope.read("new.target", scope);

exports.Identifier = (node, scope, name) => Scope.read(scope, node.name);

exports.Literal = (node, scope, name) => (
  node.regex ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));

exports.ArrowFunctionExpression = (node, scope, name) => Build.apply(
  Build.builtin("AranDefineDataProperty"),
  Build.primitive(void 0),
  [
    Build.apply(
      Build.builtin("AranDefineDataProperty"),
      Build.primitive(void 0),
      [
        Build.apply(
          Build.builtin("AranDefineDataProperty"),
          Build.primitive(void 0),
          [
            Build.closure(
              Scope.BLOCK(
                Scope.ExtendArrow(
                  (
                    Query.IsBodyStrict(node.body) ?
                    Scope.ExtendStrict(scope) :
                    scope)),
                ArrayLite.flatMap(node.params, Query.PatternNames),
                [],
                (scope) => ArrayLite.concat(
                  Build.Expression(
                    Build.conditional(
                      Build.argument("new.target"),
                      Build.apply(
                        Build.builtin("AranThrowTypeError"),
                        Build.primitive(void 0),
                        [
                          name+" is not a constructor"]),
                      Build.argument("this"))),
                  Scope.Token(
                    scope,
                    Build.argument("length"),
                    (token2) => ArrayLite.flatMap(
                      node.params,
                      (pattern, index) => (
                        pattern.type === "RestElement" ?
                        Scope.Token(
                          scope,
                          Build.apply(
                            Build.builtin("Array.of"),
                            Build.primitive(void 0),
                            []),
                          (token3) => ArrayLite.concat(
                            Scope.Token(
                              scope,
                              Build.primitive(0),
                              (token4) => Build.While(
                                [],
                                Build.binary(
                                  "<",
                                  Build.binary(
                                   "+",
                                   Scope.read(scope, token3),
                                   Build.primitive(
                                     Query.ClosureLength(node))),
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
                                        Property.setunsafe(
                                          Scope.read(scope, token3),
                                          Scope.read(scope, token4),
                                          Scope.read(scope, token5)))),
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
                        Scope.Assign(
                            scope,
                            true,
                            pattern,
                            Build.conditional(
                              Build.binary(
                                "<",
                                Build.primitive(index),
                                Scope.read(scope, token2)),
                              Build.argument("next"),
                              Build.primitive(void 0)))))),
                  (
                    node.expression ?
                    Build.Return(
                      Visit.node(node.body, scope, "")) :
                    ArrayLite.concat(
                      Build.Block(
                        null,
                        Visit.NODE(node.body, scope, true)),
                      Build.Return(
                        Build.primitive(void 0))))))),
            Build.primitive("length"),
            Build.primitive(
              (
                node.params.length && node.params[node.params.length-1].type === "RestElement" ?
                node.params.length - 1 :
                node.params.length)),
            Build.primitive(false),
            Build.primitive(false),
            Build.primitive(true)]),
        Build.primitive("name"),
        Build.primitive(name),
        Build.primitive(false),
        Build.primitive(false),
        Build.primitive(true)]),
    Build.primitive("prototype"),
    Build.primitive(void 0),
    Build.primitive(true),
    Build.primitive(false),
    Build.primitive(false)]),

exports.FunctionExpression = (node, scope, name) => Build.apply(
  Build.builtin("AranDefineDataProperty"),
  Build.primitive(void 0),
  [
    Build.apply(
      Build.builtin("AranDefineDataProperty"),
      Build.primitive(void 0),
      [
        Scope.token(
          scope,
          Build.primitive(void 0),
          (token1) => Scope.write(
            scope,
            token1,
            Build.closure(
              Scope.BLOCK(
                Scope.ExtendFunction(
                  (
                    Query.IsBodyStrict(node.body) ?
                    Scope.ExtendStrict(scope) :
                    scope)),
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
                      !ArrayLite.incudes(
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
                              Property.getunsafe(
                                Scope.read(scope, "new.target"),
                                Build.primitive("prototype")),
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
                          node.params,
                          (pattern, index) => (
                            pattern.type === "RestElement" ?
                            Identifer.Token(
                              scope,
                              Build.apply(
                                Build.builtin("Array.of"),
                                Build.primitive(void 0),
                                []),
                              (token3) => ArrayLite.concat(
                                Identifer.Token(
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
                                        Build.Token(
                                          Build.argument("next"),
                                          (token5) => Build.Expression(
                                            Property.setunsafe(
                                              Scope.read(scope, token3),
                                              Build.binary(
                                                "-",
                                                Scope.read(scope, token4),
                                                Build.primitive(node.params.length-1)),
                                              Scope.read(scope, token5))),
                                          scope),
                                        Scope.Write(
                                          scope,
                                          token4,
                                          Build.binary(
                                            "+",
                                            Scope.read(scope, token4),
                                            Build.primitive(1))))))),
                                Build.Expression(
                                  Pattern.assign(
                                    scope,
                                    Query.StrictDuplicate(node, index),
                                    pattern.argument,
                                    Scope.read(scope, token3),
                                    Build.primitive(void 0))))) :
                            Scope.Assign(
                              scope,
                              Query.StrictDuplicate(node, index),
                              pattern,
                              Build.conditional(
                                Build.binary(
                                  "<",
                                  Build.primitive(index),
                                  Scope.read(scope, token2)),
                                Build.argument("next"),
                                Build.primitive(void 0)),
                              Build.primitive(void 0)))),
                        (
                          (
                            node.params.length &&
                            node.params[node.params.length-1].type !== "RestElement") ?
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
                                      Build.primitive(1))))))) :
                          [])) :
                      ArrayLite.concat(
                        Scope.Initialize(
                          scope,
                          "arguments",
                          Build.apply(
                            Build.builtin("Object.create"),
                            Build.primitive(void 0),
                            [
                              Build.builtin("Object.prototype")])),
                        (
                          (function loop (tokens) { return (
                            (
                              tokens.length === node.params.length ||
                              node.params[tokens.length].type === "RestElement") ?
                            ArrayLite.concat(
                              Scope.Token(
                                scope,
                                Build.primitive(tokens.length),
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
                                    (scope) => Scope.Token(
                                      scope,
                                      Build.argument("next"),
                                      (token4) => Build.Expression(
                                        Build.apply(
                                          Build.builtin("AranDefineDataProperty"),
                                          Build.primitive(void 0),
                                          [
                                            Scope.read(scope, "arguments"),
                                            Scope.read(scope, token3),
                                            Scope.read(scope, token4),
                                            Build.primitive(true),
                                            Build.primitive(true),
                                            Build.primitive(true)])))))),
                              Build.Expression(
                                Build.apply(
                                  Build.builtin("AranDefineDataProperty"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.read(scope, "arguments"),
                                    Build.primitive("length"),
                                    Scope.read(scope, token2),
                                    Build.primitive(true),
                                    Build.primitive(false),
                                    Build.primitive(true)])),
                              Build.Expression(
                                Build.apply(
                                  (
                                    Scope.GetStrict(scope) ?
                                    Build.builtin("AranDefineDataProperty") :
                                    Build.builtin("AranDefineAccessorProperty")),
                                  Build.primitive(void 0),
                                  [
                                    Scope.read(scope, "arguments"),
                                    Build.primitive("callee"),
                                    (
                                      Scope.GetStrict(scope) ?
                                      Build.builtin("Object.getOwnPropertyDescriptor(Function.prototype,\"arguments\").get") :
                                      Scope.read(scope, token1)),
                                    (
                                      Scope.GetStrict(scope) ?
                                      Build.builtin("Object.getOwnPropertyDescriptor(Function.prototype,\"arguments\").set") :
                                      Build.primitive(true)),
                                    Build.primitive(false),
                                    Build.primitive(
                                      !Scope.GetStrict(scope))])),
                              Build.Expression(
                                Build.apply(
                                  Build.builtin("AranDefineDataProperty"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.read(scope, "arguments"),
                                    Build.builtin("Symbol.iterator"),
                                    Build.builtin("Array.prototype[Symbol.iterator]"),
                                    Build.primitive(true),
                                    Build.primitive(false),
                                    Build.primitive(true)])),
                              (
                                (
                                  Scope.GetStrict(scope) ||
                                  ArrayLite.some(node.params, (pattern) => pattern.type !== "Identifier")) ?
                                ArrayLite.flatMap(
                                  tokens,
                                  (token3, index1) => (
                                    ArrayLite.reduceRight(
                                      node.params,
                                      (boolean, pattern, index2) => (
                                        boolean ||
                                        (
                                          pattern.name === node.params[index1].name &&
                                          index2 > index1)),
                                      false) ?
                                    [] :
                                    Scope.Initialize(
                                      scope,
                                      node.params[index].name,
                                      Scope.read(scope, token3)))) :
                                ArrayLite.flatMap(
                                  tokens,
                                  (token3) => Scope.Initialize(
                                    scope,
                                    Query.StrictDuplicate(node, index),
                                    node.params[index],
                                    Scope.read(scope, token3))))) :
                            Scope.Token(
                              scope,
                              Build.conditional(
                                Build.binary(
                                  "<",
                                  Build.primitive(tokens.length),
                                  Scope.read(scope, token2)),
                                Build.argument("next"),
                                Build.primitive(void 0)),
                              (token3) => ArrayLite.concat(
                                Build.If(
                                  Build.binary(
                                    "<",
                                    Build.primitive(tokens.length),
                                    Scope.read(scope, token2)),
                                  Scope.BLOCK(
                                    scope,
                                    [],
                                    [],
                                    (scope) => Build.Expression(
                                      Build.apply(
                                        Build.builtin("AranDefineProperty"),
                                        Build.primitive(void 0),
                                        [
                                          Scope.read(scope, "arguments"),
                                          Build.primitive(index),
                                          Scope.read(scope, token3),
                                          Build.primitive(true),
                                          Build.primitive(true),
                                          Build.primitive(true)]))),
                                  Scope.BLOCK(scope, [], [], (scope) => [])),
                                loop(
                                  ArrayLite.concat(tokens, [token])))))})
                          ([])),
                        (
                          (
                            node.params.length &&
                            node.params[node.params.length-1].type === "RestElement") ?
                          Scope.Initialize(
                            scope,
                            node.params[node.params.length-1],
                            Build.apply(
                              Build.builtin("Array.prototype.slice"),
                              Scope.read(scope, "arguments"),
                              [
                                Build.primitive(node.params.length-1)])) :
                          [])))),
                  Build.Block(
                    [],
                    Visit.NODE(node.body, scope, true)),
                  Build.Return(
                    Build.conditional(
                      Scope.read(scope, "new.target"),
                      Scope.read(scope, "this"),
                      Build.primitive(void 0)))))),
            Build.apply(
              Build.builtin("AranDefineDataProperty"),
              Build.primitive(void 0),
              [
                Scope.read(scope, token1),
                Build.primitive("prototype"),
                Build.apply(
                  Build.builtin("AranDefineDataProperty"),
                  Build.primitive(void 0),
                  [
                    Build.apply(
                      Build.builtin("Object.create"),
                      Build.primitive(void 0),
                      [
                        Build.builtin("Object.prototype")]),
                    Build.primitive("constructor"),
                    Scope.read(scope, token1),
                    Build.primitive(true),
                    Build.primitive(false),
                    Build.primitive(true)]),
                Build.primitive(true),
                Build.primitive(false),
                Build.primitive(false)]))),
        Build.primitive("length"),
        Build.primitive(
          (
            node.params.length && node.params[node.params.length-1].type === "RestElement" ?
            node.params.length - 1 :
            node.params.length)),
        Build.primitive(false),
        Build.primitive(false),
        Build.primitive(true)]),
    Build.primitive("name"),
    Build.primitive(name),
    Build.primitive(false),
    Build.primitive(false),
    Build.primitive(true)]);

exports.FunctionDeclaration = exports.FunctionExpression;