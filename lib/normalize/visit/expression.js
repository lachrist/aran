
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");
const Closure = require("./closure.js");

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

exports.ObjectExpression = (node, scope, name) => Scope.token(
  scope,
  Build.apply(
    Build.builtin("Object.create"),
    Build.primitive(void 0),
    [
      Build.primitive(null)]),
  (token1) => Scope.token(
    scope,
    Build.builtin("Object.prototype"),
    (token2) => Build.sequence(
      Build.apply(
        Build.builtin("Reflect.setPrototypeOf"),
        Build.primitive(void 0),
        [
          ArrayLite.reduceRight(
            node.properties,
            (expression, property1, index1) => Build.sequence(
              (
                property1.type === "SpreadElement" ?
                Build.apply(
                  Scope.read(
                    scope,
                    Scope.GetToken(scope, "HelperObjectSpread")),
                  Build.primitive(void 0),
                  [
                    Scope.read(scope, token1),
                    Visit.node(property1.argument, scope, "")]) :
                (
                  (
                    property1.computed ?
                    (
                      property1.key.type === "Literal" &&
                      property1.key.value === "__proto__") :
                    (
                      property1.key.name === "__proto__" ||
                      property1.key.value === "__proto__")) ?
                  Scope.write(
                    scope,
                    token2,
                    Visit.node(property1.value, scope, "__proto__")) :
                  (
                    property1.kind === "init" ?
                    (  
                      ArrayLite.every(
                        node.properties,
                        (property2, index2) => (
                          index2 >= index1 ||
                          property2.kind !== "set" ||
                          (
                            !property1.computed &&
                            !property2.computed &&
                            (
                              (property1.key.name || property1.key.value) !==
                              (property2.key.name || property2.key.value))))) ?
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token1),
                          (
                            property1.computed ?
                            Visit.node(property1.key, scope, "") :
                            Build.primitive(property1.key.name || property1.key.value)),
                          Visit.node(
                            property1.value,
                            scope,
                            (
                              property1.computed ?
                              (
                                property1.key.type === "Literal" ?
                                String(property1.key.value) :
                                "") :
                              property1.key.name || property1.key.value))]) :
                      Build.apply(
                        Build.builtin("Reflect.defineProperty"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token1),
                          (
                            property1.computed ?
                            Visit.node(property1.key, scope, "") :
                            Build.primitive(property1.key.name || property1.key.value)),
                          Scope.token(
                            scope,
                            Build.apply(
                              Build.builtin("Object.create"),
                              Build.primitive(void 0),
                              [
                                Build.primitive(null)]),
                            (token) => Build.sequence(
                              Build.apply(
                                Build.builtin("Reflect.set"),
                                Build.primitive(void 0),
                                [
                                  Scope.read(scope, token),
                                  Build.primitive("value"),
                                  Visit.node(
                                    property1.value,
                                    scope,
                                    (
                                      property1.computed ?
                                      (
                                        property1.key.type === "Literal" ?
                                        String(property1.key.value) :
                                        "") :
                                      property1.key.name || property1.key.value))]),
                              Build.sequence(
                                Build.apply(
                                  Build.builtin("Reflect.set"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.read(scope, token),
                                    Build.primitive("writable"),
                                    Build.primitive(true)]),
                                Build.sequence(
                                  Build.apply(
                                    Build.builtin("Reflect.set"),
                                    Build.primitive(void 0),
                                    [
                                      Scope.read(scope, token),
                                      Build.primitive("enumerable"),
                                      Build.primitive(true)]),
                                  Build.sequence(
                                    Build.apply(
                                      Build.builtin("Reflect.set"),
                                      Build.primitive(void 0),
                                      [
                                        Scope.read(scope, token),
                                        Build.primitive("configurable"),
                                        Build.primitive(true)]),
                                    Scope.read(scope, token))))))])) :
                    Build.apply(
                      Build.builtin("Reflect.defineProperty"),
                      Build.primitive(void 0),
                      [
                        Scope.read(scope, token1),
                        (
                          property1.computed ?
                          Visit.node(property1.key, scope, "") :
                          Build.primitive(property1.key.name || property1.key.value)),
                        Scope.token(
                          scope,
                          Build.apply(
                            Build.builtin("Object.create"),
                            Build.primitive(void 0),
                            [
                              Build.primitive(null)]),
                          (token) => Build.sequence(
                            Build.apply(
                              Build.builtin("Reflect.set"),
                              Build.primitive(void 0),
                              [
                                Scope.read(scope, token),
                                Build.primitive(property1.kind),
                                Visit.node(
                                  property1.value,
                                  scope,
                                  (
                                    property1.computed ?
                                    (
                                      property1.key.type === "Literal" ?
                                      property1.kind + " " + String(property1.key.value) :
                                      property1.kind) :
                                    property1.kind + " " + (property1.key.name || property1.key.value)))]),
                            Build.sequence(
                              Build.apply(
                                Build.builtin("Reflect.set"),
                                Build.primitive(void 0),
                                [
                                  Scope.read(scope, token),
                                  Build.primitive("enumerable"),
                                  Build.primitive(true)]),
                              Build.sequence(
                                Build.apply(
                                  Build.builtin("Reflect.set"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.read(scope, token),
                                    Build.primitive("configurable"),
                                    Build.primitive(true)]),
                                Scope.read(scope, token)))))])))),
              expression),
            Scope.read(scope, token1)),
          Scope.read(scope, token2)]),
      Scope.read(scope, token1))));

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
          Build.throw(
            Build.construct(
              Build.builtin("TypeError"),
              [
                Build.primitive("Cannot delete object property")])),
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
    Visit.node(
      node.right,
      scope,
      node.left.type === "Identifier" ? node.left.name : "")) :
  Scope.update(
    scope,
    true,
    Reflect_apply(
      String_prototype_substring,
      node.operator,
      [0, node.operator.length-1]),
    node.left,
    Visit.node(node.right, scope, "")));

exports.UpdateExpression = (node, scope, name) => Scope.update(
  scope,
  node.prefix,
  node.operator[0],
  node.argument,
  Build.primitive(1));

exports.LogicalExpression = (node, scope, name) => Scope.token(
  scope,
  Visit.node(node.left, scope, ""),
  (token) => Build.conditional(
    Scope.read(scope, token),
    (
      node.operator === "&&" ?
      Visit.node(node.right, scope, "") :
      Scope.read(scope, token)),
    (
      node.operator === "||" ?
      Visit.node(node.right, scope, "") :
      Scope.read(scope, token))));

exports.ConditionalExpression = (node, scope, name) => Build.conditional(
  Visit.node(node.test, scope, ""),
  Visit.node(node.consequent, scope, ""),
  Visit.node(node.alternate, scope, ""));

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
      Visit.node(node.callee, scope, ""),
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
            Visit.node(node.argument, scope, "") :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.node(node, scope, "")]))))]));

exports.CallExpression = (node, scope) => (
  ArrayLite.some(
    node.arguments,
    (node) => node.type === "SpreadElement") ?
  Scope.token(
    scope,
    (
      node.callee.type === "MemberExpression" ?
      Visit.node(node.callee.object, scope, "") :
      Build.primitive(void 0)),
    (token) => Build.apply(
      Build.builtin("Reflect.apply"),
      Build.primitive(void 0),
      [
        (
          node.callee.type === "MemberExpression" ?
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.conditional(
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
                    Build.builtin("Object"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, token)]))),
              (
                node.callee.computed ?
                Visit.node(node.callee.property, scope, "") :
                Build.primitive(node.callee.property.name)),
              Scope.read(scope, token)]) :
          Visit.node(node.callee, scope, "")),
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
              node.type === "SpreadElement" ?
              Visit.node(node.argument, scope, "") :
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                [
                  Visit.node(node, scope, "")]))))])) :
  (
    (
      node.callee.type === "Identifier" &&
      node.callee.name === "eval" &&
      node.arguments.length) ?
    Scope.token(
      scope,
      Scope.read(scope, "eval"),
      (token1) => (function loop (tokens) { return (
        tokens.length < node.arguments.length ?
        Scope.token(
          scope,
          Visit.node(node.arguments[tokens.length], scope, ""),
          (token2) => loop(ArrayLite.concat(tokens, [token2]))) :
        Build.conditional(
          Build.binary(
            "===",
            Scope.read(scope, token1),
            Build.builtin("eval")),
          Scope.eval(
            scope,
            Scope.read(scope, tokens[0])),
          Build.apply(
            Scope.read(scope, token1),
            Build.primitive(void 0),
            ArrayLite.map(
              tokens,
              (token) => Scope.read(scope, token))))) } ([]))) :
    (
      node.callee.type === "MemberExpression" ?
      Scope.token(
        scope,
        Visit.node(node.callee.object, scope, ""),
        (token) => Build.apply(
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.conditional(
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
                    Build.builtin("Object"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, token)]))),
              (
                node.callee.computed ?
                Visit.node(node.callee.property, scope, "") :
                Build.primitive(node.callee.property.name)),
              Scope.read(scope, token)]),
          Scope.read(scope, token),
          ArrayLite.map(
            node.arguments,
            (node) => Visit.node(node, scope, "")))) :
      Build.apply(
        Visit.node(node.callee, scope, ""),
        Build.primitive(void 0),
        ArrayLite.map(
          node.arguments,
          (node) => Visit.node(node, scope, ""))))));

exports.MemberExpression = (node, scope, name) => Scope.token(
  scope,
  Visit.node(node.object, scope),
  (token) => Build.apply(
    Build.builtin("Reflect.get"),
    Build.primitive(void 0),
    [
      Build.conditional(
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
            Build.builtin("Object"),
            Build.primitive(void 0),
            [
              Scope.read(scope, token)]))),
      (
        node.computed ?
        Visit.node(node.property, scope, "") :
        Build.primitive(node.property.name)),
      Scope.read(scope, token)]));

exports.MetaProperty = (node, scope, name) => Scope.read(scope, "new.target");

exports.Identifier = (node, scope, name) => Scope.read(scope, node.name);

exports.Literal = (node, scope, name) => (
  node.regex ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));

exports.TemplateLiteral = (node, scope, name) => ArrayLite.reduce(
  node.quasis,
  (expression, element, index) => (
    element.tail ?
    Build.binary(
      "+",
      expression,
      Build.primitive(element.value.cooked)) :
    Build.binary(
      "+",
      expression,
      Build.binary(
        "+",
        Build.primitive(element.value.cooked),
        Visit.node(
          node.expressions[index],
          scope,
          "")))),
  Build.primitive(""));
  
exports.TaggedTemplateExpression = (node, scope, name) => Build.apply(
  Visit.node(node.tag, scope, ""),
  Build.primitive(void 0),
  ArrayLite.concat(
    [
      Build.apply(
        Build.builtin("Object.freeze"),
        Build.primitive(void 0),
        [
          Scope.token(
            scope,            
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              ArrayLite.map(
                node.quasi.quasis,
                (element) => Build.primitive(element.value.cooked))),
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
                      Build.apply(
                        Build.builtin("Object.freeze"),
                        Build.primitive(void 0),
                        [
                          Build.apply(
                            Build.builtin("Array.of"),
                            Build.primitive(void 0),
                            ArrayLite.map(
                              node.quasi.quasis,
                              (element) => Build.primitive(element.value.raw)))])]),
                  Build.apply(
                    Build.builtin("Reflect.defineProperty"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, token1),
                      Build.primitive("raw"),
                      Scope.read(scope, token2)]))),
              Scope.read(scope, token1)))])],
    ArrayLite.map(
      node.quasi.expressions,
      (node) => Visit.node(node, scope, ""))));

exports.ArrowFunctionExpression = Closure.ArrowFunctionExpression;

exports.FunctionExpression = Closure.FunctionExpression;
