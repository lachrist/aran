
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope.js");
const Short = require("../short.js");
const Lexical = require("../lexical");
const Visit = require("./index.js");

exports.EmptyStatement = (node, scope) => [];

exports.BlockStatement = (node, scope) => Build.Block(
  node.AranLabel,
  Lexical.BLOCK(
    node.AranStrict,
    [],
    node.body,
    scope));

exports.ExpressionStatement = (node, scope) => (
  node.AranCompletion ?
  Build.Write(
    0,
    Visit.expression(node.expression, scope)) :
  Build.Expression(
    Visit.expression(node.expression, scope)));

exports.IfStatement = (node, scope) => Build.If(
  node.AranLabel,
  Visit.expression(node.test, scope),
  Lexical.BLOCK(
    node.AranStrict,
    [],
    (
      node.consequent.type === "BlockStatement" ?
      node.consequent.body :
      [node.consequent]),
    scope),
  Lexical.BLOCK(
    node.AranStrict,
    [],
    (
      node.alternate ?
      (
        node.alternate.type === "BlockStatement" ?
        node.alternate.body :
        [node.alternate]) :
      []),
    scope));

exports.BreakStatement = (node, scope) => (
  node.label && node.AranLabel === node.label.name ?
  [] :
  Build.Break(
    node.label ? node.label.name : null));

exports.ContinueStatement = (node, scope) => Build.Continue(
  node.label ? node.label.name : null);

exports.WithStatement = (node, scope, $token) => ArrayLite.concat(
  Build.Write(
    $token = Scope.token(scope),
    Visit.expression(node.object, scope)),
  Build.Block(
    node.AranLabel,
    Lexical.BLOCK(
      node.AranStrict,
      [],
      (
        node.body.type === "BlockStatement" ?
        node.body.body :
        [node.body]),
      Scope.With($token, scope))));

exports.ReturnStatement = (node, scope) => Build.Return(
  (
    Scope.local("new.target", scope) ?
    (
      node.argument ?
      Build.write(
        $token = Scope.token(scope),
        Visit.expression(node.argument, scope),
        Build.conditional(
          Lexical.read("new.target", scope),
          Build.conditional(
            Short.binary(
              "===",
              Short.unary(
                "typeof",
                Build.read($token)),
              Build.primitive("object")),
            Build.conditional(
              Build.read($token),
              Build.read($token),
              Lexical.read("this", scope)),
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Build.read($token)),
                Build.primitive("function")),
              Build.read($token),
              Lexical.read("this", scope))),
          Build.read($token))) :
      Build.conditional(
        Lexical.read("new.target", scope),
        Lexical.read("this", scope),
        Build.primitive(void 0))) :
    (
      node.argument ?
      Visit.expression(node.argument, scope) :
      Build.primitive(void 0))));

exports.ThrowStatement = (node, scope) => Build.Throw(
  Visit.expression(node.argument, scope));

exports.TryStatement = (node, scope) => Build.Try(
  node.AranLabel,
  Lexical.BLOCK(
    node.AranStrict,
    [],
    node.block.body,
    scope),
  Lexical.BLOCK(
    node.AranStrict,
    node.AranParameterNames,
    [
      (scope) => ArrayLite.concat(
        Build.Statement(
          Lexical.assign(
            null,
            node.handler.param.name,
            Build.input("error"),
            Build.primitive(void 0),
            scope)),
        Build.Block(
          null,
          Lexical.BLOCK(
            node.AranStrict,
            [],
            node.body.body,
            scope)))],
    scope),
  Lexical.BLOCK(
    node.AranStrict,
    [],
    (
      node.finalizer ?
      node.finalizer.body :
      []),
    scope));

exports.DebuggerStatement = (node, scope) => Build.Debugger();

exports.VariableDeclaration = (node, scope) => ArrayLite.flatMap(
  node.declarations,
  (declaration, $token) => (
    declaration.id.type === "Identifier" && node.kind !== "var" ?
    Lexical.Declare(
      declaration.id.name,
      (
        declaration.init ?
        Visit.expression(declaration.init, scope) :
        Build.primitive(void 0)),
      scope) :
    Build.Expression(
      Build.write(
        $token = Scope.token(scope),
        (
          declaration.init ?
          Visit.expression(declaration.init, scope) :
          Build.primitive(void 0)),      
        Lexical.assign(
          node.kind === "var" ? node.AranStrict : null,
          declaration.id,
          $token,
          scope)))));

exports.WhileStatement = (node, scope) => Build.While(
  node.AranLabel,
  Visit.expression(node.test, scope),
  Lexical.BLOCK(
    node.AranStrict,
    [],
    (
      node.body.type === "BlockStatement" ?
      node.body.body :
      [node.body]),
    scope));

exports.DoWhileStatement = (node, scope) => ArrayLite.concat(
  Build.Write(
    $token = Scope.token(scope),
    Build.primitive(true)),
  Build.While(
    node.AranLabel,
    Build.conditional(
      Build.read($token),
      Build.write(
        $token,
        Build.primitive(false),
        Build.primitive(true)),
      Visit.expression(node.test, scope)),
    Lexical.BLOCK(
      node.AranStrict,
      [],
      (
        node.body.type === "BlockStatement" ?
        node.body.body :
        [node.body]),
      scope)));

exports.ForStatement = (node, scope, $closure1, $closure2) => (
  $closure1 = (scope) => Lexical.BLOCK(
    node.AranStrict,
    [],
    (
      node.body.type === "BlockStatement" ?
      node.body.body :
      [node.body]),
    scope),
  $closure2 = (scope) => Build.While(
    node.AranLabel,
    (
      node.test ?
      Visit.expression(node.test, scope) :
      Build.primitive(true)),
    (
      node.update ?
      Lexical.BLOCK(
        node.AranStrict,
        [],
        [],
        (scope) => ArrayLite.concat(
          Build.Block(
            null,
            $closure1(scope)),
          Build.Expression(
            Visit.expression(node.update, scope))),
        [],
        scope) :
      $closure1(scope))),
  (
    node.init ?
    (
      (
        node.init.type === "VariableDeclaration" &&
        node.init.kind !== "var") ?
      Build.Block(
        null,
        Lexical.BLOCK(
          node.AranStrict,
          (
            node.init.kind === "let" ?
            node.init.AranNames :
            []),
          (
            node.init.kind === "const" ?
            node.init.AranNames :
            []),
          (scope) => ArrayLite.concat(
            Visit.Statement(node.init, scope),
            $closure2(scope)),
          [],
          scope)) :
      ArrayLite.concat(
        Build.Expression(
          Visit.expression(node.init, scope)),
        $closure2(scope))) :
    $closure2(scope)));

exports.ForInStatement = (node, scope, $closure, $token1, $token2, $token3) => Build.Block(
  node.AranStrict,
  (
    (
      node.left.type === "VariableDeclaration" &&
      node.left.kind !== "var") ?
    node.AranNames :
    []),
  [
    (scope) => ArrayLite.concat(
        Build.Write(
          $token1 = Scope.token(scope),
          Build.apply(
            Build.builtin("AranEnumerate"),
            Build.primitive(void 0),
            [
              Visit.expression(node.right), scope)]),
        Build.Write(
          $token2 = Scope.token(scope),
          Build.primitive(0)),
        Build.Write(
          $token3 = Scope.token(scope),
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.read($token1),
              Build.primitive("length")])),
        Build.While(
          node.AranLabel,
          Short.binary(
            "<",
            Build.read($token2),
            Build.read($token3)),
          Lexical.BLOCK(
            node.AranStrict,
            [],
            ArrayLite.
            (
              node.left.kind === "let" ?
              node.left.AranNames :
              []),
            (
              node.left.kind === "const" ?
              node.left.AranNames :
              []),
            (scope, $token4) => ArrayLite.concat(
              (
                node.left.declarations[0].id.type === "Identifier" ?
                Lexical.Declare(
                  node.left.declarations[0].id.name,
                  Short.get(
                    Build.read($token1),
                    Build.read($token2)),
                  scope) :
                ArrayLite.concat(
                  Build.Write(
                    $token4 = Scope.token(scope),
                    Short.get(
                      Build.read($token1),
                      Build.read($token2))),
                  Build.Expression(
                    Lexical.assign(
                      null,
                      node.left.declarations[0].id,
                      $token4,
                      scope)))),
              Build.Block(
                null,
                Lexical.BLOCK(
                  node.AranStrict,
                  [],
                  [],
                  (scope) => [],
                  (
                    node.body.type === "BlockStatement" ?
                    node.body.body :
                    [node.body]),
                  scope)),
              Build.Write(
                $token2,
                Short.binary(
                  "+",
                  Build.read($token2),
                  Build.primitive(1)))),
            [],
            scope))),
      [],
      scope)) :
  ArrayLite.concat(
    Build.Write(
      $token1 = Scope.token(scope),
      Short.keys(
        Visit.expression(node.right, scope))),
    Build.Write(
      $token2 = Scope.token(scope),
      Build.primitive(-1)),
    Build.Write(
      $token3 = Scope.token(scope),
      Short.get(
        Build.read($token1),
        Build.primitive("length"))),
    Build.While(
      node.AranLabel,
      Short.binary(
        "<",
        Build.write(
          $token2,
          Short.binary(
            "+",
            Build.read($token2),
            Build.primitive(1)),
          Build.read($token2)),
        Build.read($token3)),
      Lexical.BLOCK(
        node.AranStrict,
        [],
        [],
        (scope) => (
          node.left.type === "MemberExpression" ?
          Build.Expression(
            Short.set(
              node.AranStrict,
              Visit.expression(node.left.object, scope),
              (
                node.left.computed ?
                Visit.expression(node.left.property, scope) :
                Build.primitive(node.left.property.name || node.left.property.value)),
              Short.get(
                Build.read($token1),
                Build.read($token2)))) :
          ArrayLite.concat(
            Build.Write(
              $token4 = Scope.token(scope),
              Short.get(
                Build.read($token1),
                Build.read($token2))),      
            Build.Expression(
              Lexical.assign(
                node.AranStrict,
                (
                  node.left.type === "VariableDeclaration" ?
                  node.left.declarations[0].id :
                  node.left),
                $token4,
                scope)))),
        (
          node.body.type === "BlockStatement" ?
          node.body.body :
          [node.body]),
        scope))));

exports.ForOfStatement = (node, scope, $token1, $token2, $token3) => (
  (
    node.left.type === "VariableDeclaration" &&
    node.left.kind !== "var") ?
  Build.Block(
    null,
    Lexical.BLOCK(
      node.AranStrict,
      (
        node.left.kind === "let" ?
        node.left.AranNames :
        []),
      (
        node.left.kind === "const" ?
        node.left.AranNames :
        []),
      (scope) => ArrayLite.concat(
        Build.Write(
          $token1 = Scope.token(scope),
          Visit.expression(node.right)),
        Build.Write(
          $token2 = Scope.token(scope),
          Build.apply(
            Short.get(
              Build.read($token1),
              Build.builtin("Symbol.iterator")),
            Build.read($token1),
            [])),
        Build.While(
          node.AranLabel,
          Short.unary(
            "!",
            Short.get(
              Build.write(
                $token3 = Scope.token(scope),
                Build.apply(
                  Short.get(
                    Build.read($token2),
                    Build.primitive("next")),
                  Build.read($token2),
                  []),
                Build.read($token3)),
              Build.primitive("done"))),
          Lexical.BLOCK(
            node.AranStrict,
            (
              node.left.kind === "let" ?
              node.left.AranNames :
              []),
            (
              node.left.kind === "const" ?
              node.left.AranNames :
              []),
            (scope, $token4) => ArrayLite.concat(
              (
                node.left.declarations[0].id.type === "Identifier" ?
                Lexical.Declare(
                  node.left.declarations[0].id.name,
                  Short.get(
                    Build.read($token3),
                    Build.primitive("value")),
                  scope) :
                ArrayLite.concat(
                  Build.Write(
                    $token4 = Scope.token(scope),
                    Short.get(
                      Build.read($token3),
                      Build.primitive("value"))),
                  Build.Expression(
                    Lexical.assign(
                      null,
                      node.left.declarations[0].id,
                      $token4,
                      scope)))),
              Build.Block(
                null,
                Lexical.BLOCK(
                  node.AranStrict,
                  [],
                  [],
                  (scope) => [],
                  (
                    node.body.type === "BlockStatement" ?
                    node.body.body :
                    [node.body]),
                  scope))),
            [],
            scope))),
      [],
      scope)) :
  ArrayLite.concat(
    Build.Write(
      $token1 = Scope.token(scope),
      Visit.expression(node.right)),
    Build.Write(
      $token2 = Scope.token(scope),
      Build.apply(
        Short.get(
          Build.read($token1),
          Build.builtin("Symbol.iterator")),
        Build.read($token1),
        [])),
    Build.While(
      node.AranLabel,
      Short.unary(
        "!",
        Short.get(
          Build.write(
            $token3 = Scope.token(scope),
            Build.apply(
              Short.get(
                Build.read($token2),
                Build.primitive("next")),
              Build.read($token2),
              []),
            Build.read($token3)),
          Build.primitive("done"))),
      Lexical.BLOCK(
        node.AranStrict,
        [],
        [],
        (scope, $token4) => (
          node.left.type === "MemberExpression" ?
          Build.Expression(
            Short.set(
              node.AranStrict,
              Visit.expression(node.left.object, scope),
              (
                node.left.computed ?
                Visit.expression(node.left.property, scope) :
                Build.primitive(node.left.property.name || node.left.property.value)),
              Short.get(
                Build.read($token3),
                Build.primitive("value")))) :
          ArrayLite.concat(
            Build.Write(
              $token4 = Scope.token(scope),
              Short.get(
                Build.read($token3),
                Build.primitive("value"))),
            Build.Expression(
              Lexical.assign(
                node.AranStrict,
                (
                  node.left.type === "VariableDeclaration" ?
                  node.left.declarations[0].id :
                  node.left),
                $token4,
                scope)))),
        (
          node.body.type === "BlockStatement" ?
          node.body.body :
          [node.body]),
        scope))));

exports.SwitchStatement = (node1, scope, $token, $statements1, $scope, $pairs, $statements2) => (
  $statements1 = Build.Write(
    $token = Scope.token(scope),
    Visit.expression(node1.discriminant, scope)),
  $scope = Scope.Block(
    ArrayLite.flatMap(
      ArrayLite.flatMap(
        node1.cases,
        (node2) => node2.consequent),
      (node2) => (
        (
          node2.type === "VariableDeclaration" &&
          node2.kind === "let") ?
        node2.AranNames :
        [])),
    ArrayLite.flatMap(
      ArrayLite.flatMap(
        node1.cases,
        (node2) => node2.consequent),
      (node2) => (
        (
          node2.type === "VariableDeclaration" &&
          node2.kind === "const") ?
        node2.AranNames :
        [])),
    scope),
  $statements2 = ArrayLite.flatMap(
    ArrayLite.flatMap(
      node1.cases,
      (node2) => node2.consequent),
    (node2, $token) => (
      node2.type === "FunctionDeclaration" ?
      ArrayLite.concat(
        Build.Write(
          $token = Scope.token($scope),
          Visit.expression(node2, $scope)),
        Build.Expression(
          Lexical.write(
            node1.AranStrict,
            node2.id.name,
            $token,
            scope))) :
      [])),
  $pairs = ArrayLite.map(
    node1.cases,
    (node2) => [
      (
        node2.test ?
        Short.binary(
          "===",
          Build.read($token),
          Visit.expression(node2.test, $scope)) :
        null),
      ArrayLite.flatMap(
        node2.consequent,
        (node3) => (
          node3.type === "FunctionDeclaration" ?
          [] :
          Visit.Statement(node3, $scope)))]),
  ArrayLite.concat(
    $statements1,
    Build.Switch(
      node1.AranLabel,
      Scope.identifiers($scope),
      ArrayLite.flatMap(
        Scope.stickers($scope),
        (token) => Build.Write(
          token,
          Build.primitive(false))),
      $pairs)));
