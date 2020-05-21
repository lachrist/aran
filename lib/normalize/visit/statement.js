
const ArrayLite = require("array-lite");

const Build = require("../build.js");
const Scope = require("../scope");
const Object = require("../object.js");
const Visit = require("./index.js");
const Lexic = require("../lexic.js");

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

exports.Statement = (statement, scope, lexic, labels) => State.visit(
  statement,
  () => visitors[statement.type](statement, scope, lexic, labels));

const visitors = {__proto__:null};

visitors.EmptyStatement = ({}, scope, lexic, labels) => [];

visitors.BlockStatement = ({body:statements}, scope, lexic, labels) => Build.Block(
  labels,
  Scope.BLOCK(
    statements,
    false,
    Collect.Lets(statements),
    Collect.Consts(statements),
    (scope) => Block.Body(statements, scope, lexic)));

visitors.ExpressionStatement = ({expression:expression}, scope, lexic, labels) => Build.Expression(
  Visit.node(expression, scope, true, null));

visitors.LabeledStatement = ({label:{name:label}, body:statement}, scope, lexic, labels) => Visit.Node(
  statement,
  scope,
  lexic,
  (
    ArrayLite.includes(labels, label) ?
    labels :
    ArrayLite.concat(labels, [label])));

visitors.SwitchStatement = (node, scope, lexic, labels) => Scope.Cache(
  scope,
  "StatementSwitchDiscriminant",
  (
    node.discriminant.type === "Literal" ?
    node.discriminant.value :
    Visit.node(node.discriminant, scope, false, null)),
  (cache1) => Scope.Cache(
    scope,
    "StatementSwitchMatched",
    Build.primitive(false),
    (cache2) => Build.Block(
      (
        ArrayLite.includes(labels, null) ?
        labels :
        ArratLite.concat(labels, [null])),
      Scope.BLOCK(
        scope,
        false,
        Collect.Lets(
          ArrayLite.flatMap(
            node.case,
            (node) => node.consequent)),
        Collect.Consts(
          ArrayLite.flatMap(
            node.case,
            (node) => node.consequent)),
        (scope) => Block.Body(
          node.cases,
          scope,
          Lexic.SetSwitch(cache1, cache2))))));

visitors.SwitchCase = (node, scope, lexic, labels) => Build.If(
  labels,
  Build.conditional(
    Scope.get(
      scope,
      Lexic.GetSwitchMatchedCache(lexic)),
    Build.primitive(true),
    (
      node.test === null ?
      Build.sequence(
        Scope.set(
          scope,
          lexic.SwitchMatchedCache,
          Build.primitive(true)),
        Build.primitive(true)) :
      Build.conditional(
        Build.binary(
          "===",
          Scope.get(
            scope,
            Lexic.GetSwitchDiscriminantCache(lexic)),
          Visit.node(node.test, scope, false, null)),
        Build.sequence(
          Scope.set(
            scope,
            Lexic.GetSwitchMatchedCache(lexic),
            Build.primitive(true)),
          Build.primitive(true)),
        Build.primitive(false)))),
  (
    (
      node.consequent.length === 1 &&
      node.consequent[0].type === "BlockStatement") ?
    Scope.BLOCK(
      scope,
      false,
      Collect.Lets(node.consequent[0].body),
      Collect.Consts(node.consequent[0].body),
      (scope) => Block.Body(node.consequent[0].body, scope, lexic)) :
    Scope.BLOCK(
      scope,
      false,
      [],
      [],
      (scope) => Block.Body(
        ArrayLite.filter(
          node.consequent,
          (node) => node.type !== "FunctionDeclaration"),
        scope,
        lexic))),
  Scope.BLOCK(
    scope,
    false,
    [],
    [],
    (scope) => []));

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
visitors.WithStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
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
      Build.Block(
        labels,
        Scope.WITH(
          scope,
          cache,
          Collect.Lets(_nodes),
          Collect.Consts(_nodes),
          (scope) => Block.Body(_nodes, scope, lexic))))));

visitors.IfStatement = (node, scope, lexic, labels, _nodes1, _nodes2) => (
  _nodes1 = (
    node.consequent.type === "BlockStatement" ?
    node.consequent.body :
    [node.consequent]),
  _nodes2 = (
    node.alternate === null ?
    [] :
    (
      node.alternate.type === "BlockStatement" ?
      node.alternate.body :
      [node.alternate])),
  Build.If(
    labels,
    Visit.node(node.test, scope, false, null),
    Scope.BLOCK(
      scope,
      false,
      Collect.Lets(_nodes1),
      Collect.Consts(_nodes1),
      (scope) => Block.Body(_nodes1, scope, lexic)),
    Scope.BLOCK(
      scope,
      false,
      Collect.Lets(_nodes2),
      Collect.Consts(_nodes2),
      (scope) => Block.Body(_nodes2, scope, lexic))));

visitors.BreakStatement = (node, scope, lexic, labels, _label) => (
  _label = (
    node.label === null ?
    null :
    node.label.name),
  (
    ArrayLite.includes(labels, _label) ?
    [] :
    Build.Break(_label)));

visitors.ContinueStatement = (node, scope, lexic, labels, _label) => (
  _label = (
    node.label === null ?
    null :
    node.label.name),
  (
    ArrayLite.includes(labels, _label) ?
    (
      (
        () => { throw new global_Error("Break label used as continue label") })
      ()) :
    Build.Continue(_label)));

visitors.ReturnStatement = (node, scope, lexic, labels) => Build.Return(
  (
    Lexic.IsFunction(scope) ?
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

visitors.ThrowStatement = (node, scope, lexic, labels) => Build.Expression(
  Build.throw(
    Visit.node(node.argument, scope, false, null)));

visitors.TryStatement = (node, scope, lexic, labels) => Build.Try(
  labels,
  Scope.BLOCK(
    scope,
    false,
    Collect.Lets(node.block.body),
    Collect.Consts(node.block.body),
    (scope) => Block.Body(node.block.body, scope, lexic)),
  (
    node.handler === null ?
    Scope.BLOCK(
      scope,
      false,
      [],
      [],
      (scope) => []) :
    Scope.BLOCK(
      scope,
      false,
      ArrayLite.concat(
        (
          node.handler.param === null ?
          [] :
          Collect.Pattern(node.handler.param)),
        Collect.Lets(node.handler.body.body)),
      Collect.Consts(node.handler.body.body),
      (scope) => ArrayLite.concat(
        // Completion reset on catch:
        // ==========================
        // eval("try { 'foo'; throw 'bar'; } catch (error) {}")
        // undefined
        (
          Lexic.IsProgram(lexic) ?
          Build.Expression(
            Build.write(
              scope,
              Lexic.GetCompletion(lexic),
              Build.primitive(void 0))) :
          []),
        Build.Expression(
          Pattern.assign2(
            scope,
            true,
            node.handler.param,
            Scope.error())),
        Block.Body(node.handler.body.body, scope, lexic)))),
  (
    node.finalizer === null ?
    Scope.BLOCK(
      scope,
      false,
      [],
      [],
      (scope) => []) :
    Scope.BLOCK(
      scope,
      false,
      Collect.Lets(node.finalizer.body),
      Collect.Consts(node.finalizer.body),
      (scope) => Block.Body(node.finalizer.body, scope, lexic))));

visitors.DebuggerStatement = (node, scope, lexic, labels) => Build.Debugger();

visitors.VariableDeclaration = (node, scope, lexic, labels) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Build.Expression(
    Pattern.assign3(
      scope,
      node.kind !== "var",
      declaration.id,
      declaration.init)));

visitors.FunctionDeclaration = (node, scope, lexic, labels) => [];

visitors.ClassDeclaration = ({id:{name:estree_identifier}, superClass:estree_nullable_expression, body:estree_class_body}, scope, dropped, cache) => Throw("Unfortunately, Aran does not support class declarations (yet)...");

visitors.WhileStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  Build.While(
    (
      ArrayLite.includes(labels, null) ?
      labels :
      ArrayLite.concat(labels, [null])),
    Visit.node(node.test, scope, false, null),
    Scope.BLOCK(
      scope,
      false,
      Collect.Lets(_nodes),
      Collect.Consts(_nodes),
      (scope) => Block.Body(_nodes, scope, lexic))));

visitors.DoWhileStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  Scope.Cache(
    scope,
    "StatementDoWhileEntrance",
    Build.primitive(true),
    (cache) => Build.While(
      (
        ArrayLite.includes(labels, null) ?
        labels :
        ArrayLite.concat(labels, [null])),
      Build.conditional(
        Scope.get(scope, cache),
        Build.sequence(
          Scope.set(
            scope,
            cache,
            Build.primitive(false)),
          Build.primitive(true)),
        Visit.node(node.test, scope, false, null)),
      Scope.BLOCK(
        scope,
        false,
        Collect.Lets(_nodes),
        Collect.Consts(_nodes),
        (scope) => Block.Body(_nodes, scope, lexic)))));

visitors.ForStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  (
    (
      (closure) => (
        node.init ?
        (
          node.init.type === "VariableDeclaration" ?
          (
            node.init.kind === "var" ?
            ArrayLite.concat(
              ArrayLite.flatMap(
                node.init.declarations,
                (declaration) => Build.Expression(
                  Pattern.assign3(
                    scope,
                    false,
                    declaration.id,
                    declaration.init))),
              closure(scope)) :
            Build.Block(
              [],
              Scope.BLOCK(
                scope,
                false,
                Collect.Lets([node.init]),
                Collect.Consts([node.init]),
                (scope) => ArrayLite.concat(
                  ArrayLite.flatMap(
                    node.init.declarations,
                    (declaration) => Build.Expression(
                      Pattern.assign3(
                        scope,
                        true,
                        declaration.id,
                        declaration.init))),
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
          ArrayLite.includes(labels, null) ?
          labels :
          ArrayLite.concat(labels, [null])),
        (
          node.test ?
          Visit.node(node.test, scope, false, null) :
          Build.primitive(true)),
        (
          node.update === null ?
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets(_nodes),
            Collect.Consts(_nodes),
            (scope) => Block.Body(_nodes, scope, lexic)) :
          Scope.BLOCK(
            scope,
            false,
            [],
            [],
            (scope) => ArrayLite.concat(
              Build.Block(
                [],
                Scope.BLOCK(
                  scope,
                  false,
                  Collect.Lets(_nodes),
                  Collect.Consts(_nodes),
                  (scope) => Block.Body(_nodes, scope, lexic))),
              // No completion:
              // ==============
              // for (let index = 0; index < 10; index++) {}
              // undefined
              Build.Expression(
                Visit.node(node.update, scope, true, null)))))))));


// for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}

// Variables in the left hand side belongs to the body of the while but still
// they must be shadowed to the right-hand side.
//
// > for (const x in {a:x, b:2}) { console.log(x) }
// Thrown:
// ReferenceError: Cannot access 'x' before initialization
visitors.ForInStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  (
    (
      (closure) => (
        (
          node.left.type === "VariableDeclaration" &&
          node.left.kind !== "var") ?
        Build.Block(
          [],
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets([node.left]),
            Collect.Consts([node.left]),
            closure)) :
        closure(scope)))
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
          // We cannot use Object but the get/set convertion instead:
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
            [],
            Scope.get(scope, cache1),
            Scope.BLOCK(
              scope,
              false,
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
                (
                  ArrayLite.includes(labels, null) ?
                  ArrayLite.concat(labels, [null]) :
                  labels),
                Build.binary(
                  "<",
                  Scope.get(scope, cache3),
                  Scope.get(scope, cache4)),
                Scope.BLOCK(
                  scope,
                  false,
                  (
                    node.left.type === "VariableDeclaration" ?
                    Collect.Lets([node.left]) :
                    []),
                  (
                    node.left.type === "VariableDeclaration" ?
                    Collect.Consts([node.left]) :
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
                      [],
                      Scope.BLOCK(
                        scope,
                        false,
                        Collect.Lets(_nodes),
                        Collect.Consts(_nodes),
                        (scope) => Block.Body(_nodes, scope, lexic))),
                    Build.Expression(
                      Scope.set(
                        scope,
                        cache3,
                        Build.binary(
                          "+",
                          Scope.get(scope, cache3),
                          Build.primitive(1))))))))))))));

// TODO Check await
// extend interface ForOfStatement {
//   await: boolean;
// }
visitors.ForOfStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  (
    (
      (closure) => (
        (
          node.left.type === "VariableDeclaration" &&
          node.left.kind !== "var") ?
        Build.Block(
          [],
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets([node.left]),
            Collect.Consts([node.left]),
            closure)) :
        closure(scope)))
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
          Build.primitive(void 0),
          (cache3) => Build.While(
            (
              ArrayLite.includes(labels, null) ?
              ArrayLite.concat(labels, [null]) :
              labels),
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
            // The left pattern does not resides in the body's scope:
            // > let z = 1; for (let [x,y=(console.log("foo"), z)] in {a:1, b:2}) { console.log("bar"); let z }
            // foo
            // bar
            // foo
            // bar
            Scope.BLOCK(
              scope,
              false,
              (
                node.left.type === "VariableDeclaration" ?
                Collect.Lets([node.left]) :
                []),
              (
                node.left.type === "VariableDeclaration" ?
                Collect.Consts([node.left]) :
                []),
              (scope) => ArrayLite.concat(
                Build.Expression(
                  Pattern.assign2(
                    scope,
                    (
                      node.left.type === "VariableDeclaration" &&
                      node.left.kind !== "var"),
                    (
                      node.left.type === "VariableDeclaration" ?
                      node.left.declarations[0].id :
                      node.left),
                    Object.get(
                      Scope.get(scope, cache3),
                      Build.primitive("value")))),
                Build.Block(
                  [],
                  Scope.BLOCK(
                    scope,
                    false,
                    Collect.Lets(_nodes),
                    Collect.Consts(_nodes),
                    (scope) => Block.Body(_nodes, scope, lexic)))))))))));
