
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");
const Closure = require("./closure.js");

const Reflect_apply = Reflect.apply;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const String_prototype_substring = String.prototype.substring;

exports.EmptyStatement = (node, scope, labels) => [];

exports.BlockStatement = (node, scope, labels) => Build.Block(
  Visit.NODES(node.body, scope, labels));

exports.ExpressionStatement = (node, scope, labels) => Build.Expression(
  (
    Scope.$GetCompletion(scope) ?
    Scope.set(
      Scope.$GetCompletion(scope),
      Visit.node(node.expression, scope, "")) :
    (
      node.type === "AssignmentExpression" ?
      (
        node.operator === "=" ?
        Pattern.assign(
          scope,
          false,
          node.left,
          {
            __proto__: null,
            expression: Visit.node(node.right, scope, ""),
            cache: null}) :
        (
          node.left.type === "Identifier" ?
          Scope.write(
            scope,
            node.left.name,
            {
              __proto__: null,
              expression: Build.binary(
                Reflect_apply(String_prototype_substring, node.operator, [0, node.operators.length - 1]),
                Scope.read(scope, node.left.name),
                Visit.node(node.right, scope, "")),
              cache: null}) :
          (
            node.left.type === "MemberExpression" :
            Scope.cache(
              scope,
              "StatementExpressionObject",
              node.left.object,
              (cache1) => (
                (
                  (closure) => (
                    node.left.computed ?
                    (
                      node.left.property.type === "Literal" ?
                      closure(
                        Build.primitive(node.left.property.value),
                        Build.primitive(node.left.property.value)) :
                      Scope.cache(
                        scope,
                        "StatementExpressionProperty",
                        node.left.property,
                        (cache2) => closure(
                          Scope.get(scope, cache2),
                          Scope.get(scope, cache2)))) :
                    closure(
                      Build.primitive(node.left.property.name),
                      Build.primitive(node.left.property.name))))
                (
                  (expression1, expression2) => (
                    Scope.$GetStrict(scope) ?
                    Build.conditional(
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.get(cache1),
                          expression1,
                          Build.binary(
                            Reflect_apply(String_prototype_substring, node.operator, [0, node.operators.length - 1]),
                            Build.apply(
                              Build.builtin("Reflect.get"),
                              Build.primitive(void 0),
                              [
                                objectify(scope, cache1),
                                expression2]),
                            Visit.node(node.right, scope, ""))]),
                      Build.primitive(true),
                      Build.throw(
                        Build.construct(
                          Build.builtin("TypeError"),
                          [
                            Build.primitive("Cannot assign object property")]))) :
                    Build.sequence(
                      Scope.set(
                        scope,
                        cache1,
                        objectify(scope, cache1)),
                      Build.apply(
                        Build.builtin("Reflect.set"),
                        Build.primitive(void 0),
                        [
                          Scope.get(cache1),
                          expression1,
                          Build.binary(
                            Reflect_apply(String_prototype_substring, node.operator, [0, node.operators.length - 1]),
                            Build.apply(
                              Build.builtin("Reflect.get"),
                              Build.primitive(void 0),
                              [
                                Scope.get(scope, cache1),
                                expression2]),
                            Visit.node(node.right, scope, ""))]))))))))) :
        )))
                            
                        
                      
                    
          
  
  Scope.Write(
    scope,
    Scope.GetToken(scope, "Completion"),
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

exports.LabeledStatement = (node, scope, labels) => Visit.Node(
  node.body,
  scope,
  ArrayLite.concat(labels, [node.label.name]));

exports.SwitchStatement = (node, scope, labels) => Scope.Token(
  scope,
  Visit.node(node.discriminant, scope, ""),
  (token1) => Scope.Token(
    scope,
    Build.primitive(false),
    (token2) => Build.Block(
      Visit.SWITCH(
        node.cases,
        scope,
        ArrayLite.concat(labels, [null]),
        (scope, node, block) => Build.If(
          Build.conditional(
            Scope.read(scope, token1),
            Build.primitive(true),
            (
              node === null ?
              Scope.write(
                scope,
                token1,
                Build.primitive(true),
                Build.primitive(true)) :
              Build.conditional(
                Build.binary(
                  "===",
                  Scope.read(token2),
                  Visit.node(node, scope, "")),
                Scope.write(
                  scope,
                  token1,
                  Build.primitive(true),
                  Build.primitive(true)),
                Build.primitive(false)))),
          block)))));

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
        Build.throw(
          Build.construct(
            Build.builtin("TypeError"),
            [
              Build.primitive("Cannot convert 'null' to object")]))),
      Build.conditional(
        Build.binary(
          "===",
          Scope.read(scope, token),
          Build.primitive(void 0)),
        Build.throw(
          Build.construct(
            Build.builtin("TypeError"),
            [
              Build.primitive("Cannot convert 'undefined' to object")])),
        Build.apply(
          Build.builtin("Object"),
          Build.primitive(void 0),
          [
            Scope.read(scope, token)]))),
  (token) => Visit.Node(
    node.body,
    Scope.ExtendToken(scope, "With", token),
    labels)));

exports.IfStatement = (node, scope, labels) => Build.If(
  Visit.node(node.test, scope, ""),
  Visit.NODES(
    (
      node.consequent.type === "BlockStatement" ?
      node.consequent.body :
      [node.consequent]),
    scope,
    labels),
  Visit.NODES(
    (
      node.alternate ?
      (
        node.alternate.type === "BlockStatement" ?
        node.aternate.body :
        [node.alternate]) :
      []),
    scope,
    labels));

exports.BreakStatement = (node, scope, labels) => (
  (
    node.label &&
    ArrayLite.includes(labels, node.label.name)) ?
  [] :
  Build.Break(node.label ? node.label.name : null));

exports.ContinueStatement = (node, scope, labels) => Build.Continue(
  node.label ? node.label.name : null);

exports.ReturnStatement = (node, scope, labels) => Build.Return(
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

exports.ThrowStatement = (node, scope, labels) => Build.Statement(
  Build.throw(
    Visit.node(node.argument, scope, "")));

exports.TryStatement = (node, scope, labels) => Build.Try(
  Visit.NODES(node.block.body, scope, labels),
  (
    node.handler ?
    Scope.BLOCK(
      labels,
      scope,
      (
        node.handler.param ?
        Query.PatternNames(node.handler.param) :
        []),
      [],
      (scope) => ArrayLite.concat(
        (
          Reflect_getOwnPropertyDescriptor(node, "AranCompletion") ?
          Scope.Write(
            scope,
            Scope.GetToken(scope, "Completion"),
            Build.primitive(void 0)) :
          []),
        (
          node.handler.param ?          
          Scope.Assign(
            scope,
            true,
            node.handler.param,
            Build.error()) :
          Build.Statement(
            Build.error())),
        Build.Block(
          [],
          Visit.NODES(node.handler.body.body, scope, [])))) :
    Visit.NODES([], scope, labels)),
  Visit.NODES(
    node.finalizer ? node.finalizer.body : [],
    scope,
    labels));

exports.DebuggerStatement = (node, scope, labels) => Build.Debugger();

exports.VariableDeclaration = (node, scope, labels) => ArrayLite.flatMap(
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

exports.WhileStatement = (node, scope, labels) => Build.While(
  Visit.node(node.test, scope, ""),
  Visit.NODES(
    node.body === "BlockStatement" ? node.body.body : [node.body],
    scope,
    ArrayLite.concat(labels, [null])));

exports.DoWhileStatement = (node, scope, labels) => Scope.Token(
  scope,
  Build.primitive(true),
  (token) => Build.While(
    Build.conditional(
      Scope.read(scope, token),
      Scope.write(
        scope,
        token,
        Build.primitive(false),
        Build.primitive(true)),
      Visit.node(node.test, scope, "")),
    Visit.NODES(
      node.body.type === "BlockStatement" ? node.body.body : [node.body],
      scope,
      ArrayLite.concat(labels, [null]))));

exports.ForStatement = (node, scope, labels) => (
  ((closure) => (
    node.init ?
    (
      node.init.type === "VariableDeclaration" ?
      (
        node.init.kind === "var" ?
        ArrayLite.concat(
          Visit.Node(node.init, scope, []),
          closure(scope)) :
        Build.Block(
          [],
          Scope.BLOCK(
            [],
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
              closure(scope))))) :
      ArrayLite.concat(
        exports.ExpressionStatement({expression:node.init}, scope, []),
        closure(scope))) :
    closure(scope)))
  ((scope) => Build.While(
    (
      node.test ?
      Visit.node(node.test, scope, "") :
      Build.primitive(true)),
    (
      node.update ?
      Scope.BLOCK(
        ArrayLite.concat(labels, [null]),
        scope,
        [],
        [],
        (scope) => ArrayLite.concat(
          (
            node.body.type === "BlockStatement" ?
            Build.Block(
              [],
              Visit.NODES(node.body, scope, [])) :
            Visit.Node(node.body, scope)),
          exports.ExpressionStatement({expression:node.update}, scope, []))) :
      Visit.NODES(
        node.body.type === "BlockStatement" ? node.body.body : [node.body],
        scope,
        labels)))));

exports.ForInStatement = (node, scope, labels) => Build.Block(
  Scope.BLOCK(
    scope,
    [],
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
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          []),
        (token2) => ArrayLite.concat(
          Scope.Write(
            scope,
            token1,
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Scope.read(scope, token1)),
                Build.primitive("object")),
              Scope.read(scope, token1),
              Build.conditional(
                Build.binary(
                  "===",
                  Scope.read(scope, token1),
                  Build.primitive(void 0)),
                Scope.read(scope, token1),
                Build.apply(
                  Build.builtin("Object"),
                  Build.primitive(void 0),
                  [
                    Scope.read(scope, token1)])))),
          Build.While(
            Scope.read(scope, token1),
            Scope.BLOCK(
              scope,
              [],
              [],
              [],
              (scope) => ArrayLite.concat(
                Scope.Write(
                  scope,
                  token2,
                  Build.apply(
                    Build.builtin("Array.prototype.concat"),
                    Scope.read(scope, token2),
                    [
                      Build.apply(
                        Build.builtin("Object.keys"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token1)])])),
                Scope.Write(
                  scope,
                  token1,
                  Build.apply(
                    Build.builtin("Reflect.getPrototypeOf"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, token1)]))))),
          Scope.Token(
            scope,
            Build.primitive(0),
            (token3) => Scope.Token(
              scope,
              Build.apply(
                Build.builtin("Reflect.get"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token2),
                  Build.primitive("length")]),
              (token4) => Build.While(
                Build.binary(
                  "<",
                  Scope.read(scope, token3),
                  Scope.read(scope, token4)),
                Scope.BLOCK(
                  scope,
                  ArrayLite.concat(labels, [null]),
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
                      Build.apply(
                        Build.builtin("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Scope.read(scope, token2),
                          Scope.read(scope, token3)])),
                    Build.Block(
                      [],
                      Visit.NODES(
                        node.body.type === "BlockStatement" ? node.body.body : [node.body],
                        node.body,
                        scope,
                        [])),
                    Scope.Write(
                      scope,
                      token3,
                      Build.binary(
                        "+",
                        Scope.read(scope, token3),
                        Build.primitive(1)))))))))))));

exports.ForOfStatement = (node, scope, labels) => Build.Block(
  Scope.BLOCK(
    scope,
    [],
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
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Object"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token1)]),
              Build.builtin("Symbol.iterator"),
              Scope.read(scope, token1)]),
          Scope.read(scope, token1),
          []),
        (token2) => Build.While(
          Scope.write(
            scope,
            token1,
            Build.apply(
              Build.apply(
                Build.builtin("Reflect.get"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token2),
                  Build.primitive("next")]),
              Scope.read(scope, token2),
              []),
            Build.unary(
              "!",
              Build.apply(
                Build.builtin("Reflect.get"),
                Build.primitive(void 0),
                [
                  Scope.read(scope, token1),
                  Build.primitive("done")]))),
          Scope.BLOCK(
            scope,
            ArrayLite.concat(labels, [null]),
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
                Build.apply(
                  Build.builtin("Reflect.get"),
                  Build.primitive(void 0),
                  [
                    Scope.read(scope, token1),
                    Build.primitive("value")])),
              Build.Block(
                [],
                Visit.NODE(
                  node.body.type === "BlockStatement" ? node.body.body : [node.body],
                  node.body,
                  scope,
                  [])))))))));

exports.FunctionDeclaration = (node, scope, labels) => Scope.Write(
  scope,
  node.id.name,
  Closure.FunctionExpression(node, scope, ""));
