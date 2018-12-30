
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");
const Property = require("../property.js");

const Reflect_apply = Reflect.apply;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const String_prototype_substring = String.prototype.substring;

exports.EmptyStatement = (node, scope) => [];

exports.BlockStatement = (node, scope) => Build.Block(
  Scope.GetLabels(scope),
  Visit.NODE(
    node,
    Scope.ExtendLabel(scope, null),
    false));

exports.ExpressionStatement = (node, scope) => (
  Reflect_getOwnPropertyDescriptor(node, "AranCompletion") ?
  Scope.Write(
    scope,
    Scope.GetCompletion(scope),
    Visit.node(node.expression, scope, "")) :
  (
    node.expression.type === "AssignmentExpression" ?
    (
      node.expression.operator === "=" ?
      Scope.Assign(
        scope,
        false,
        node.expression.left,
        Visit.node(
          node.expression.right,
          scope,
          node.expression.left.type === "Identifier" ? node.expression.left.name : "")) :
      Scope.Update(
        scope,
        Reflect_apply(
          String_prototype_substring,
          node.expression.operator,
          [0, node.expression.operator.length-1]),
        node.expression.left,
        Visit.node(
          node.expression.right,
          scope,
          node.expression.left.type === "Identifier" ? node.expression.left.name : ""))) :
    (
      node.expression.type === "UpdateExpression" ?
      Scope.Update(
        scope,
        node.expression.operator[0],
        node.expression.argument,
        Build.primitive(1)) :
      Build.Expression(
        Visit.node(node.expression, scope, "")))));

exports.LabeledStatement = (node, scope) => Visit.Node(
  node.body,
  Scope.ExtendLabel(scope, node.label.name));

exports.SwitchCase = (node, scope) => Build.Case(
  (
    node.test ?
    Build.binary(
        "===",
        Scope.read(scope, Scope.GetSwitch(scope)),
        Visit.node(node.test, scope, "")) :
    null));

exports.SwitchStatement = (node, scope) => Scope.Token(
  scope,
  Visit.node(node.discriminant, scope, ""),
  (token) => Build.Switch(
    Scope.GetLabels(scope),
    Visit.NODE(
      node.cases,
      Scope.ExtendLabel(
        Scope.ExtendSwitch(scope, token),
        null),
      false)));

exports.WithStatement = (node, scope) => Scope.Token(
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
            Build.primitive("Cannot convert 'undefined' to object")]),
        Build.apply(
          Build.builtin("Object"),
          Build.primitive(void 0),
          [
            Scope.read(scope, token)]))),
  (token) => Visit.Node(
    node.body,
    Scope.ExtendWith(scope, token))));

exports.IfStatement = (node, scope) => Build.If(
  Scope.GetLabels(scope),
  Visit.node(node.test, scope, ""),
  Visit.NODE(
    node.consequent,
    Scope.ExtendLabel(scope, null),
    false),
  (
    node.alternate ?
    Visit.NODE(
      node.alternate,
      Scope.ExtendLabel(scope, null),
      false) :
    Scope.BLOCK(scope, [], [], (scope) => [])));

exports.BreakStatement = (node, scope) => (
  (
    node.label &&
    ArrayLite.includes(
      Scope.GetLabels(scope),
      node.label.name)) ?
  [] :
  Build.Break(node.label ? node.label.name : null));

exports.ContinueStatement = (node, scope) => Build.Continue(node.label ? node.label.name : null);

exports.ReturnStatement = (node, scope) => Build.Return(
  (
    Scope.GetCallee(scope) === "arrow" ?
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
            Build.binary(
              "===",
              Build.unary(
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

exports.ThrowStatement = (node, scope) => Build.Throw(
  Visit.node(node.argument, scope, ""));

exports.TryStatement = (node, scope) => Build.Try(
  Scope.GetLabels(scope),
  Visit.NODE(
    node.block,
    Scope.ExtendLabel(scope, null),
    false),
  (
    node.handler ?
    Scope.BLOCK(
      Scope.ExtendLabel(scope, null),
      Query.PatternNames(node.handler.param),
      [],
      (scope) => ArrayLite.concat(
        (
          Reflect_getOwnPropertyDescriptor(node, "AranCompletion") ?
          Build.Write(
            scope,
            Scope.GetCompletion(scope),
            Build.primitive(void 0)) :
          []),
        Scope.Assign(
          scope,
          true,
          node.handler.param,
          Build.error()),
        Build.Block(
          [],
          Visit.NODE(node.handler.body, scope, false)))) :
    Scope.BLOCK(scope, [], [], (scope) => [])),
  (
    node.finalizer ?
    Visit.NODE(
      node.finalizer,
      Scope.ExtendLabel(scope, null),
      false) :
    Scope.BLOCK(scope, [], [], (scope) => [])));

exports.DebuggerStatement = (node, scope) => Build.Debugger();

exports.VariableDeclaration = (node, scope) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Scope.Assign(
    scope,
    node.kind !== "var",
    declaration.id,
    (
      declaration.init ?
      Visit.node(
        declaration.init,
        scope,
        (
          declaration.id.type === "Identifier" ?
          declaration.id.name :
          "")) :
      Build.primitive(void 0))));

exports.WhileStatement = (node, scope) => Build.While(
  Scope.GetLabels(scope),
  Visit.node(node.test, scope, ""),
  Visit.NODE(
    node.body,
    Scope.ExtendLabel(scope, null),
    false));

exports.DoWhileStatement = (node, scope) => Scope.Token(
  scope,
  Build.primitive(true),
  (token) => Build.While(
    Scope.GetLabels(scope),
    Build.conditional(
      Scope.read(scope, token),
      Scope.write(
        scope,
        token,
        Build.primitive(false),
        Build.primitive(true)),
      Visit.node(node.test, scope, "")),
    Visit.NODE(
      node.body,
      Scope.ExtendLabel(scope),
      false)));

exports.ForStatement = (node, scope) => (
  (
    node.init &&
    node.init.type === "VariableDeclaration" &&
    node.init.kind !== "var") ?
  Build.Block(
    [],
    Scope.BLOCK(
      scope,
      (
        node.init.kind === "let" ?
        ArrayLite.flatMap(node.init.declarations, Query.DeclarationNames) :
        []),
      (
        node.init.kind === "const" ?
        ArrayLite.flatMap(node.init.declarations, Query.DeclarationNames) :
        []),
      (scope) => ArrayLite.concat(
        Visit.Node(node.init, scope),
        Build.While(
          Scope.GetLabels(scope),
          (
            node.test ?
            Visit.node(node.test, scope, "") :
            Build.primitive(true)),
          (
            node.update ?
            Scope.BLOCK(
              Scope.ExtendLabel(scope, null),
              [],
              [],
              (scope) => ArrayLite.concat(
                (
                  node.body.type === "BlockStatement" ?
                  Build.Block(
                    [],
                    Visit.NODE(node.body, scope, false)) :
                  Visit.Node(node.body, scope)),
                exports.ExpressionStatement({expression:node.update}, scope, []))) :
            Visit.NODE(
              node.body,
              Scope.ExtendLabel(scope, null),
              false)))))) :
  ArrayLite.concat(
    (
      (
        node.init &&
        node.init.type === "VariableDeclaration") ?
      Visit.Node(node.init, scope) :
      (
        node.init ?
        exports.ExpressionStatement({expression:node.init}, scope, []) :
        [])),
    Build.While(
      Scope.GetLabels(scope),
      (
        node.test ?
        Visit.node(node.test, scope, "") :
        Build.primitive(true)),
      (
        node.update ?
        Scope.BLOCK(
          Scope.ExtendLabel(scope, null),
          [],
          [],
          (scope) => ArrayLite.concat(
            (
              node.body.type === "BlockStatement" ?
              Build.Block(
                [],
                Visit.NODE(node.body, scope, false)) :
              Visit.Node(node.body, scope)),
            exports.ExpressionStatement({expression:node.update}, scope, []))) :
        Visit.NODE(
          node.body,
          Scope.ExtendLabel(scope, null),
          false)))));

exports.ForInStatement = (node, scope) => Build.Block(
  [],
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
          Property.getunsafe(
            Scope.read(scope, token1),
            Build.primitive("length")),
          (token3) => Build.While(
            Scope.GetLabels(scope),
            Build.binary(
              "<",
              Scope.read(scope, token2),
              Scope.read(scope, token3)),
            Scope.BLOCK(
              Scope.ExtendLabel(scope, null),
              (
                node.left.type === "VariableDeclaration" && node.left.kind === "let" ?
                Query.PatternNames(node.left.declarations[0].id) :
                []),
              (
                node.left.type === "VariableDeclaration" && node.left.kind === "const" ?
                Query.PatternNames(node.left.declarations[0].id) :
                []),
              (scope) => ArrayLite.concat(
                Scope.Assign(
                  scope,
                  node.left.type === "VariableDeclaration" && node.left.kind !== "var",
                  (
                    node.left.type === "VariableDeclaration" ?
                    node.left.declarations[0].id :
                    node.left),
                  Property.getunsafe(
                    Scope.read(scope, token1),
                    Scope.read(scope, token2))),
                Build.Block(
                  [],
                  Visit.NODE(node.body, scope, false)),
                Build.Write(
                  token2,
                  Build.binary(
                    "+",
                    Scope.read(scope, token2),
                    Build.primitive(1)))))))))));

exports.ForOfStatement = (node, scope) => Build.Block(
  [],
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
          Property.get(
            scope,
            token1,
            Build.builtin("Symbol.iterator")),
          Scope.read(scope, token1),
          []),
        (token2) => Build.While(
          Scope.GetLabels(scope),
          Scope.write(
            scope,
            token1,
            Build.apply(
              Property.getunsafe(
                Scope.read(scope, token2),
                Build.primitive("next")),
              Scope.read(scope, token2),
              []),
            Build.unary(
              "!",
              Property.getunsafe(
                Scope.read(scope, token1),
                Build.primitive("done")))),
          Scope.BLOCK(
            Scope.ExtendLabel(scope, null),
            (
              node.left.type === "VariableDeclaration" && node.left.kind === "let" ?
              Query.PatternNames(node.left.declarations[0].id) :
              []),
            (
              node.left.type === "VariableDeclaration" && node.left.kind === "const" ?
              Query.PatternNames(node.left.declarations[0].id) :
              []),
            (scope) => ArrayLite.concat(
              Scope.Assign(
                scope,
                node.left.type === "VariableDeclaration" && node.left.kind !== "var",
                (
                  node.left.type === "VariableDeclaration" ?
                  node.left.declarations[0].id :
                  node.left),
                Property.getunsafe(
                  Scope.read(scope, token1),
                  Build.primitive("value"))),
              Build.Block(
                [],
                Visit.NODE(node.body, scope, false)))))))));
