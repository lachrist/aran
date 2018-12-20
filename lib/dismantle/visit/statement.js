
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

exports.EmptyStatement = (node, scope, labels) => [];

exports.ExpressionStatement = (node, scope, labels) => Build.Expression(
  (
    Scope.GetCompletion(scope) ?
    Scope.write(
      scope,
      Scope.GetCompletion(scope),
      Visit.node(node.expression, scope, ""),
      Build.primitive(void 0)) :
    Visit.node(node.expression, scope, "")));

exports.LabeledStatement = (node, scope, labels) => Visit.Node(
    node.body,
    scope,
    ArrayLite.concat(labels, [node.label.name]));

exports.SwitchCase = (node, scope, labels) => (
  node.test ?
  Build.Case(
    Build.binary(
      "===",
      Scope.read(scope, Scope.GetSwitch(scope)),
      Visit.expression(node.test, scope, null))) :
  Build.Default());

exports.SwitchStatement = (node, scope, labels) => Scope.Token(
  Visit.node(node.discriminant, scope, ""),
  (token) => Build.Switch(
    labels,
    Visit.NODE(
      node.cases,
      Scope.ExtendSwitch(scope, token),
      false)));

exports.WithStatement = (node, scope, labels) => Scope.Token(
  scope,
  Visit.node(node.object, scope, ""),
  (token) => Scope.Token(
    scope,
    Build.conditional(
      Build.binary(
        "===",
        Build.unary(
          "typeof",
          Scope.read(scope, token)),
        Build.primitive("object")),
      Build.conditional(
        Scope.read(scope, token),
        Scope.read(scope, token),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot convert 'null' to object")])),
      Build.conditional(
        Build.binary(
          "===",
          Scope.read(scope, token),
          Build.primitive(void 0)),
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot convert 'undefined' to object")]))),
  (token) => Visit.Node(
    node.body,
    Scope.ExtendWith(node, scope),
    labels));

exports.IfStatement = (node, scope, labels) => Build.If(
  labels,
  Visit.node(node.test, scope, ""),
  Visit.NODE(node.consequent, scope, false),
  (
    node.alternate ?
    Visit.NODE(node.alternate, scope, false) :
    Scope.BLOCK(scope, [], [], (scope) => [])));

exports.BreakStatement = (node, scope, labels) => (
  ArrayLite.includes(labels, node.label.name) ?
  [] :
  Build.Break(node.label ? node.label.name : null));

exports.ContinueStatement = (node, scope, labels) => Build.Continue(node.label ? node.label.name : null);

exports.ReturnStatement = (node, scope, labels) => Build.Return(
  (
    Scope.IsArrowContext(node) ?
    (
      node.argument ?
      Visit.node(node.argument, scope, "") :
      Build.primitive(void 0)) :
    (
      node.argument ?
      Scope.token(
        scope,
        Visit.node(node.argument, scope, ""),
        (token) => Build.conditional(
          Scope.read(scope, "new.target"),
          Build.conditional(
            Short.binary(
              "===",
              Short.unary(
                "typeof",
                Scope.read(scope, token)),
              Build.primitive("object")),
            Build.conditional(
              Scope.read(scope, token),
              Scope.read(scope, token),
              Scope.read(scope, "this")),
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Scope.read(scope, token)),
                Build.primitive("function")),
              Scope.read(scope, token),
              Scope.read(scope, "this"))),
          Scope.read(scope, token))) :
      Build.conditional(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Build.primitive(void 0)))));

exports.ThrowStatement = (node, scope, labels) => Build.Throw(
  Visit.node(node.argument, scope, ""));

exports.TryStatement = (node, scope, labels) => Build.Try(
  labels,
  Visit.NODE(node.block.body, scope, false),
  (
    node.handler ?
    Scope.BLOCK(
      scope,
      Query.PatternNames(node.handler.param),
      [],
      (scope) => ArrayLite.concat(
        Build.Statement(
          Scope.assign(
            scope,
            true,
            node.handler.param,
            Build.error(),
            Build.primitive(void 0))),
        Build.Block(
          [],
          Visit.NODE(
            node.handler.body,
            (
              Scope.GetCompletion(scope) ?
              Scope.ExtendCompletion(scope, null) :
              scope),
            false)))) :
    Scope.BLOCK(scope, [], [], (scope) => [])),
  (
    node.finalizer ?
    Visit.NODE(
      node.finalizer,
      (
        Scope.GetCompletion(scope) ?
        Scope.ExtendCompletion(scope, null) :
        scope),
      false) :
    Scope.BLOCK(scope, [], [], (scope) => [])));

exports.DebuggerStatement = (node, scope, labels) => Build.Debugger();

exports.VariableDeclaration = (node, scope, labels) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Build.Expression(
    Pattern.assign(
      scope,
      node.kind !== "var",
      declaration.id,
      (
        declaration.init ?
        Visit.node(
          node2.init,
          scope,
          id.type === "Identifier" ? id.name : "") :
        Build.primitive(void 0)),
      Build.primitive(void 0))));

exports.WhileStatement = (node, scope, labels) => Build.While(
  labels,
  Visit.node(node.test, scope, ""),
  Visit.NODE(node.body, scope, false));

exports.DoWhileStatement = (node, scope, labels) => Scope.Token(
  scope,
  Build.primitive(true),
  (token) => Build.While(
    labels,
    Build.conditional(
      Scope.read(scope, token),
      Scope.write(
        token,
        Build.primitive(false),
        Build.primitive(true)),
      Visit.node(node.test, scope, "")),
    Visit.NODE(node.body, scope, false)));

exports.ForStatement = (node, scope, labels) => Scope.Token(
  scope,
  Build.primitive(false),
  (token) => Build.Block(
    [],
    Scope.BLOCK(
      scope,
      (
        node.init.type === "VariableDeclaration" ?
        ArrayLite.flatMap(node.declarations, Query.DeclarationNames) :
        []),
      (
        node.init.type === "VariableDeclaration" ?
        ArrayLite.flatMap(node.declarations, Query.DeclarationNames) :
        []),
      (scope) => ArrayLite.concat(
        (
          node.init && node.init.type === "VariableDeclaration" ?
          Visit.Node(node.init, scope, []) :
          Build.Expression(
            Visit.node(node.init, scope, ""))),
        Build.While(
          labels,
          Build.sequence(
            Build.conditional(
              Scope.read(scope, token),
              (
                node.update ?
                Visit.node(node.update, scope, "") :
                Build.primitive(void 0)),
              Scope.write(
                scope,
                token,
                Build.primitive(true),
                Build.primitive(void 0))),
            (
              node.test ?
              Visit.node(node.test, scope, "") :
              Build.primitive(true))),
          Visit.NODE(node, scope, false))))));

exports.ForInStatement = (node, scope, labels) => Build.Block(
  null,
  Scope.BLOCK(
    scope,
    (
      node.left.type === "VariableDeclaration" && node.left.kind === "let" ?
      Query.PatternNames(node.left.declarations[0].id) :
      []),
    (
      node.left.type === "VariableDeclaration" && node.left.kind === "const" ?
      Query.PatternNames(node.left.declarations[0].id) :
      []),
    (scope) => Scope.Token(
      scope,
      Build.apply(
        Build.builtin("AranEnumerate"),
        Build.primitive(void 0),
        [
          Visit.node(node.right, scope, "")]),
      (token1) => Scope.Token(
        scope,
        Build.primitive(0),
        (token2) => Scope.Token(
          scope,
          Build.get(
            Scope.read(scope, token1),
            Build.primitive("length")),
          (token3) => Build.While(
            labels,
            Build.binary(
              "<",
              Scope.read(scope, token2),
              Scope.read(scope, token3)),
            Scope.BLOCK(
              scope,
              (
                node.left.type === "VariableDeclaration" && node.left.kind === "let" ?
                Query.PatternNames(node.left.declarations[0].id) :
                []),
              (
                node.left.type === "VariableDeclaration" && node.left.kind === "const" ?
                Query.PatternNames(node.left.declarations[0].id) :
                []),
              (scope) => ArrayLite.concat(
                Build.Expression(
                  Scope.assign(
                    scope,
                    node.left.type === "VariableDeclaration" && node.left.kind !== "var",
                    (
                      node.left.type === "VariableDeclaration" ?
                      node.left.declarations[0].id :
                      node.left),
                    Build.get(
                      Scope.read(token1),
                      Scope.read(token2)))),
                Build.Block(
                  null,
                  Visit.NODE(node.body, scope, false)),
                Build.Expression(
                  Build.write(
                    token2,
                    Build.binary(
                      "+",
                      Scope.read(scope, token2),
                      Build.primitive(1)),
                    Build.primitive(void 0)))))))))));

exports.ForOfStatement = (node, scope) => Build.Block(
  null,
  Scope.BLOCK(
    scope,
    (
      node.left.type === "VariableDeclaration" && node.left.kind === "let" ?
      Query.PatternNames(node.left.declarations[0].id) :
      []),
    (
      node.left.type === "VariableDeclaration" && node.left.kind === "const" ?
      Query.PatternNames(node.left.declarations[0].id) :
      []),
    (scope) => Scope.Token(
      scope,
      Visit.node(node.right, scope, ""),
      (token1) => Scope.Token(
        scope,
        Build.apply(
          Build.get(
            Scope.read(token1),
            Build.builtin("SymbolIterator")),
          Scope.read(token1),
          []),
        (token2) => Build.While(
          labels,
          Build.write(
            token1,
            Build.apply(
              Build.get(
                Scope.read(scope, token2),
                Build.primitive("next")),
              Scope.read(scope, token2),
              []),
            Build.unary(
              "!",
              Build.get(
                Scope.read(scope, token1),
                Build.primitive("done")))),
          Scope.BLOCK(
            scope,
            (
              node.left.type === "VariableDeclaration" && node.left.kind === "let" ?
              Query.PatternNames(node.left.declarations[0].id) :
              []),
            (
              node.left.type === "VariableDeclaration" && node.left.kind === "const" ?
              Query.PatternNames(node.left.declarations[0].id) :
              []),
            (scope) => ArrayLite.concat(
              Build.Expression(
                Scope.assign(
                  scope,
                  node.left.type === "VariableDeclaration" && node.left.kind !== "var",
                  (
                    node.left.type === "VariableDeclaration" ?
                    node.left.declarations[0].id :
                    node.left),
                  Build.get(
                    Scope.read(scope, token1),
                    Build.primitive("value")))),
              Build.Block(
                null,
                Visit.NODE(node.body, scope, false)))))))));
