
const ArrayLite = require("array-lite");
const Scope = require("./scope.js");

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

// TRANSPARENCY ISSUE
// No closure naming for computed property in object literal:
//
// > let foo = 1;
// > ({[foo]: function(){}})[1]
// [Function: 1]

exports.ObjectExpression = (node, scope) => Build.apply(
  Build.builtin("AranInitialize"),
  Build.primitive(void 0),
  ArrayLite.flatMap(
    node.properties,
    (property) => [
      Build.primitive(property.kind),
      (
        property.computed ?
        Visit.expression(property.key, scope),
        Build.primitive(property.key.name || property.key.value)),
      Visit.expression(property.value, scope)]));

exports.FunctionExpression = (node, scope1) => {
  const identifiers1 = ArrayLite.flatMap(node.patterns, Query.HoistPattern);
  const scope2 = Scope.Closure(
    ArrayLite.concat(
      identifiers1,
      (
        (
          expression.id &&
          !ArrayLite.includes(identifiers1, expression.id.name)) ?
        [expression.id.name] :
        []),
      (
        !ArrayLite.includes(identifiers1, "arguments") ?
        ["arguments"] :
        [])),
    [],
    scope1);
  const statements1 = ArrayLite.concat(
    (
      (
        expression.id &&
        !ArrayLite.includes(identifiers1, expression.id.name)) ?
      Short.Declare(
        expression.id.name,
        Build.read(Tokens.callee),
        scope2) :
      []),
    Build.Write("new.target", Tokens.newtarget, scope2),
    Build.Write("this", Tokens.this, scope2),
    (
      ArrayLite.includes(identifiers1, "arguments") ?
      [] :
      Short.Declare(
        "arguments",
        Build.read(Tokens.arguments),
        scope2)),
    (
      ArrayLite.every(
        node.patterns,
        (pattern) => pattern.type === "Identifier") ?
      ArrayLite.flatMap(
        node.patterns,
        (pattern, index) => Short.Declare(
          pattern.name,
          Short.get(
            Build.read(Tokens.arguments),
            Build.primitive(index)),
          scope2)) :
      Build.Expression(
        Short.assign(
          null,
          {
            type: "ArrayPattern",
            elements: node.patterns},
          Tokens.arguments,
          scope2))));
  const identifiers2 = Query.HoistVariables(node.body.body);
  const scope3 = Scope.Block(identifiers2, [], scope2);
  const statements2 = ArrayLite.flatMap(
    identifiers2,
    (identifier) => Short.Declare(
      identifier,
      Build.primitive(void 0),
      scope3));
  return Short.synchronize(
    node,
    Build.closure(
      Build.BLOCK(
        Scope.qualifiers(scope2),
        ArrayLite.concat(
          statements1,
          Build.BLOCK(
            Scope.qualifiers(scope3),
            ArrayLite.concat(
              statements2,
              Build.Block(
                Short.BLOCK(node.body.body, scope3)))),
          Build.Return(
            Build.primitive(void 0))))));
};

exports.ArrowFunctionExpression = (node, scope1) => {
  const identifiers1 = ArrayLite.flatMap(node.patterns, Query.HoistPattern);
  const scope2 = Scope.Closure(identifiers1, [], scope1);
  const statements1 = (
    ArrayLite.every(
      node.patterns,
      (pattern) => pattern.type === "Identifier") ?
    ArrayLite.flatMap(
      node.patterns,
      (pattern, index) => Short.Declare(
        pattern.name,
        Short.get(
          Build.read(Tokens.arguments),
          Build.primitive(index)),
        scope2)) :
    Build.Expression(
      Short.assign(
        null,
        {
          type: "ArrayPattern",
          elements: node.patterns},
        Tokens.arguments,
        scope2)));
  if (node.expression) {
    const statements2 = Build.Return(
      Visit.expression(node.body, scope2));
    return Short.synchronize(
      node,
      Build.BLOCK(
        Scope.qualifiers(scope2),
        ArrayLite.concat(statements1, statements2)))
  }
  const identifiers2 = Query.HoistVariables(node.body.body);
  const scope3 = Scope.Block(identifiers2, [], scope2);
  const statements2 = ArrayLite.flatMap(
    identifiers2,
    (identifier) => Short.Declare(
      identifier,
      Build.primitive(void 0),
      scope3));
  return Short.synchronize(
    node,
    Build.closure(
      Build.BLOCK(
        Scope.qualifiers(scope2),
        ArrayLite.concat(
          $statements1,
          Build.BLOCK(
            Scope.qualifiers(scope3),
            ArrayLite.concat(
              statements2,
              Build.Block(
                Short.BLOCK(node.body.body, scope3)))),
          Build.Return(
            Build.primitive(void 0))))));
};

exports.SequenceExpression = (node, scope) => ArrrayLite.reduce(
  node.expressions,
  (expression, node) => Build.sequence(
    expression,
    Visit.expression(node, scope)),
  Build.primitive(void 0));

exports.UnaryExpression = (node, scope, $token1, $token2) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Short.typeof(node.argument.name, scope) :
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
            Short.object(Build.read($token1),
            Build.read($token2)))) :
      (
        node.argument.type === "Identifier" ?
        Short.discard(scope, node.argument.name) :
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

// If left-hand side is a pattern, the right hand side is evaluated first:
//   let {[(console.log(2), "a")]:x} = {a:console.log(1)};
//   let [(console.log(3), {})[(console.log(4), "foo")]] = (console.log(1), [(console.log(2), "bar")])
// Else:
// (console.log(1), {})[console.log(2), "foo"] = console.log(3);

exports.AssignmentExpression = (scope, node, $token1, $token2, $token3) => (
  node.left.type === "MemberExpression" ?
  Build.write(
    $token1 = Scope.token(scope),
    Visit.expression(node.object, scope),
    Build.write(
      $token2 = Scope.token(scope),
      Visit.expression(
        (
          node.left.computed ?
          Visit.expression(node.left.property, scope) :
          Build.primitive(node.left.property.name || node.left.property.value)),
        scope),
      Build.write(
        $token3 = Scope.token(scope),
        (
          node.operator === "=" ?
          Visit.expression(node.right, scope) :
          Short.binary(
            Reflect_apply(String_prototype_substring, node.operator, [0, node.operator.length-1]),
            Short.get(
              Short.object(
                Build.read($token1)),
              Build.read($token2)),
            Visit.expression(node.right, scope))),
        Build.sequence(
          Short.set(
            node.AranStrict,
            (
              node.AranStrict ?
              Build.read($token1),
              Short.object(
                Build.read($token1))),
            Build.read($token2),
            Build.read($token3)),
          Build.read($token3))))) :
  Build.write(
    $token1 = Scope.token(scope),
    (
      node.operator === "=" ?
      Visit.expression(node.right, scope),
      Short.binary(
        Reflect_apply(String_prototype_substring, node.operator, [0, node.operator.length-1]),
        Short.read(
          node.left.name,
          scope),
        Visit.expression(node.right, scope))),
    Build.sequence(
      Short.assign(node.AranStrict, node.left, $token1, scope),
      Build.read($token1))));

exports.UpdateExpression = (scope, node, $token1, $token2, $token3, $token4, $token5) => (
  node.argument.type === "MemberExpression" ?
  Build.write(
    $token1 = Scope.token(scope),
    Visit.expression(node.object, scope),
    Build.write(
      $token2 = Scope.token(scope),
      Visit.expression(
        (
          node.left.computed ?
          Visit.expression(node.left.property, scope) :
          Build.primitive(node.left.property.name || node.left.property.value)),
        scope),
      Build.write(
        $token3 = Scope.token(scope),
        Short.get(
          Short.object($token1),
          Build.read($token2)),
        Build.write(
          $token4 = Scope.token(scope),
          Short.binary(
            node.operator[0],
            Build.read($token3),
            Build.primitive(1)),
          Short.set(
            node.AranStrict,
            (
              node.AranStrict ?
              Build.read($token1),
              Short.object($token1),
            Build.read($token2),
            Build.read($token4),
            Build.read(
              (
                node.prefix ?
                $token4,
                $token3)))))))) :
  Build.write(
    $token1 = Scope.token(scope),
    Short.read(node.left.name, scope),
    Build.write(
      $token2 = Scope.token(scope),
      Short.binary(
        node.operator[0],
        Build.read($token1),
        Build.primitive(1)),
      Build.sequence(
        Short.write(node.AranStrict, node.left.name, $token2, scope),
        Build.read(
          node.prefix ?
          $token2,
          $token1)))));

exports.LogicalExpression = (node, scope, $token) => Build.write(
  $token = Scope.token(scope),
  Visit.expression(node.left, scope),
  Build.conditional(
    Build.read($token),
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
  ArrayLite.some(
    node.arguments,
    (argument) => argument.type === "SpreadElement") ?
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.expression(node.callee, scope),
      Short.concat(
        ArrrayLite.map(
          node.arguments,
          (argument) => (
            argument.type === "SpreadElement" ?
            Visit.expression(argument.argument, scope) :
            Short.array(
              [
                Visit.expression(argument, scope)]))))]) :
  Build.construct(
    Visit.expression(node.callee, scope),
    ArrayLite.map(
      node.arguments,
      (argument) => Visit.expression(argument, scope))));

      Build.apply(
        Build.builtin("Array.prototype.concat"),
        Short.array([]),
        ArrayLite.map(
          node.arguments,
          (argument) => (
            argument.type = 

// eval(x, ...xs) is not direct

exports.CallExpression = (scope, node, $token1, $token2, $tokens = []) => (
  node.callee.type === "MemberExpression" ?
  Build.write(
    $token1 = Scope.token(scope),
    Visit.expression(node.callee.object, scope),
    Build.write(
      $token2 = Scope.token(scope),
      (
        node.callee.computed ?
        Visit.expression(node.callee.property, scope),
        Build.primitive(node.callee.property.name || node.callee.property.value)),
      (
        ArrayLite.every(
          node.arguments,
          (argument) => argument.type !== "SpreadElement") ?
        Build.apply(
          Short.get(
            Short.object(
              Build.read($token1)),
            Build.read($token2)),
          Build.read($token1),
          ArrayLite.map(
            node.arguments,
            (argument) => Visit.expression(argument, scope))) :
        Build.apply(
          Build.builtin("Reflect.apply"),
          Build.primitive(void 0),
          [
            Short.get(
              Short.object(
                Build.read($token1)),
              Build.read($token2)),
            Build.read($token1),
            Short.concat(
              ArrayLite.map(
                node.arguments,
                (argument) => (
                  argument.type === "SpreadElement" ?
                  Visit.expression(argument.argument, scope) :
                  Short.array(
                    Visit.expression(argument, scope)))))])))) :
  (
    ArrayLite.every(
      node.argument,
      (argument) => argument.type !== "SpreadElement") ?
    (
      (
        node.callee.type === "Identifier" &&
        node.callee.name === "eval") ?
      Build.write(
        $token1 = Scope.token(scope),
        Short.read("eval", scope),
        ArrayLite.reduceRight(
          ArrayLite.reverse(node.arguments),
          (expression, argument, index) => Build.write(
            $tokens[index] = Scope.token(scope),
            Visit.expression(argument, scope),
            expression),
          Build.conditional(
            Short.binary(
              "===",
              Build.read("$token1"),
              Build.builtin("eval")),
            Build.eval(
              (
                node.arguments.length ?
                Build.read(
                  tokens[0]) :
                Build.primitive(void 0))) :
            Build.apply(
              Build.read($token1),
              Build.primitive(void 0),
              ArrayLite.map(
                tokens,
                Build.read))))) :
      Build.apply(
        Visit.expression(node.callee, scope),
        Build.primitive(void 0),
        ArrayLite.map(
          node.arguments,
          (argument) => Visit.expression(argument, scope)))) :
    Build.apply(
      Build.builtin("Reflect.apply"),
      Build.primitive(void 0),
      [
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
                  Visit.expression(argument, scope)]))))])));

exports.MemberExpression = (node, scope) => Short.get(
  Visit.expression(node.object, scope),
  (
    node.computed ?
    Visit.expression(scope, node.property) :
    Build.primitive(node.property.name || node.property.value)));

exports.MetaProperty = (node, scope) => Build.read("new.target");

exports.Identifier = (node, scope) => Short.read(node.name, scope);

exports.Literal = (node, scope) => (
  node.regex ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));
