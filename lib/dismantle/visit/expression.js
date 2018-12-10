
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Lexical = require("../lexical");
const Visit = require("./index.js");

const Reflect_apply = global.Reflect.apply;
const String_prototype_substring = global.String.prototype.substring;

exports.ThisExpression = (node, scope) => Lexical.read("this", scope);

exports.ArrayExpression = (node, scope) => (
  ArrayLite.every(
    node.elements,
    (element) => element && element.type !== "SpreadElement") ?
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (element) => (
        element ?
        Visit.expression(element, scope) :
        Build.primitive(void 0)))) :
  Build.apply(
    Build.builtin("Array.prototype.concat"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (element) => (
        element ?
        (
          element.type === "SpreadElement" ?
          Visit.expression(element.argument, scope) :
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              Visit.expression(element, scope)])) :
        Build.primitive(void 0)))));

exports.ObjectExpression = (node, scope) => (
  ArrayLite.every(
    node.properties,
    (property) => property.kind === "init") ?
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
            (property) => property.kind === "init")
          (property) => Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              (
                property.computed ?
                Visit.expression(property.key, scope) :
                Build.primitive(property.key.name || property.key.value)),
              Visit.expression(property.value, scope)])))]) :
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
          Visit.expression(property.key, scope) :
          Build.primitive(property.key.name || property.key.value)),
        (
          property.kind === "set" ?
          Build.primitive(void 0) :
          Visit.expression(property.value, scope)),
        (
          property.kind === "set" ?
          Visit.expression(property.value, scope) :
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

// const remove_duplicate = (array) => ArrayLite.filter(
//   array,
//   (element, index) => index = ArrayLite.lastIndexOf(array, element));
//     node.AranVariableNames = remove_duplicate(
//       ArrayLite.flatMap(node.expression ? [] : node.body.body, hoist_variable_names));
//     node.AranParameterNames = ArrayLite.flatMap(node.params, collect_pattern_names);
//     node.AranParameterNames = (
//       (
//         node.AranStrict ||
//         node.type === "ArrowFunctionExpression" ||
//         ArrayLite.some(node.params, (pattern) => pattern !== "Identifier")) ?
//       node.AranParameterNames :
//       remove_duplicate(node.AranParameterNames));

exports.FunctionExpression = (node, scope) => Build.apply(
  Build.builtin("Object.setPrototypeOf"),
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
            Build.apply(
              Build.builtin("AranDefineDataProperty"),
              Build.primitive(void 0),
              [
                Lexical.token(
                  Build.primitive(void 0),
                  (token1) => Build.write(
                    token1,
                    Build.closure(
                      Lexical.EXTEND(
                        true,
                        ArrayLite.concat(
                          (
                            (
                              node.id &&
                              !Query.PatternsContain(node.params, node.id.name)) ?
                            [node.id.name] :
                            []),
                          ["this", "new.target"],
                          (
                            Query.PatternsContain(node.params, "arguments") ?
                            [] :
                            ["arguments"]),
                          (

                            ArrayLite.every(node.params, (pattern) => pattern === "Identifier") ?
                            ArrayLite.filter(
                              ArrayLite.flatMap(node.params, Query.PatternNames),
                              (name, index, names) => index === ArrayLite.lastIndexOf(names, name)) :
                            ArrayLite.flatMap(node.params, Query.PatternNames))),
                        [],
                        (scope) => ArrayLite.concat(
                          (
                            (
                              node.id &&
                              !Query.PatternsContain(node.params, node.id.name)) ?
                            Build.Expression(
                              Lexical.Declare(
                                node.id.name,
                                Build.read(token1),
                                Build.primitive(void 0)
                                scope)) :
                            []),
                          Build.
                          Lexical.Declare(
                            "new.target",
                            Build.input("new.target"),
                            scope),
                          Lexical.Declare(
                            "this",
                            Build.conditional(
                              Lexical.read("new.target", scope),
                              Build.apply(
                                Build.builtin("Object.create"),
                                Build.primitive(void 0),
                                [
                                  Lexical.token(
                                    Build.apply(
                                      Build.builtin("Reflect.get"),
                                      Build.primitive(void 0),
                                      [
                                        Lexical.read("new.target", scope),
                                        Build.primitive("prototype")]),   
                                    (token) => Build.conditional(
                                      Build.binary(
                                        "==="
                                        Build.unary(
                                          "typeof",
                                          Build.read(token)),
                                        Build.primitive("object")),
                                      Build.conditional(
                                        Build.read(token),
                                        Build.read(token),
                                        Build.builtin("Object.prototype")),
                                      Build.conditional(
                                        Build.binary(
                                          "===",
                                          Build.unary(
                                            "typeof",
                                            Build.read(token)),
                                          Build.primitive("function")),
                                        Build.read(token),
                                        Build.builtin("Object.prototype"))))]),
                              Build.input("this")),
                            scope),
                          Lexical.Token(
                            Build.input("arguments"),
                            (token2) => ArrayLite.concat(
                              (
                                Query.PatternsContain(node.params, "arguments") ?
                                [] :
                                Lexical.Declare(
                                  "arguments",
                                  Build.apply(
                                    Build.builtin("AranDefineDataProperty"),
                                    Build.primitive(void 0),
                                    [
                                      Build.apply(
                                        (
                                          node.AranStrict ?
                                          Build.builtin("AranDefineAccessorProperty") :
                                          Build.builtin("AranDefineDataProperty")),
                                        Build.primitive(void 0),
                                        [
                                          Build.apply(
                                            Build.builtin("AranDefineDataProperty"),
                                            Build.primitive(void 0),
                                            [
                                              Build.apply(
                                                Build.builtin("Object.setPrototypeOf"),
                                                Build.primitive(void 0),
                                                [
                                                  Build.apply(
                                                    Build.builtin("Object.assign"),
                                                    Build.primitive(void 0),
                                                    [
                                                      Build.apply(
                                                        Build.builtin("Object.create"),
                                                        Build.primitive(void 0),
                                                        [
                                                          Build.primitive(null)]),
                                                      Build.read(token2)]),
                                                  Build.primitive("Object.prototype")]),
                                              Build.primitive("length"),
                                              Build.apply(
                                                Build.buitin("Reflect.get"),
                                                Build.primitive(void 0),
                                                [
                                                  Build.read(token2),
                                                  Build.primitive("length")]),
                                              Build.primitive(true),
                                              Build.primitive(false),
                                              Build.primitive(true)]),
                                          Build.primitive("callee"),
                                          (
                                            node.AranStrict ?
                                            Build.builtin("Function.prototype.arguments@get") :
                                            Build.read(token1)),
                                          (
                                            node.AranStrict ?
                                            Build.builtin("Function.prototype.arguments@set") :
                                            Build.primitive(true)),
                                          Build.primitive(false),
                                          (
                                            node.AranStrict ?
                                            Build.primitive(false) :
                                            Build.primitive(true))]),                      
                                      Build.builtin("Symbol.iterator"),
                                      Build.builtin("Array.prototype[Symbol.iterator]"),
                                      Build.primitive(true),
                                      Build.primitive(false),
                                      Build.primitive(true)]),
                                  scope),
                              ArrayLite.flatMap(
                                node.params,
                                (pattern, index) => Build.Expression(
                                  Lexical.declare(
                                    (
                                      pattern.type === "RestElement" ?
                                      pattern.argument :
                                      pattern),
                                    (
                                      patternm.type === "RestElement" ?
                                      Build.apply(
                                        Build.builtin("Array.prototype.slice"),
                                        Build.read(token2),
                                        [
                                          Build.primitive(index)]) :
                                      Build.apply(
                                        Build.builtin("Reflect.get"),
                                        Build.primitive(void 0),
                                        [
                                          Build.read(token2),
                                          Build.primitive(index)])),
                                    Build.primitive(void 0),
                                    scope))),
                            Build.Block(
                              null,
                              Visit.CLOSURE(node.body, scope)),
                            Build.Return(
                              Build.conditional(
                                Lexical.read("new.target", scope),
                                Lexical.read("this", scope),
                                Build.primitive(void 0)))))),
                    Build.read(token)),
                Build.primitive("length"),
                Build.primitive(
                  Query.ClosureLength(node)),
                Build.primitive(false),
                Build.primitive(false),
                Build.primitive(true)])
            Build.primitive("name"),
            Build.primitive(
              Query.ClosureName(node)),
            Build.primitive(false),
            Build.primitive(false),
            Build.primitive(true)]),
        Build.primitive("prototype"),
        Build.apply(
          Build.builtin("AranDefineDataProperty"),
          Build.primitive(void 0),
          [
            Build.apply(
              Build.builtin("Object.create"),
              Build.primitive(void 0),
              [
                Build.bultin("Object.prototype")]),
            Build.primitive("constructor"),
            Build.read($token1),
            Build.primitive(true),
            Build.primitive(false),
            Build.primitive(true)]),
        Build.primitive(true),
        Build.primitive(false),
        Build.primitive(false)]),
    Build.builtin("Function.prototype")]);

exports.FunctionDeclaration = FunctionExpression;

exports.ArrowFunctionExpression = (node, scope) => Build.apply(
  Build.builtin("Object.setPrototypeOf"),
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
            Build.apply(
              Build.builtin("AranDefineDataProperty"),
              Build.primitive(void 0),
              [
                Build.closure(
                  Lexical.EXTEND(
                    true,
                    ArrayLite.flatMap(node.params, Query.PatternNames),
                    [],
                    (scope) => ArrayLite.concat(
                      Build.Expression(
                        Build.conditional(
                          Build.input("new.target"),
                          Build.apply(
                            Build.builtin("ThrowTypeError"),
                            Build.primitive(void 0),
                            [
                              Query.ClosureName(node)+" is not a constructor"]),
                          Build.input("this"))),
                      Lexical.Token(
                        Build.input("arguments"),
                        (token) => ArrayLite.flatMap(
                          node.params,
                          (pattern, index) => Build.Expression(
                            Lexical.assign(
                              null,
                              (
                                pattern.type === "RestElement" ?
                                pattern.argument :
                                pattern),
                              (
                                pattern.type === "RestElement" ?
                                Build.apply(
                                  Build.builtin("Array.prototype.slice"),
                                  Build.read(token),
                                  [
                                    Build.primitive(index)]) :
                                Build.apply(
                                  Build.builtin("Reflect.get"),
                                  Build.primitive(void 0)
                                  [
                                    Build.read(token),
                                    Build.primitive(index)])),
                              Build.primitive(void 0),
                              scope)))),
                      (
                        node.expression ?
                        Build.Return(
                          Visit.expression(node.body, scope)) :
                        ArrayLite.concat(
                          Build.Block(
                            null,
                            Visit.CLOSURE(node.body, scope)),
                          Build.Return(
                            Build.primitive(void 0))))),
                    scope)),
                Build.primitive("length"),
                Build.primitive(
                  Query.ClosureLength(node)),
                Build.primitive(false),
                Build.primitive(false),
                Build.primitive(true)]),
            Build.primitive("name"),
            Build.primitive(
              Query.ClosureName(node)),
            Build.primitive(false),
            Build.primitive(false),
            Build.primitive(true)]),
        Build.primitive("prototype"),
        Build.primitive(void 0),
        Build.primitive(true),
        Build.primitive(false),
        Build.primitive(false)]),
    Build.builtin("Function.prototype")]);

exports.SequenceExpression = (node, scope) => ArrayLite.reduceRight(
  node.expressions,
  (expression, node) => (
    expression ?
    Build.sequence(
      Visit.expression(node, scope),
      expression) :
    Visit.expression(node, scope)),
  null);

exports.UnaryExpression = (node, scope) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Lexical.typeof(node.argument.name, scope) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Build.conditional(
        Build.apply(
          Build.builtin("Reflect.deleteProperty"),
          Build.primitive(void 0),
          [
            Lexical.token(
              Visit.expression(node.argument.object, scope),
              (token) => Build.conditional(
                Build.binary(
                  Build.unary(
                    "typeof",
                    Build.read(token)),
                  Build.primitive("object")),
                Build.read(token),
                Build.conditional(
                  Build.binary(
                    "===",
                    Build.read(token),
                    Build.primitive(void 0)),
                  Build.primitive(token),
                  Build.apply(
                    Build.builtin("Object"),
                    Build.primitive(void 0),
                    [
                      Build.read(token)]))),
              scope),
            (
              node.argument.computed ?
              Visit.expression(node.argument.property, scope) :
              Build.primitive(node.argument.property.name || node.argument.property.value))]),
        Build.primitive(true) :
        (
          node.AranStrict ?
          Build.apply(
            Build.builtin("AranThrowTypeError"),
            Build.primitive(void 0),
            [
              "Cannot delete object property"]) :
          BUild.primitive(false))) :
      (
        node.argument.type === "Identifier" ?
        Lexical.delete(node.argument.name, scope) :
        Build.sequence(
          Visit.expression(node.argument, scope),
          Build.primitive(true)))) :
    Build.unary(
      node.operator,
      Visit.expression(node.argument, scope))));

exports.BinaryExpression = (node, scope) => Build.binary(
  node.operator,
  Visit.expression(node.left, scope),
  Visit.expression(node.right, scope));

exports.AssignmentExpression = (node, scope) => (
  node.left.type === "MemberExpression" ?
  Lexical.token(
    Visit.expression(node.left.object, scope),
    (token1) => Lexical.token(
      (
        node.left.computed ?
        Visit.expression(node.left.property, scope) :
        Build.primitive(node.left.property.name || node.left.property.value)),
      (token2) => Lexical.token(
        Visit.expression(node.left.right, scope),
        (token3) => Build.conditional(
          Build.binary(
            "===",
            Build.read(token1),
            Build.primitive(null)),
          Build.apply(
            Build.builtin("AranThrowTypeError"),
            Build.primitive(void 0),
            [
              "Cannot access property of 'null'"]),
          Build.conditional(
            Build.binary(
              "===",
              Build.read(token1),
              Build.primitive(void 0)),
            Build.apply(
              Build.builtin("AranThrowTypeError"),
              Build.primitive(void 0),
              [
                "Cannot access property of 'undefined'"]),
            Build.conditional(
              Build.apply(
                Build.builtin("Reflect.set"),
                Build.primitive(void 0),
                [
                  (
                    node.AranStrict ?
                    Build.read(token1) :
                    Build.apply(
                      Build.builtin("Object"),
                      Build.primitive(void 0),
                      [
                        Build.read(token1)])),
                  Build.read(token2),
                  (
                    node.operator === "=" ?
                    Visit.expression(node.right, scope) :
                    Build.binary(
                      Reflect_apply(
                        String_prototype_substring,
                        node.operator,
                        [0, node.operator.length-1]),           
                      Build.apply(
                        Build.builtin("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Build.apply(
                            Build.builtin("Object"),
                            Build.primitive(void 0),
                            [
                              Build.read(token1)]),
                          Build.read(token2)]),
                      Visit.expression(node.right, scope)))]),
              Build.read(token3),
              (
                node.AranStrict ?
                Build.apply(
                  Build.builtin("ThrowTypeError"),
                  Build.primitive(void 0),
                  [
                    Build.primitive("Cannot write object property")]) :
                Build.read(token3))))),
        scope),
      scope),
    scope) :
  Lexical.assign(
    node.AranStrict,
    node.left,
    (
      node.operator === "=" ?
      Visit.expression(node.right, scope) :
      Build.binary(
        Reflect_apply(
          String_prototype_substring,
          node.operator,
          [0, node.operator.length-1]),
        Lexical.read(node.left.name, scope),
        Visit.expression(node.right, scope))),
    scope);

exports.UpdateExpression = (node, scope) => (
  node.argument.type === "MemberExpression" ?
  Lexical.token(
    Visit.expression(node.argument.object, scope),
    (token1) => Lexical.token(
      (
        node.argument.computed ?
        Visit.expression(node.argument.property, scope) :
        Build.primitive(node.argument.property.name || node.argument.property.value)),
      (token2) => Build.conditional(
        Build.binary(
          "===",
          Build.read(token1),
          Build.primitive(null)),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot access property of 'null'")]),
        Build.conditional(
          Build.binary(
            "===",
            Build.read(token1),
            Build.primitive(void 0)),
          Buid.apply(
            Build.builtin("AranThrowTypeError"),
            Build.primitive(void 0),
            [
              Build.primitive("Cannot access property of 'undefined'")]),
          Lexical.token(
            (
              node.prefix ?
              Build.binary(
                node.operator[0],
                Build.apply(
                  Build.builtin("Reflect.get"),
                  Build.primitive(void 0),
                  [
                    Build.apply(
                      Build.builtin("Object"),
                      Build.primitive(void 0),
                      [
                        Build.read(token1)]),
                    Build.read(token2)]),
                Build.primitive(1))),
            (token3) => Build.conditional(
              Build.apply(
                Build.builtin("Reflect.set"),
                Build.primitive(void 0),
                [
                  (
                    node.AranStrict ?
                    Build.read(token1) :
                    Build.apply(
                      Build.builtin("Object"),
                      Build.primitive(void 0),
                      [
                        Build.read(token1)])),
                  Build.read(token2),
                  (
                    node.prefix ?
                    Build.read(token3) :
                    Build.binary(
                      node.operator[0],
                      Build.read(token3),
                      Build.primitive(1)))]),
              Build.read(token3),
              (
                node.AranStrict ?
                Build.apply(
                  Build.builtin("AranThrowTypeError"),
                  Build.primitive(void 0),
                  [
                    Build.primitive("Cannot assign object property")]) :
                Build.read(token3))),
            scope))),
      scope),
    scope) :
  Lexical.token(
    (
      node.prefix ?
      Build.binary(
        node.operator[0],
        Lexical.read(node.argument.name, scope),
        Build.primitive(1)) :
      Lexical.read(node.argument.name, scope)),
    (token) => Lexical.write(
      node.AranStrict,
      node.argument.name,
      (
        node.prefix ?
        Build.read(token) :
        Build.binary(
          node.operator[0],
          Build.read(token),
          Build.primitive(1))),
      Build.read(token))));

exports.LogicalExpression = (node, scope) => Lexical.token(
  Visit.expression(node.left, scope),
  (token) => Build.conditional(
    Build.read(token),
    (
      node.operator === "&&" ?
      Visit.expression(node.right, scope) :
      Build.read(token)),
    (
      node.operator === "||" ?
      Visit.expression(node.right, scope) :
      Build.read(token))));

exports.ConditionalExpression = (node, scope) => Build.conditional(
  Visit.expression(node.test, scope),
  Visit.expression(node.consequent, scope),
  Visit.expression(node.alternate, scope));

exports.NewExpression = (node, scope) => (
  ArrayLite.every(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  Build.construct(
    Visit.expression(node.callee, scope),
    ArrayLite.map(
      node.arguments,
      (argument) => Visit.expression(argument, scope))) :
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.expression(node.callee, scope),
      Build.apply(
        Build.builtin("Array.prototype.concat"),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          []),
        ArrrayLite.map(
          node.arguments,
          (argument) => (
            argument.type === "SpreadElement" ?
            Visit.expression(argument.argument, scope) :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.expression(argument, scope)]))))]));

exports.CallExpression = (node, scope) => (
  node.callee.type === "MemberExpression" ?
  Lexical.token(
    Visit.expression(node.callee),
    (token) => (
      ((expression) => (
        ArrayLite.every(
          node.arguments,
          (argument) => argument.type !== "SpreadElement") ?
        Build.apply(
          expression,
          Build.read($token),
          ArrayLite.map(
            node.arguments,
            (argument) => Visit.expression(argument, scope))) :
        Build.apply(
          Build.builtin("Reflect.apply"),
          Build.primitive(void 0),
          [
            expression,
            Build.read($token),
            Build.apply(
              Build.builtin("Array.prototype.concat"),
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                []),
              ArrayLite.map(
                node.arguments,
                (argument) => (
                  argument.type === "SpreadElement" ?
                  Visit.expression(argument.argument, scope) :
                  Build.apply(
                    Build.builtin("Array.of"),
                    Build.primitive(void 0),
                    [
                      Visit.expression(argument, scope)]))))])))
      Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.conditional(
            Build.binary(
              "===",
              Build.unary(
                "typeof",
                Build.read(token)),
              Build.primitive("object")),
            Build.read(token),
            Build.conditional(
              Build.binary(
                "===",
                Build.read(token),
                Build.primitive(void 0)),
              Build.read($token),
              Build.apply(
                Build.builtin("Object"),
                Build.primitive(void 0),
                [
                  Build.read(token)]))),
          (
            node.callee.computed ?
            Visit.expression(node.callee.property, scope) :
            Build.primitive((node.callee.property.name || node.callee.property.value))])),
    scope) :
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
            (argument) => Visit.expression(argument, scope))),
        (token2) => Build.conditional(
          Build.binary(
            "===",
            Build.read(token1),
            Build.builtin("eval")),
          Build.eval(
            Build.apply(
              Build.builtin("Reflect.get"),
              Build.primitive(void 0),
              [
                Build.read(token2),
                Build.primitive(0)])),
          Build.apply(
            Build.read(token1),
            Build.primitive(void 0),
            ArrayLite.map(
              node.arguments,
              (_, index) => Build.apply(
                Build.builtin("Reflect.get"),
                Build.primitive(void 0),
                [
                  Build.read(token2),
                  Build.primitive(index)])))),
        scope),
      scope) :
    Build.apply(
      Visit.expression(node.callee, scope),
      Build.primitive(void 0),
      ArrayLite.map(
        node.arguments,
        (argument) => Visit.expression(argument, scope)))));

exports.MemberExpression = (node, scope) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [
    Lexical.token(
      Visit.expression(node.object, scope),
      (token) => Build.conditional(
        Build.binary(
          "===",
          Build.unary(
            "typeof",
            Build.read($token)),
          Build.primitive("object")),
        Build.read($token),
        Build.conditional(
          Build.binary(
            "===",
            Build.read($token),
            Build.primitive(void 0)),
          Build.read($token),
          Build.apply(
            Build.buitlin("Object"),
            Build.primitive(void 0),
            [
              Build.read($token)]))),
      scope),
    (
      node.computed ?
      Visit.expression(node.property, scope) :
      Build.primitive(node.property.name || node.property.value))]);

exports.MetaProperty = (node, scope) => Lexical.read("new.target", scope);

exports.Identifier = (node, scope) => Lexical.read(node.name, scope);

exports.Literal = (node, scope) => (
  node.regex ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));
