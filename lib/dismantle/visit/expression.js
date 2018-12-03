
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope.js");
const Short = require("../short.js");
const Lexical = require("../lexical");
const Visit = require("./index.js");

const Reflect_apply = global.Reflect.apply;
const String_prototype_substring = global.String.prototype.substring;

exports.ThisExpression = (node, scope) => Build.read("this");

// NICE-TO-HAVE
// Empty elements should be non-existant and not set to undefined
exports.ArrayExpression = (node, scope) => (
  ArrayLite.some(
    node.elements,
    (element) => element && element.type === "SpreadElement") ?
  Short.concat(
    ArrayLite.map(
      node.elements,
      (element) => (
        element ?
        (
          element.type === "SpreadElement" ?
          Visit.expression(element.argument, scope) :
          Short.array(
            [
              Visit.expression(element, scope)])) :
        Build.primitive(void 0)))) :
  Short.array(
    ArrayLite.map(
      node.elements,
      (element) => (
        element ?
        Visit.expression(element, scope) :
        Build.primitive(void 0)))));

exports.ObjectExpression = (node, scope) => Short.initialize(
  ArrayLite.map(
    node.properties,
    (property) => [
      property.kind,
      (
        property.computed ?
        Visit.expression(property.key, scope) :
        Build.primitive(property.key.name || property.key.value)),
      Visit.expression(property.value, scope)]));

exports.FunctionExpression = (node, scope) => Short.define(
  Short.define(
    Build.closure(
      Lexical.BLOCK(
        node.AranStrict,
        ArrayLite.concat(
          node.AranParameterNames,
          ["this", "new.target"],
          (
            (
              node.id &&
              !ArrayLite.includes(node.AranParameterNames, node.id.name)) ?
            [node.id.name] :
            []),
          (
            !ArrayLite.includes(node.AranParameterNames, "arguments") ?
            ["arguments"] :
            [])),
        [],
        (scope, $token) => (
          $token = (
            ArrayLite.includes(node.AranParameterNames, "arguments") ?
            Scope.token(scope2) :
            null),
          ArrayLite.concat(
            (
              (
                node.id &&
                !ArrayLite.includes(node.AranParameterNames, node.id.name)) ?
              Lexical.Declare(
                node.id.name,
                Build.arrival(0),
                scope) :
              Build.Expression(
                Build.arrival(0))),
            Lexical.Declare(
              "new.target",
              Build.arrival(1),
              scope),
            Lexical.Declare(
              "this",
              Build.arrival(2),
              scope),
            (
              node.AranStrict ?
              [] :
              Build.Write(
                "this",
                Build.conditional(
                  Short.binary(
                    "===",
                    Build.read("this"),
                    Build.primitive(null)),
                  Build.builtin("global"),
                  Build.conditional(
                    Short.binary(
                      "===",
                      Build.read("this"),
                      Build.primitive(void 0)),
                    Build.builtin("global"),
                    Short.convert(
                      Build.read("this")))))),
            (
              $token ?
              Build.Write(
                $token,
                Build.arrival(3)) :
              Lexical.Declare(
                "arguments",
                Build.arrival(3),
                scope)),
            (
              ArrayLite.every(
                node.params,
                (pattern) => pattern.type === "Identifier") ?
              ArrayLite.flatMap(
                node.params,
                (pattern, index) => Lexical.Declare(
                  pattern.name,
                  Short.get(
                    (
                      $token ?
                      Build.read($token) :
                      Lexical.read("arguments", scope)),
                    Build.primitive(index)),
                  scope)) :
              ArrayLite.concat(
                (
                  $token ? 
                  [] :
                  Build.Write(
                    $token = Scope.token(scope),
                    Lexical.read("arguments", scope))),
                Build.Expression(
                  Lexical.assign(
                    null,
                    {
                      type: "ArrayPattern",
                      elements: node.params},
                    $token,
                    scope)))),
            Build.Block(
              null,
              Lexical.BLOCK(
                node.AranStrict,
                node.AranVariableNames,
                [],
                (scope) => ArrayLite.flatMap(
                  node.AranVariableNames,
                  (name) => Lexical.Declare(
                    name,
                    Build.primitive(void 0),
                    scope)),
                node.body.body,
                scope)),
            Build.Return(
              Build.primitive(void 0)))),
        [],
        Scope.Closure(scope))),
    Build.primitive("length"),
    Short.initialize(
      [
        [
          "init",
          Build.primitive("configurable"),
          Build.primitive(true)],
        [
          "init",
          Build.primitive("value"),
          Build.primitive(node.AranLength)]])),
  Build.primitive("name"),
  Short.initialize(
    [
      [
        "init",
        Build.primitive("configurable"),
        Build.primitive(true)],
      [
        "init",
        Build.primitive("value"),
        Build.primitive(node.AranName)]]));

exports.ArrowFunctionExpression = (node, scope) => Short.define(
  Short.define(
    Build.closure(
      Lexical.BLOCK(
        node.AranStrict,
        node.AranParameterNames,
        [],
        (scope, $token) => ArrayLite.concat(
          Build.Expression(
            Build.arrival(0)),
          Build.If(
            null,
            Build.arrival(1),
            [
              [],
              Build.Throw(
                Short.type_error(
                  node.AranName+" is not a constructor"))],
            [
              [],
              []]),
          Build.Expression(
            Build.arrival(2)),
          Build.Write(
            $token = Scope.token(scope),
            Build.arrival(3)),
          (
            ArrayLite.every(
              node.params,
              (pattern) => pattern.type === "Identifier") ?
            ArrayLite.flatMap(
              node.params,
              (pattern, index) => Lexical.Declare(
                pattern.name,
                Short.get(
                  Build.read($token),
                  Build.primitive(index)),
                scope)) :
            Build.Expression(
              Lexical.assign(
                null,
                {
                  type: "ArrayPattern",
                  elements: node.params},
                $token,
                scope))),
          (
            node.expression ?
            Build.Return(
              Visit.expression(node.body, scope)) :
            ArrayLite.concat(        
              Build.Block(
                null,
                Lexical.BLOCK(
                  node.AranStrict,
                  node.AranVariableNames,
                  [],
                  (scope) => ArrayLite.flatMap(
                    node.AranVariableNames,
                    (name) => Lexical.Declare(
                      name,
                      Build.primitive(void 0),
                      scope)),
                  node.body.body,
                  scope)),
              Build.Return(
                Build.primitive(void 0))))),
        [],
        Scope.Closure(scope))),
    Build.primitive("length"),
    Short.initialize(
      [
        [
          "init",
          Build.primitive("configurable"),
          Build.primitive(true)],
        [
          "init",
          Build.primitive("value"),
          Build.primitive(node.AranLength)]])),
  Build.primitive("name"),
  Short.initialize(
    [
      [
        "init",
        Build.primitive("configurable"),
        Build.primitive(true)],
      [
        "init",
        Build.primitive("value"),
        Build.primitive(node.AranName)]]));

exports.SequenceExpression = (node, scope) => ArrayLite.reduce(
  node.expressions,
  (expression, node) => Build.sequence(
    expression,
    Visit.expression(node, scope)),
  Build.primitive(void 0));

exports.UnaryExpression = (node, scope, $token1, $token2) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Lexical.typeof(node.argument.name, scope) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Build.write(
        $token1 = Scope.token(scope),
        Visit.expression(node.argument.object, scope),
        Build.write(
          $token2 = Scope.token(scope),
          (
            node.argument.computed ?
            Visit.expression(node.argument.property, scope) :
            Build.primitive(node.argument.property.name || node.argument.property.value)),
          Short.delete(
            node.AranStrict,
            Build.read($token1),
            Build.read($token2)))) :
      (
        node.argument.type === "Identifier" ?
        Lexical.delete(node.argument.name, scope) :
        Build.sequence(
          Visit.expression(node.argument, scope),
          Build.primitive(true)))) :
    Short.unary(
      node.operator,
      Visit.expression(node.argument, scope))));

exports.BinaryExpression = (node, scope) => Short.binary(
  node.operator,
  Visit.expression(node.left, scope),
  Visit.expression(node.right, scope));

exports.AssignmentExpression = (node, scope, $token1, $token2, $token3) => (
  node.left.type === "MemberExpression" ?
  Build.write(
    $token1 = Scope.token(scope),
    Visit.expression(node.left.object, scope),
    Build.write(
      $token2 = Scope.token(scope),
      (
        node.left.computed ?
        Visit.expression(node.left.property, scope) :
        Build.primitive(node.left.property.name || node.left.property.value)),
      Build.write(
        $token3 = Scope.token(scope),
        (
          node.operator === "=" ?
          Visit.expression(node.right, scope) :
          Short.binary(
            Reflect_apply(
              String_prototype_substring,
              node.operator,
              [0, node.operator.length-1]),
            Short.get(
              Build.read($token1),
              Build.read($token2)),
            Visit.expression(node.right, scope))),
        Build.sequence(
          Short.set(
            node.AranStrict,
            Build.read($token1),
            Build.read($token2),
            Build.read($token3)),
          Build.read($token3))))) :
  Build.write(
    $token1 = Scope.token(scope),
    (
      node.operator === "=" ?
      Visit.expression(node.right, scope) :
      Short.binary(
        Reflect_apply(String_prototype_substring, node.operator, [0, node.operator.length-1]),
        Lexical.read(
          node.left.name,
          scope),
        Visit.expression(node.right, scope))),
    Build.sequence(
      Lexical.assign(node.AranStrict, node.left, $token1, scope),
      Build.read($token1))));

exports.UpdateExpression = (node, scope, $token1, $token2, $token3, $token4, $token5) => (
  node.argument.type === "MemberExpression" ?
  Build.write(
    $token1 = Scope.token(scope),
    Visit.expression(node.argument.object, scope),
    Build.write(
      $token2 = Scope.token(scope),
      (
        node.argument.computed ?
        Visit.expression(node.argument.property, scope) :
        Build.primitive(node.argument.property.name || node.argument.property.value)),
      Build.write(
        $token3 = Scope.token(scope),
        Short.get(
          Build.read($token1),
          Build.read($token2)),
        Build.write(
          $token4 = Scope.token(scope),
          Short.binary(
            node.operator[0],
            Build.read($token3),
            Build.primitive(1)),
          Build.sequence(
            Short.set(
              node.AranStrict,
              Build.read($token1),
              Build.read($token2),
              Build.read($token4)),
            (
              node.prefix ?
              Build.read($token4) :
              Build.read($token3))))))) :
  Build.write(
    $token1 = Scope.token(scope),
    Lexical.read(node.argument.name, scope),
    Build.write(
      $token2 = Scope.token(scope),
      Short.binary(
        node.operator[0],
        Build.read($token1),
        Build.primitive(1)),
      Build.sequence(
        Lexical.write(
          node.AranStrict,
          node.argument.name,
          $token2,
          scope),
        Build.read(
          node.prefix ?
          $token2 :
          $token1)))));

exports.LogicalExpression = (node, scope, $token) => Build.write(
  $token = Scope.token(scope),
  Visit.expression(node.left, scope),
  Build.conditional(
    Build.read($token),
    (
      node.operator === "&&" ?
      Visit.expression(node.right, scope) :
      Build.read($token)),
    (
      node.operator === "||" ?
      Visit.expression(node.right, scope) :
      Build.read($token))));

exports.ConditionalExpression = (node, scope) => Build.conditional(
  Visit.expression(node.test, scope),
  Visit.expression(node.consequent, scope),
  Visit.expression(node.alternate, scope));

exports.NewExpression = (node, scope) => (
  ArrayLite.some(
    node.arguments,
    (argument) => argument.type === "SpreadElement") ?
  Short.construct(
    Visit.expression(node.callee, scope),
    Short.concat(
      ArrrayLite.map(
        node.arguments,
        (argument) => (
          argument.type === "SpreadElement" ?
          Visit.expression(argument.argument, scope) :
          Short.array(
            [
              Visit.expression(argument, scope)]))))) :
  Build.construct(
    Visit.expression(node.callee, scope),
    ArrayLite.map(
      node.arguments,
      (argument) => Visit.expression(argument, scope))));

// eval(x, ...xs) is not direct

exports.CallExpression = (node, scope, $token, $tokens = []) => (
  node.callee.type === "MemberExpression" ?
  Build.write(
    $token = Scope.token(scope),
    Visit.expression(node.callee.object, scope),
    (
      ArrayLite.every(
        node.arguments,
        (argument) => argument.type !== "SpreadElement") ?
      Build.apply(
        Short.get(
          Build.read($token),
          (
            node.callee.computed ?
            Visit.expression(node.callee.property, scope) :
            Build.primitive(node.callee.property.name || node.callee.property.value))),
        Build.read($token),
        ArrayLite.map(
          node.arguments,
          (argument) => Visit.expression(argument, scope))) :
      Short.apply(
        Short.get(
          Build.read($token),
          (
            node.callee.computed ?
            Visit.expression(node.callee.property, scope) :
            Build.primitive(node.callee.property.name || node.callee.property.value))),
        Build.read($token),
        Short.concat(
          ArrayLite.map(
            node.arguments,
            (argument) => (
              argument.type === "SpreadElement" ?
              Visit.expression(argument.argument, scope) :
              Short.array(
                Visit.expression(argument, scope)))))))) :
  (
    ArrayLite.every(
      node.arguments,
      (argument) => argument.type !== "SpreadElement") ?
    (
      (
        node.callee.type === "Identifier" &&
        node.callee.name === "eval") ?
      Build.write(
        $token = Scope.token(scope),
        Lexical.read("eval", scope),
        (
          $tokens = ArrayLite.map(
            node.arguments,
            () => Scope.token(scope)),
          ArrayLite.reduceRight(
            node.arguments,
            (expression, argument, index) => Build.write(
              $tokens[index],
              Visit.expression(argument, scope),
              expression),
            Build.conditional(
              Short.binary(
                "===",
                Build.read($token),
                Build.builtin("eval")),
              Build.eval(
                (
                  node.arguments.length ?
                  Build.read($tokens[0]) :
                  Build.primitive(void 0))),
              Build.apply(
                Build.read($token),
                Build.primitive(void 0),
                ArrayLite.map(
                  $tokens,
                  (token) => Build.read(token))))))) :
      Build.apply(
        Visit.expression(node.callee, scope),
        Build.primitive(void 0),
        ArrayLite.map(
          node.arguments,
          (argument) => Visit.expression(argument, scope)))) :
    Short.apply(
      Visit.expression(node.callee, scope),
      Build.primitive(void 0),
      Short.concat(
        ArrayLite.map(
          node.arguments,
          (argument) => (
            argument.type === "SpreadElement" ?
            Visit.expression(argument.argument, scope) :
            Short.array(
              [
                Visit.expression(argument, scope)])))))));

exports.MemberExpression = (node, scope) => Short.get(
  Visit.expression(node.object, scope),
  (
    node.computed ?
    Visit.expression(node.property, scope) :
    Build.primitive(node.property.name || node.property.value)));

exports.MetaProperty = (node, scope) => Build.read("new.target");

exports.Identifier = (node, scope) => Lexical.read(node.name, scope);

exports.Literal = (node, scope) => (
  node.regex ?
  Short.regexp(node.regex.pattern, node.regex.flags) :
  Build.primitive(node.value));
