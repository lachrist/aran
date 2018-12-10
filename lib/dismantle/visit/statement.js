
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope.js");
const Lexical = require("../lexical");
const Visit = require("./index.js");

exports.EmptyStatement = (node, scope) => [];

exports.BlockStatement = (node, scope) => Build.Block(
  Query.LabelName(node),
  Visit.BODY(node, scope));

exports.ExpressionStatement = (node, scope) => Build.Expression(
  (
    node.AranCompletion ?
    Build.write(
      0,
      Visit.expression(node.expression, scope),
      Build.primitive(void 0)) :
    Visit.expression(node.expression, scope)));

exports.IfStatement = (node, scope) => Build.If(
  Query.LabelName(node),
  Visit.expression(node.test, scope),
  Visit.BODY(node.consequent, scope),
  Visit.BODY(node.alternate, scope)) :

exports.BreakStatement = (node, scope) => (
  (
    node.label &&
    Query.LabelName(node) === node.label.name) ?
  [] :
  Build.Break(
    node.label ? node.label.name : null));

exports.ContinueStatement = (node, scope) => Build.Continue(
  node.label ? node.label.name : null);

exports.WithStatement = (node, scope) => Lexical.Token(
  Visit.expression(node.object, scope),
  (token) => Lexical.Token(
    Build.conditional(
      Build.binary(
        "===",
        Build.unary(
          "typeof",
          Build.read(token)),
        Build.primitive("object")),
      Build.conditional(
        Build.read(token),
        Build.read(token),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot convert 'null' to object")])),
      Build.conditional(
        Build.binary(
          "===",
          Build.read(token),
          Build.primitive(void 0)),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot convert 'undefined' to object")]))),
    (token) => Build.Block(
      Query.LabelName(node),
      Visit.WITH(token, node.body, scope)),
    scope),
  scope);

exports.ReturnStatement = (node, scope) => Build.Return(
  (
    Query.IsArrowReturn(node) ?
    (
      node.argument ?
      Visit.expression(node.argument, scope) :
      Build.primitive(void 0)) :
    (
      node.argument ?
      Lexical.token(
        Visit.expression(node.argument, scope),
        (token) => Build.conditional(
          Lexical.read("new.target", scope),
          Build.conditional(
            Short.binary(
              "===",
              Short.unary(
                "typeof",
                Build.read(token)),
              Build.primitive("object")),
            Build.conditional(
              Build.read(token),
              Build.read(token),
              Lexical.read("this", scope)),
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Build.read(token)),
                Build.primitive("function")),
              Build.read(token),
              Lexical.read("this", scope))),
          Build.read(token))) :
      Build.conditional(
        Lexical.read("new.target", scope),
        Lexical.read("this", scope),
        Build.primitive(void 0)))));

exports.ThrowStatement = (node, scope) => Build.Throw(
  Visit.expression(node.argument, scope));

exports.TryStatement = (node, scope) => Build.Try(
  Query.LabelName(node),
  Visit.BODY(node.block, scope),
  (
    node.handler ?
    Lexical.EXTEND(
      Query.PatternNames(node.handler.param),
      [],
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
          Visit.BODY(node.handler.body, scope))),
      scope) :
    Visit.BODY(null, scope)),
  Visit.BODY(node.finalizer, scope));

exports.DebuggerStatement = (node, scope) => Build.Debugger();

exports.VariableDeclaration = (node, scope) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Build.Expression(
    Lexical.assign(
      node.kind === "var" ? node.AranStrict : null,
      declaration.id,
      (
        declaration.init ?
        Visit.expression(declaration.init, scope) :
        Build.primitive(void 0)),
      Build.primitive(void 0))));

exports.WhileStatement = (node, scope) => Build.While(
  Query.LabelName(node),
  Visit.expression(node.test, scope),
  Visit.BODY(node.body, scope));

exports.DoWhileStatement = (node, scope) => Lexical.Token(
  Build.primitive(true),
  (token) => Build.While(
    Query.LabelName(node),
    Build.conditional(
      Build.read(token),
      Build.write(
        token,
        Build.primitive(false),
        Build.primitive(true)),
      Visit.expression(node.test, scope)),
    Visit.BODY(node.body, scope)));

exports.ForStatement = (node, scope, $closure1, $closure2) => Lexical.Token(
  Build.primitive(false),
  (token) => Build.Block(
    null,
    Lexical.EXTEND(
      (
        node.init.type === "VariableDeclaration" ?
        Query.DeclarationNames("let", node.init) :
        []),
      (
        node.init.type === "VariableDeclaration" ?
        Query.DeclarationNames("const", node.init) :
        []),
      (scope) => ArrayLite.concat(
        (
          node.init ?
          (
            node.init.type === "VariableDeclaration" ?
            Visit.Statement(node.init, scope) :
            Build.Expression(
              Visit.expression(node.init, scope))) :
          []),
        Build.While(
          Query.LabelName(node),
          Build.sequence(
            Build.conditional(
              Build.read(token),
              (
                node.update ?
                Visit.expression(node.update, scope) :
                Build.primitive(void 0)),
              Build.write(
                token,
                Build.primitive(true),
                Build.primitive(void 0))),
            (
              node.test ?
              Visit.expression(node.test) :
              Build.primitive(true))),
          Visit.BODY(node.body, scope))),
      scope)),
  scope);

exports.ForInStatement = (node, scope) => Build.Block(
  null,
  Lexical.EXTEND(
    (
      node.left.type === "VariableDeclaration" ?
      Query.DeclarationNames("let", node.left) :
      []),
    (
      node.left.type === "VariableDeclaration" ?
      Query.DeclarationNames("const", node.left) :
      []),
    (scope) => Lexical.Token(
      Build.apply(
        Build.builtin("AranEnumerate"),
        Build.primitive(void 0),
        [
          Visit.expression(node.right, scope)]),
      (token1) => Lexical.Token(
        Build.primitive(0),
        (token2) => Lexical.Token(
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.read(token1),
              Build.primitive("length")]),
          (token3) => Build.While(
            Query.LabelName(node),
            Build.binary(
              "<",
              Build.read(token2),
              Build.read(token3)),
            Lexical.EXTEND(
              (
                node.init.type === "VariableDeclaration" ?
                Query.DeclarationNames("let", node.left) :
                []),
              (
                node.init.type === "VariableDeclaration" ?
                Query.DeclarationNames("const", node.left) :
                []),
              (scope) => ArrayLite.concat(
                (
                  node.left.type === "MemberExpression" ?
                  Build.Expression(
                    Build.conditional(
                      Lexical.token(
                        Visit.expression(node.left.object),
                        (token4) => Build.apply(
                          Build.builtin("Reflect.set"),
                          Build.primitive(void 0),
                          [
                            Build.conditional(
                              Build.binary(
                                "===",
                                Build.unary(
                                  "typeof",
                                  Build.read(token4),
                                Build.primitive("object")),
                              Build.read(token4),
                              Build.conditional(
                                Build.binary(
                                  "===",
                                  Build.read(token4),
                                  Build.primitive(void 0)),
                                Build.read(token4),
                                Build.apply(
                                  Build.builtin("Object"),
                                  Build.primitive(void 0),
                                  [
                                    Build.read(token4)])))),
                            (
                              node.left.property.computed ?
                              Visit.expression(node.left.property, scope) :
                              Build.primitive(node.left.property.name || node.left.property.value)),
                            Build.apply(
                              Build.builtin("Reflect.get"),
                              Build.primitive(void 0),
                              [
                                Build.read(token1),
                                Build.read(token2)])]),
                        scope),
                      Build.primitive(void 0),
                      (
                        node.AranStrict ?
                        Build.apply(
                          Build.builtin("AranThrowTypeError"),
                          Build.primitive(void 0),
                          [
                            Build.primitive("Cannot assign object property")])))) :
                  Build.Expression(
                    Lexical.assign(
                      (
                        (
                          node.left.type === "VariableDeclaration" &&
                          node.left.kind !== "var") ?
                        null :
                        node.AranStrict),
                      (
                        node.left.type === "VariableDeclaration" ?
                        node.left.declarations[0].id :
                        node.left),
                      Build.apply(
                        Build.builtin("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Build.read(token1),
                          Build.read(token2)]),
                      Build.primitive(void 0),
                      scope))),
                Build.Block(
                  null,
                  Visit.BODY(node.body, scope)),
                Build.Expression(
                  Build.write(
                    token2,
                    Build.binary(
                      "+",
                      Build.read(token2),
                      Build.primitive(1)),
                    Build.primitive(void 0)))),
              scope)),
          scope),
        scope),
      scope),
    scope));

exports.ForOfStatement = (node, scope) => Build.Block(
  null,
  Build.EXTEND(
    (
      node.left.type === "VariableDeclaration" ?
      Query.DeclarationNames("let", node.left) :
      []),
    (
      node.left.type === "VariableDeclaration" ?
      Query.DeclarationNames("const", node.left) :
      []),
    (scope) => Lexical.Token(
      Visit.expression(node.right, scope),
      (token1) => Lexical.Token(
        Build.apply(
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.conditional(
                Build.binary(
                  "===",
                  Build.unary(
                    "typeof",
                    Build.read(token1)),
                  Build.primitive("object")),
                Build.read(token1),
                Build.conditional(
                  Build.binary(
                    "===",
                    Build.read(token1),
                    Build.primitive(void 0)),
                  Build.read(token1),
                  Build.apply(
                    Build.builtin("Object"),
                    Build.primitive(void 0),
                    [
                      Build.read(token1)]))),
              Build.builtin("Symbol.iterator")]),
          Build.read(token1),
          []),
        (token2) => Build.While(
          Query.LabelName(node),
          Build.write(
            token1,
            Build.apply(
              Build.apply(
                Build.apply("Reflect.get"),
                Build.primitive(void 0),
                [
                  Build.read(token2),
                  Build.primitive("next")]),
              Build.read(token2),
              []),
            Build.unary(
              "!",
              Build.apply(
                Build.builtin("Reflect.get"),
                Build.primitive(void 0),
                [
                  Build.read(token1),
                  Build.primitive("done")]))),
          Lexical.EXTEND(
            (
              node.left.type === "VariableDeclaration" ?
              Query.DeclarationNames("let", node.left) :
              []),
            (
              node.left.type === "VariableDeclaration" ?
              Query.DeclarationNames("const", node.left) :
              []),
            (scope) => ArrayLite.concat(
              (
                node.left.type === "MemberExpression" ?
                Build.Expression(
                  Build.conditional(
                    Lexical.token(
                      Visit.expression(node.left.object),
                      (token3) => Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Build.conditional(
                            Build.binary(
                              "===",
                              Build.unary(
                                "typeof",
                                Build.read(token3)),
                              Build.primitive("object")),
                            Build.read(token3),
                            Build.conditional(
                              Build.binary(
                                "===",
                                Build.read(token3),
                                Build.primitive(void 0)),
                              Build.read(token3),
                              Build.apply(
                                Build.builtin("Object"),
                                Build.primitive(void 0),
                                [
                                  Build.read(token3)]))),
                          (
                            node.left.computed ?
                            Visit.expression(node.left.property, scope) :
                            Build.primitive(node.left.property.name || node.left.property.value)),
                          Build.apply(
                            Build.builtin("Reflect.get"),
                            Build.primitive(void 0),
                            [
                              Build.read(token1),
                              Build.primitive("value")])]),
                      scope),
                    Build.primitive(void 0),
                    (
                      node.AranStrict ?
                      Build.apply(
                        Build.builtin("TypeError"),
                        Build.primitive(void 0),
                        [
                          Build.primitive("Cannot assign object property")]) :
                      Build.primitive(void 0)))) :
                Build.Expression(
                  Lexical.assign(
                    (
                      (
                        node.left.type === "VariableDeclaration" &&
                        node.left.kind !== "var") ?
                      null :
                      node.AranStrict),
                    (
                      node.left.type === "VariableDeclaration" ?
                      node.left.declarations[0].id :
                      node.left),
                    Build.apply(
                      Build.builtin("Reflect.get"),
                      Build.primitive(void 0),
                      [
                        Build.read(token1),
                        Build.primitive("value")]),
                    scope))),
              Build.Block(
                null,
                Visit.BODY(node.body, scope))),
            scope)),
        scope),
      scope),
    scope));

exports.FunctionDeclaration = (node, scope) => Build.Expression(
  Lexical.write(
    node.AranStrict,
    node.id.name,
    Visit.expression(node, scope),
    Build.primitive(void 0),
    scope);

exports.SwitchStatement = (node, scope) => Lexical.Token(
  Visit.expression(node.discriminant, scope),
  (token) => Build.Switch(
    Query.LabelName(node),
    Visit.SWITCH(token, node.cases, scope)),
  scope);
