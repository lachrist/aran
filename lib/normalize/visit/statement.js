
const ArrayLite = require("array-lite");

const Build = require("../build.js");
const Scope = require("../scope");
const Object = require("../object.js");
const Visit = require("./index.js");
const Closure = require("./closure.js");
const Lexic = require("../lexic.js");

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

const variables = (nodes, kind) => ArrayLite.flatMap(
  nodes,
  (node) => (
    (
      node.type === "VariableDeclaration" &&
      node.kind === kind) ?
    ArrayLite.flatMap(node.declarations, declaration) :
    []));

const extract = (node, labels, closure) => {
  if (node === null) {
    return closure([], labels, [], []);
  }
  let nodes = [node];
  while (nodes.length === 1) {
    if (node.type === "LabeledStatement") {
      labels = ArrayLite.concat(labels, [node.label.name]);
      nodes = [node.body];
    } else if (node.type === "BlockStatement") {
      const nodes = ArrayLite.filter(node.body, (node) => node.type !== "EmptyStatement");
      const nodes1 = ArrayLite.filter(nodes, (node) => node.type === "FunctionDeclaration");
      const nodes2 = ArrayLite.filter(nodes, (node) => node.type !== "FunctionDeclaration");
      nodes = ArrayLite.concat(nodes1, nodes2);
    } else {
      break;
    }
  }
  closure(
    nodes,
    labels,
    variables(nodes, "let"),
    variables(nodes, "const"));
};

const block = (node, scope, lexic, labels) => extract(
  node,
  labels,
  (nodes, labels, identifiers1, identifiers2) => Scope.BLOCK(
    scope,
    labels,
    identifiers1,
    identifiers2,
    (scope) => Lexic.FlatMap(
      lexic,
      labels,
      [],
      (lexic, node) => Visit.Node(node, scope, lexic, []))));

const completion = (scope, lexic, closure) => (
  Lexic.IsLast(lexic) ?
  Build.Expression(
    Scope.set(
      scope,
      Lexic.GetCompletion(lexic),
      (
        closure === null ?
        Build.primitive(void 0) :
        closure(false)))) :
  (
    closure === null ?
    [] :
    closure(true)));

const declaration = (node, scope) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Build.Expression(
    Pattern.assign3(
      scope,
      node.kind !== "var",
      declaration.id,
      declaration.init)));

exports.EmptyStatement = (node, scope, lexic, labels) => [];

exports.BlockStatement = (node, scope, lexic, labels) => Build.Block(
  block(node, scope, lexic, labels));

exports.ExpressionStatement = (node, scope, lexic, labels) => completion(
  scope,
  lexic,
  (boolean) => Visit.node(node.expression, scope, boolean, null));

exports.LabeledStatement = (node, scope, lexic, labels) => Visit.Node(
  node.body,
  scope,
  ArrayLite.concat(options.labels, [node.label.name]));

exports.SwitchStatement = (node, scope, lexic, labels) => (
  labels = ArrayLite.concat(labels, [null]),
  ArrayLite.concat(
    completion(scope, lexic, null),
    Scope.Cache(
      scope,
      "StatementSwitchDiscriminant",
      (
        node.discriminant.type === "Literal" ?
        node.discriminant.value :
        Visit.node(node.discriminant, scope, false, null)),
      (cache1) => Build.Block(
        Scope.BLOCK(
          scope,
          labels,
          ArrayLite.flatMap(
            node.cases,
            (clause) => variables(clause.consequent, "let")),
          ArrayLite.flatMap(
            node.cases,
            (clause) => variables(clause.consequent, "const")),
          (scope) => Scope.Cache(
            scope,
            "StatementSwitchMatched",
            Build.primitive(false),
            (cache2) => ArrayLite.concat(
              Lexic.FlatMap(
                lexic,
                labels,
                [],
                ArrayLite.flatMap(
                  node.cases,
                  (clause) => ArrayLite.filter(
                    clause.consequent,
                    (node) => node.type === "FunctionExpression")),
                (lexic, node) => Visit.Node(node, scope, lexic, [])),
              ArrayLite.flatMap(
                node.cases,
                (clause) => Build.If(
                  Build.conditional(
                    Scope.get(scope, cache2),
                    Build.primitive(true),
                    (
                      clause.test === null ?
                      Build.sequence(
                        Scope.set(
                          scope,
                          cache2,
                          Build.primitive(true)),
                        Build.primitive(true)) :
                      Build.conditional(
                        Build.binary(
                          "===",
                          Scope.get(scope, cache1),
                          Visit.node(node.test, scope, false, null)),
                        Build.sequence(
                          Scope.set(
                            scope,
                            cache2,
                            Build.primitive(true)),
                          Build.primitive(true)),
                        Build.primitive(false)))),
                  Scope.BLOCK(
                    scope,
                    [],
                    [],
                    [],
                    (scope) => Lexic.FlatMap(
                      lexic,
                      labels,
                      [],
                      ArrayLite.filter(
                        clause.consequent,
                        (node) => node.type !== "FunctionDeclaration"),
                      (lexic, node) => Visit.Node(node, scope, lexic, []))),
                  Scope.BLOCK(
                    scope,
                    [],
                    [],
                    [],
                    (scope) => []))))))))));

// With keeps the same converted object:
//
// > String.prototype.foo = "foo";
// 'foo'
// > with ("bar") { foo = "qux"; foo; }
// 'qux'
// > with (Object("bar")) { foo = "qux"; foo; }
// 'qux'
// > String.prototype.foo
// 'foo'
//
// Reflect.defineProperty(String.prototype, "foo", {
//   get: function () {
//     this.bar = 123;
//     console.log("get");
//     return "yolo"
//   },
//   set: function (value) {
//     console.log("set", this.bar);
//   }
// });
//
// with ("foo") { foo; foo = 129319; }
// get
// set 123
// 129319
exports.WithStatement = (node, scope, lexic, labels) => ArrayLite.concat(
  completion(scope, lexic, null),
  Scope.Cache(
    scope,
    "StatementWithObject",
    Visit.node(node.object, scope, false, null),
    (cache) => ArrayLite.concat(
      Build.Expression(
        Scope.set(
          scope,
          cache,
          Object.obj(
            () => Scope.get(scope, cache)))),
      block(
        node.body,
        Scope.$SetWith(scope, cache),
        lexic,
        labels))));

exports.IfStatement = (node, scope, lexic, labels) => ArrayLite.concat(
  completion(scope, lexic, null),
  Build.If(
    Visit.node(node.test, scope, false, null),
    block(node.consequent, scope, lexic, labels),
    block(node.alternate, scope, lexic, labels)));

// No completion:
// ==============
// eval("'foo'; a:{break a}")
// 'foo'
exports.BreakStatement = (node, scope, lexic, labels) => (
  ArrayLite.includes(
    labels,
    node.label && node.label.name) ?
  [] :
  (
    Lexic.IsPromoted(node.label && node.label.name) ?
    Build.Continue(node.label && node.label.name) :
    Build.Break(node.label && node.label.name)));

exports.ContinueStatement = (node, scope, lexic, labels) => Build.Continue(
  node.label && node.label.name);

exports.ReturnStatement = (node, scope, lexic, labels) => Build.Return(
  (
    Scope.$IsClosureFunction(scope) ?
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

exports.ThrowStatement = (node, scope, lexic, labels) => Build.Expression(
  Build.throw(
    Visit.node(node.argument, scope, false, null)));

exports.TryStatement = (node, scope, lexic, labels) => ArrayLite.concat(
  completion(scope, lexic, null),
  Build.Try(
    block(node.block, scope, lexic, labels),
    (
      node.handler === null ?
      Scope.BLOCK(
        scope,
        labels,
        [],
        [],
        (scope) => Build.Expression(
          Build.throw(
            Scope.error(scope)))) :
      extract(
        node.handler.body,
        labels,
        (nodes, labels, identifier1, identifier2) => Scope.BLOCK(
          scope,
          labels,
          (
            node.handler.param === null ?
            [] :
            Pattern.$Identifiers(param)),
          [],
          (scope) => ArrayLite.concat(
            // Completion reset on catch:
            // ==========================
            // eval("try { 'foo'; throw 'bar'; } catch (error) {}")
            // undefined
            completion(scope, lexic, null),
            (
              node.handler.param === null ?
              [] :
              Pattern.assign2(
                scope,
                true,
                node.handler.param,
                Scope.error(scope))),
            Build.Block(
              Scope.BLOCK(
                scope,
                identifiers1,
                identifiers2,
                (scope) => Lexic.FlatMap(
                  lexic,
                  labels,
                  [],
                  (lexic, node) => Visit.Noode(node, scope, lexic, [])))))))),
    block(
      node.finalizer,
      scope,
      Lexic.SetLastFalse(lexic),
      labels)));

exports.DebuggerStatement = (node, scope, lexic, labels) => Build.Debugger();

exports.VariableDeclaration = (node, scope, lexic, labels) => declaration(node, scope);

exports.FunctionDeclaration = (node, scope, lexic, labels) => Build.Expression(
  Scope.write(
    scope,
    node.id.name,
    Closure.FunctionExpression(node, scope, false, null)));

exports.WhileStatement = (node, scope, lexic, labels1) => (
  labels = ArrayLite.concat(labels1, [null]),
  ArrayLite.concat(
    completion(scope, lexic),
    Build.While(
      Visit.node(node.test, scope, false, null),
      extract(
        node.body,
        [],
        (nodes, labels2, identifiers1, identifiers2) => Scope.BLOCK(
          scope,
          ArrayLite.concat(labels1, labels2),
          identifiers1,
          identifiers2,
          (scope) => Lexic.Nodes(lexic, labels1, labels2, nodes, scope))))));

exports.DoWhileStatement = (node, scope, lexic, labels1) => (
  labels = ArrayLite.concat(labels1, [null]),
  ArrayLite.concat(
    completion(scope, lexic),
    Scope.Cache(
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
        extract(
          node.body,
          [],
          (nodes, labels2, identifiers1, identifiers2) => Scope.BLOCK(
            scope,
            ArrayLite.concat(labels1, labels2),
            identifiers1,
            identifiers2,
            (scope) => Lexic.Nodes(lexic, labels1, labels2, nodes, scope)))))));

exports.ForStatement = (node, scope, lexic, labels1) => (
  labels = ArrayLite.concat(labels1, [null]),
  ArrayLite.concat(
    completion(scope, lexic),
    (
      (
        (closure) => (
          node.init ?
          (
            node.init.type === "VariableDeclaration" ?
            (
              node.init.kind === "var" ?
              ArrayLite.concat(
                declaration(node.init, scope),
                closure(scope)) :
              Build.Block(
                Scope.BLOCK(
                  scope,
                  [],
                  (
                    node.init.kind === "let" ?
                    ArrayLite.flatMap(
                      node.init.declarations,
                      (declaration) => Pattern.$Identifiers(declaration.id)) :
                    []),
                  (
                    node.init.kind === "const" ?
                    ArrayLite.flatMap(
                      node.init.declarations,
                      (declaration) => Pattern.$Identifiers(declaration.id)) :
                    []),
                  (scope) => ArrayLite.concat(
                    declaration(node.init, scope),
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
          extract(
            node.body,
            [],
            (nodes, labels2, identifiers1, identifiers2) => (
              node.update ?
              Scope.BLOCK(
                scope,
                ArrayLite.concat(labels1, labels2),
                [],
                [],
                (scope) => ArrayLite.concat(
                  Build.Block(
                    Scope.BLOCK(
                      scope,
                      [],
                      identifiers1,
                      identifiers2,
                      (scope) => Lexic.FlatMap(
                        lexic,
                        labels1,
                        labels2,
                        nodes,
                        (lexic, node) => Visit.Node(node, scope, lexic, [])))),
                  // No completion:
                  // ==============
                  // for (let index = 0; index < 10; index++) {}
                  // undefined
                  Build.Expression(
                    Visit.node(node.update, scope, true, null)))) :
              Scope.BLOCK(
                scope,
                ArrayLite.concat(labels1, labels2),
                identifiers1,
                identifiers2,
                (scope) => Lexic.FlatMap(
                  lexic,
                  labels1,
                  labels2,
                  nodes,
                  (lexic, node) => Visit.Node(node, scope, lexic, []))))))))));

exports.ForInStatement = (node, scope, lexic, labels1) => (
  labels = ArrayLite.concat(labels1, [null]),
  ArrayLite.concat(
    completion(scope, lexic),
    Build.Block(
      Scope.BLOCK(
        scope,
        [],
        (
          (
            node.left.type === "VariableDeclaration" &&
            node.left.kind === "let") ?
          Pattern.$Identifiers(node.left.declarations[0].id) :
          []),
        (
          (
            node.left.type === "VariableDeclaration" &&
            node.left.kind === "const") ?
          Pattern.$Identifiers(node.left.declarations[0].id) :
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
                  Object.obj(
                    () => Scope.get(scope, cache1)))),
              Build.While(
                Scope.get(scope, cache1),
                Scope.BLOCK(
                  scope,
                  [],
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
                    extract(
                      node.body,
                      [],
                      (nodes, labels2) => Scope.BLOCK(
                        scope,
                        ArrayLite.concat(labels1, labels2, identifiers1, identifiers2),
                        (
                          (
                            node.left.type === "VariableDeclaration" &&
                            node.left.kind === "let") ?
                          Pattern.$Identifiers(node.left.declarations[0].id) :
                          []),
                        (
                          (
                            node.left.type === "VariableDeclaration" &&
                            node.left.kind === "const") ?
                          Pattern.$Identifiers(node.left.declarations[0].id) :
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
                              Object.get(
                                Scope.get(scope, cache2),
                                Scope.get(scope, cache3)))),
                          Build.Block(
                            Scope.BLOCK(
                              scope,
                              [],
                              identifiers1,
                              identifiers2,
                              (scope) => Lexic.FlatMap(
                                lexic,
                                labels1,
                                labels2,
                                nodes,
                                (lexic, node) => Visit.Node(node, scope, lexic, [])))),
                          Build.Expression(
                            Scope.set(
                              scope,
                              cache3,
                              Build.binary(
                                "+",
                                Scope.get(scope, cache3),
                                Build.primitive(1)))))))))))))))));

exports.ForOfStatement = (node, scope, lexic, labels1) => (
  labels = ArrayLite.concat(labels1, [null]),
  ArrayLite.concat(
    completion(scope, lexic),
    Build.Block(
      Scope.BLOCK(
        scope,
        [],
        (
          (
            node.left.type === "VariableDeclaration" &&
            node.left.kind === "let") ?
          Pattern.$Identifiers(node.left.declarations[0].id) :
          []),
        (
          (
            node.left.type === "VariableDeclaration" &&
            node.left.kind === "const") ?
          Pattern.$Identifiers(node.left.declarations[0].id) :
          []),
        (scope) => Scope.Cache(
          scope,
          "StatementForOfRight",
          Visit.node(node.right, scope, false, null),
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
              extract(
                node.body,
                [],
                (nodes, labels2, identifiers1, identifiers2) => Scope.BLOCK(
                  scope,
                  ArrayLite.concat(labels1, labels2),
                  (
                    (
                      node.left.type === "VariableDeclaration" &&
                      node.left.kind === "let") ?
                    Pattern.$Identifiers(node.left.declarations[0].id) :
                    []),
                  (
                    (
                      node.left.type === "VariableDeclaration" &&
                      node.left.kind === "const") ?
                    Pattern.$Identifiers(node.left.declarations[0].id) :
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
                      Scope.BLOCK(
                        scope,
                        [],
                        identifiers1,
                        identifiers2,
                        (scope) => Lexic.FlatMap(
                          lexic,
                          labels1,
                          labels2,
                          nodes,
                          (lexic, node) => Visit.Node(node, scope, lexic, [])))))))))))))));
