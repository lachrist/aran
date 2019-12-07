
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");
const Closure = require("./closure.js");

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

const body1 = (node, scope, labels) => {
  if (node.type === "BlockStatement") {
    if (node.body.length === 1) {
      return body(node.body[0], scope, labels);
    }
    return Visit.NODES(node.body, scope, labels);
  }
  if (node.type === "LabeledStatement") {
    return body(node.body, scope, ArrayLite.concat(labels, [node.label.name]));
  }
  return Visit.NODES([node], scope, labels);
};

const body2 = (boolean, nodes, scope, labels, object) => (
  boolean ?
  
    


const bodycontinue = (node, scope, labels, object) => (
  
);

exports.EmptyStatement = (node, scope, labels) => [];

exports.BlockStatement = (node, scope, labels) => Build.Block(
  Visit.NODE(node, scope, "block", labels, null));

exports.ExpressionStatement = (node, scope, labels) => Build.Expression(
  (
    Scope.$GetCompletion(scope) ?
    Scope.set(
      Scope.$GetCompletion(scope),
      Visit.node(node.expression, scope, false, null)) :
    Visit.node(node.expression, scope, true, null)));

exports.LabeledStatement = (node, scope, labels) => Visit.Node(
  node.body,
  scope,
  ArrayLite.concat(options.labels, [node.label.name]));

exports.SwitchStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Scope.Cache(
    scope,
    "StatementSwitchDiscriminant",
    (
      node.discriminant.type === "Literal" ?
      node.discriminant.value :
      Visit.node(node.discriminant, scope, false, null)),
    (cache) => Build.Block(
      Visit.NODE(
        node,
        scope,
        "switch",
        ArrayLite.concat(labels, [null]),
        cache))));

exports.WithStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Scope.Cache(
    scope,
    "StatementWithObject",
    (
      node.object.type === "Literal" ?
      node.object.value :
      Visit.node(node.object, scope, false, null)),
    (cache) => Build.Block(
      Visit.NODE(
        node.body,
        scope,
        "with",
        labels,
        cache))));

exports.IfStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Build.If(
    Visit.node(node.test, scope, false, null),
    Visit.NODE(node.consequent, scope, "block", labels, null),
    Visit.NODE(node.alternative, scope, "block", labels, null)));

// No completion:
// ==============
// eval("'foo'; a:{break a}")
// 'foo'
exports.BreakStatement = (node, scope, labels) => (
  ArrayLite.includes(
    labels,
    node.label && node.label.name) ?
  [] :
  Build.Break(
    node.label && node.label.name));

exports.ContinueStatement = (node, scope, labels) => Build.Continue(
  node.label && node.label.name);

exports.ReturnStatement = (node, scope, labels) => Build.Return(
  (
    Scope.$GetClosure(scope) === "function" ?
    (
      node.argument ?
      Scope.cache(
        scope,
        "StatementReturnArgument",
        Visit.node(node.argument, scope, false, null),
        (cache) => Build.conditional(
          Scope.read(scope, "new.target"),
          Build.conditional(
            Build.binary(
              "===",
              Build.unary(
                "typeof",
                Scope.get(scope, cache)),
              Build.primitive("object")),
            Build.conditional(
              Scope.get(scope, cache),
              Scope.get(scope, cache),
              Scope.read(scope, "this")),
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Scope.get(scope, cache)),
                Build.primitive("function")),
              Scope.get(scope, cache),
              Scope.read(scope, "this"))),
          Scope.get(scope, cache))) :
      Build.conditional(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Build.primitive(void 0))) :
    (
      node.argument ?
      Visit.node(node.argument, scope, "") :
      Build.primitive(void 0))));

exports.ThrowStatement = (node, scope, labels) => Build.Expression(
  Build.throw(
    Visit.node(node.argument, scope, false, null)));

exports.TryStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Build.Try(
    Visit.NODE(node.block, scope, "block", labels, null),
    (
      node.handler ?
      Scope.BLOCK(
        scope,
        null,
        (
          node.handler.param ?
          Pattern.$GetIdentifiers(node.handler.param) :
          []),
        [],
        (scope) => ArrayLite.concat(
          // Completion reset on catch:
          // ==========================
          // eval("try { 'foo'; throw 'bar'; } catch (error) {}")
          // undefined
          (
            Scope.$GetCompletion(scope) ?
            Build.Expression(
              Scope.set(
                Scope.$GetCompletion(scope),
                Build.primitive(void 0))) :
            []),
          (
            node.handler.param ?
            Build.Expression(
              (
                node.handler.param.type === "Identifier" ?
                Scope.write(
                  scope,
                  node.handler.param.name,
                  Scope.error(scope)) :
                Pattern.assign(
                  scope,
                  false,
                  node.handler.param,
                  Scope.$Error(scope)))) :
            []),
          Build.Block(
            Visit.NODE(node.handler.body, scope, "block", labels, null)))) :
      Visit.NODE(null, scope, "block", labels, null)),
    Visit.NODE(
      node.finalizer,
      Scope.$DeleteCompletion(scope),
      "block",
      labels,
      null)));

exports.DebuggerStatement = (node, scope, labels) => Build.Debugger();

exports.VariableDeclaration = (node, scope, labels) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Build.Expression(
    Pattern.assign3(
      scope,
      node.kind !== "var",
      declaration.id,
      declaration.init)));

exports.FunctionDeclaration = (node, scope, labels) => Build.Expression(
  Scope.write(
    scope,
    node.id.name,
    Closure.FunctionExpression(node, scope, false, null)));

exports.WhileStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Build.While(
    Visit.node(node.test, scope, false, null),
    Visit.NODE(
      node.body,
      scope,
      "block",
      ArrayLite.concat(labels, [null]),
      null)));

exports.DoWhileStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Scope.cache(
    scope,
    "StatementDoWhileEntrance",
    Build.primitive(true),
    (cache) => Build.While(
      Build.conditional(
        Scope.get(scope, cache),
        Build.sequence(
          Scope.set(
            scope,
            cache,
            Build.primitive(false)),
          Build.primitive(true)),
        Visit.node(node.test, scope, false, null)),
      Visit.NODE(
        node.body,
        scope,
        "block",
        ArrayLite.concat(labels, [null]),
        null))));

exports.ForStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  (
    (
      (closure) => (
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
                scope,
                null
                (
                  node.init.kind === "let" ?
                  ArrayLite.flatMap(
                    node.init.declarations,
                    (declaration) => Pattern.$GetIdentifiers(declaration.id)) :
                  []),
                (
                  node.init.kind === "const" ?
                  ArrayLite.flatMap(
                    node.init.declarations,
                    (declaration) => Pattern.$GetIdentifiers(declaration.id)) :
                  []),
                (scope) => ArrayLite.concat(
                  Visit.Node(node.init, scope),
                  closure(scope))))) :
          ArrayLite.concat(
            // No completion:
            // > for ("foo"; false;) {}
            // undefined
            Build.Expression(
              Visit.node(node.init, scope, true, null)),
            closure(scope))) :
        closure(scope)))
    (
      (scope) => Build.While(
        (
          node.test ?
          Visit.node(node.test, scope, false, null) :
          Build.primitive(true)),
        (
          node.update ?
          Scope.BLOCK(
            scope,
            null,
            [],
            [],
            (scope) => ArrayLite.concat(
              Build.Block(
                Visit.NODE(
                  node.body,
                  scope,
                  "block",
                  ArrayLite.concat(labels, [null]),
                  null)),
              // No completion:
              // ==============
              // for (let index = 0; index < 10; index++) {}
              // undefined
              Build.Expression(
                Visit.node(node.update),
                scope,
                true,
                null))) :
          Visit.NODE(
            node.body,
            scope,
            "block",
            ArrayLite.concat(labels, [null]),
            null))))));

exports.ForInStatement = (node, scope, labels) => ArrayLite.concat(
  (
    Scope.$GetCompletion(scope) ?
    Build.Expression(
      Scope.set(
        Scope.$GetCompletion(scope),
        Build.primitive(void 0))) :
    []),
  Build.Block(
    Scope.BLOCK(
      scope,
      null,
      (
        (
          node.left.type === "VariableDeclaration" &&
          node.left.kind === "let") ?
        Pattern.$GetIdentifiers(node.left.declarations[0].id) :
        []),
      (
        (
          node.left.type === "VariableDeclaration" &&
          node.left.kind === "const") ?
        Pattern.$GetIdentifiers(node.left.declarations[0].id) :
        []),
      (scope) => Scope.Cache(
        scope,
        "StatementForInRight",
        Visit.node(node.right, scope, false, null),
        (cache1) => Scope.Cache(
          scope,
          "StatementForInKeys",
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            []),
          (cache2) => ArrayLite.concat(
            // > Object.prototype.foo = "bar";
            // 'bar'
            // > for (let key in null) { console.log(key) }
            // undefined
            // > for (let key in Object(null)) { console.log(key) }
            // foo
            Build.Expression(
              Scope.set(
                scope,
                cache1,
                Build.conditional(
                  Build.binary(
                    "===",
                    Scope.get(scope, cache1),
                    Build.primitive(null)),
                  Build.primitive(null),
                  Build.conditional(
                    Build.binary(
                      "===",
                      Scope.get(scope, cache1),
                      Build.primitive(void 0)),
                    Build.primitive(null),
                    Build.apply(
                      Build.builtin("Object"),
                      Build.primitive(void 0),
                      [
                        Scope.get(scope, cache1)]))))),
            Build.While(
              Scope.get(scope, cache1),
              Scope.BLOCK(
                scope,
                null,
                [],
                [],
                (scope) => ArrayLite.concat(
                  Build.Expression(
                    Scope.set(
                      scope,
                      cache2,
                      Build.apply(
                        Build.builtin("Array.prototype.concat"),
                        Scope.read(scope, cache2),
                        [
                          Build.apply(
                            Build.builtin("Object.keys"),
                            Build.primitive(void 0),
                            [
                              Scope.read(scope, cache1)])]))),
                  Scope.Expression(
                    Scope.set(
                      scope,
                      cache1,
                      Build.apply(
                        Build.builtin("Reflect.getPrototypeOf"),
                        Build.primitive(void 0),
                        [
                          Scope.get(scope, cache1)])))))),
            Scope.Cache(
              scope,
              "StatementForInIndex",
              Build.primitive(0),
              (cache3) => Scope.Cache(
                scope,
                "StatementForInLength",
                Object.get(
                  Scope.get(scope, cache2),
                  Build.primitive("length")),
                (cache4) => Build.While(
                  Build.binary(
                    "<",
                    Scope.get(scope, cache3),
                    Scope.get(scope, cache4)),
                  Scope.BLOCK(
                    scope,
                    null,
                    (
                      (
                        node.left.type === "VariableDeclaration" &&
                        node.left.kind === "let") ?
                      Pattern.$GetIdentifiers(node.left.declarations[0].id) :
                      []),
                    (
                      (
                        node.left.type === "VariableDeclaration" &&
                        node.left.kind === "const") ?
                      Pattern.$GetIdentifiers(node.left.declarations[0].id) :
                      []),
                    (scope) => ArrayLite.concat(
                      Build.Expression(
                        Pattern.assign2(
                          scope,
                          (
                            node.left.type === "VariableDeclaration" ?
                            node.left.kind !== "var" :
                            false),
                          (
                            node.left.type === "VariableDeclaration" ?
                            node.left.declarations[0].id :
                            node.left),
                          Object.obj(
                            Scope.get(scope, cache2),
                            Scope.get(scope, cache3)))),
                      Build.Block(
                        Visit.NODE(
                          node.body,
                          scope,
                          "block",
                          ArrayLite.concat(labels, [null]),
                          null)),
                      Build.Expression(
                        Scope.set(
                          scope,
                          cache3,
                          Build.binary(
                            "+",
                            Scope.get(scope, cache3),
                            Build.primitive(1))))))))))))));

exports.ForOfStatement = (node, scope, labels) => Build.Block(
  Scope.BLOCK(
    scope,
    null,
    (
      (
        node.left.type === "VariableDeclaration" &&
        node.left.kind === "let") ?
      Pattern.$GetIdentifiers(node.left.declarations[0].id) :
      []),
    (
      (
        node.left.type === "VariableDeclaration" &&
        node.left.kind === "const") ?
      Pattern.$GetIdentifiers(node.left.declarations[0].id) :
      []),
    (scope) => Scope.Cache(
      scope,
      "StatementForOfRight",
      Visit.node(node.right, scope, ""),
      (cache1) => Scope.Cache(
        scope,
        "StatementForOfIterator",
        Build.apply(
          Object.get(
            Object.obj(
              () => Scope.get(scope, cache1)),
            Build.builtin("Symbol.iterator")),
          Scope.get(scope, cache1),
          []),
        (cache2) => Scope.Cache(
          scope,
          "StatementForOfStep",
          Build.primitive(null),
          (cache3) => Build.While(
            Build.sequence(
              Scope.set(
                scope,
                cache3,
                Build.apply(
                  Object.get(
                    Scope.get(cache2),
                    Build.primitive("next")),
                  Scope.get(cache2),
                  [])),
              Build.unary(
                "!",
                Object.get(
                  Scope.get(cache3),
                  Build.primitive("done")))),
          Scope.BLOCK(
            scope,
            null,
            (
              (
                node.left.type === "VariableDeclaration" &&
                node.left.kind === "let") ?
              Pattern.$GetIdentifiers(node.left.declarations[0].id) :
              []),
            (
              (
                node.left.type === "VariableDeclaration" &&
                node.left.kind === "const") ?
              Pattern.$GetIdentifiers(node.left.declarations[0].id) :
              []),
            (scope) => ArrayLite.concat(
              Build.Expression(
                Pattern.assign2(
                  scope,
                  (
                    node.left.type === "VariableDeclaration" &&
                    node.left.kind !== "var"),
                  node.left,
                  Object.get(
                    Scope.get(scope, cache3),
                    Build.primitive("value")))),
              Build.Block(
                Visit.NODE(
                  node.body,
                  scope,
                  "block",
                  ArrayLite.concat(labels, [null]),
                  null))))))))));
