
const ArrayLite = require("array-lite");

const Lang = require("../build.js");
const Scope = require("../scope");
const Object = require("../object.js");
const Visit = require("./index.js");
const Lexic = require("../lexic.js");
const Expression = require("./expression.js");
const Statement = exports;

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

exports.Visit = (statement, scope, lexic, labels) => State.visit(
  statement,
  () => visitors[statement.type](statement, scope, lexic, labels));

const visitors = {__proto__:null};

// type Node = EmptyStatement
visitors.EmptyStatement = (node, scope, lexic, labels) => [];

// type Node = BlockStatement
visitors.BlockStatement = (node, scope, lexic, labels) => Lang.Lone(
  labels,
  block(node.body, scope, lexic));

visitors.ExpressionStatement = (node, scope, lexic, labels) => Lang.Lift(
  Expression.visit(node.expression, scope, true, null));

visitors.LabeledStatement = (node, scope, lexic, labels) => Statement.Visit(
  node.body,
  scope,
  Lexic._register_label(lexic, node.label.name),
  ArrayLite.add(labels, node.label.name));

visitors.SwitchStatement = (node, scope, lexic, labels) => Scope.Box(
  scope,
  "StatementSwitchDiscriminant",
  (
    node.discriminant.type === "Literal" ?
    node.discriminant.value :
    Visit.node(node.discriminant, scope, false, null)),
  (box1) => Scope.Box(
    scope,
    "StatementSwitchMatched",
    Lang.primitive(false),
    (box2) => Lang.Block(
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
          Lexic.SetSwitch(box1, box2))))));

visitors.SwitchCase = (node, scope, lexic, labels) => Lang.If(
  labels,
  Lang.conditional(
    Scope.get(
      scope,
      Lexic.GetSwitchMatchedBox(lexic)),
    Lang.primitive(true),
    (
      node.test === null ?
      Lang.sequence(
        Scope.set(
          scope,
          lexic.SwitchMatchedBox,
          Lang.primitive(true)),
        Lang.primitive(true)) :
      Lang.conditional(
        Lang.binary(
          "===",
          Scope.get(
            scope,
            Lexic.GetSwitchDiscriminantBox(lexic)),
          Visit.node(node.test, scope, false, null)),
        Lang.sequence(
          Scope.set(
            scope,
            Lexic.GetSwitchMatchedBox(lexic),
            Lang.primitive(true)),
          Lang.primitive(true)),
        Lang.primitive(false)))),
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
visitors.WithStatement = (node, scope, lexic, labels) => Scope.Box(
  scope,
  "StatementWithFrame",
  Visit.node(node.object, scope, false, null),
  (frame_box) => ArrayLite.concat(
    Lang.Expression(
      Scope.set(
        scope,
        frame_box,
        Object.obj(
          () => Scope.get(scope, frame_box)))),
    Scope.Box(
      scope,
      "StatementWithUnscopables",
      Lang.primitive(void 0),
      (unscopables_box) => Lang.Lone(
        labels,
        block(
          (
            node.body.type === "BlockStatement" ?
            node.body.body :
            [node.body]),
          Scope._extend_dynamic(scope, {frame_box, unscopables_box}),
          lexic)))));

visitors.IfStatement = (node, scope, lexic, labels) => Lang.If(
  labels,
  Visit.node(node.test, scope, false, null),
  block(
    (
      node.consequent.type === "BlockStatement" ?
      node.consequent.body :
      [node.consequent]),
    scope,
    lexic),
  block(
    (
      node.alternate === null ?
      [] :
      (
        node.alternate.type === "BlockStatement" ?
        node.alternate.body :
        [node.alternate])),
    scope,
    lexic));

visitors.BreakStatement = (node, scope, lexic, labels) => (
  _label = (
    node.label === null ?
    null :
    node.label.name),
  (
    ArrayLite.includes(labels, _label) ?
    [] :
    Lang.Break(_label)));

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
    Lang.Continue(_label)));

visitors.ReturnStatement = (node, scope, lexic, labels) => Lang.Return(
  (
    Lexic.IsFunction(scope) ?
    (
      node.argument ?
      Scope.box(
        scope,
        "StatementReturnArgument",
        Visit.node(node.argument, scope, false, null),
        (box) => Lang.conditional(
          Scope.read(scope, "new.target"),
          Lang.conditional(
            Lang.binary(
              "===",
              Lang.unary(
                "typeof",
                Scope.get(scope, box)),
              Lang.primitive("object")),
            Lang.conditional(
              Scope.get(scope, box),
              Scope.get(scope, box),
              Scope.read(scope, "this")),
            Lang.conditional(
              Lang.binary(
                "===",
                Lang.unary(
                  "typeof",
                  Scope.get(scope, box)),
                Lang.primitive("function")),
              Scope.get(scope, box),
              Scope.read(scope, "this"))),
          Scope.get(scope, box))) :
      Lang.conditional(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Lang.primitive(void 0))) :
    (
      node.argument ?
      Visit.node(node.argument, scope, "") :
      Lang.primitive(void 0))));

visitors.ThrowStatement = (node, scope, lexic, labels) => Lang.Expression(
  Lang.throw(
    Visit.node(node.argument, scope, false, null)));

visitors.TryStatement = (node, scope, lexic, labels) => Lang.Try(
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
          Lang.Expression(
            Lang.write(
              scope,
              Lexic.GetCompletion(lexic),
              Lang.primitive(void 0))) :
          []),
        Lang.Expression(
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

visitors.DebuggerStatement = (node, scope, lexic, labels) => Lang.Debugger();

visitors.VariableDeclaration = (node, scope, lexic, labels) => ArrayLite.flatMap(
  node.declarations,
  (declaration) => Lang.Expression(
    Pattern.assign3(
      scope,
      node.kind !== "var",
      declaration.id,
      declaration.init)));

visitors.FunctionDeclaration = (node, scope, lexic, labels) => Lang.Lift(
  Scope.write(
    scope,
    node.id.name,
    Closure.function(node, scope, false, null)));

visitors.ClassDeclaration = (node, scope, lexic, labels) => Lang.Lift(
  Scope.write(
    scope,
    node.id.name,
    Closure.class(node, scope, false, null)));

visitors.WhileStatement = (node, scope, lexic, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  Lang.While(
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
  Scope.Box(
    scope,
    "StatementDoWhileEntrance",
    Lang.primitive(true),
    (box) => Lang.While(
      (
        ArrayLite.includes(labels, null) ?
        labels :
        ArrayLite.concat(labels, [null])),
      Lang.conditional(
        Scope.get(scope, box),
        Lang.sequence(
          Scope.set(
            scope,
            box,
            Lang.primitive(false)),
          Lang.primitive(true)),
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
                (declaration) => Lang.Expression(
                  Pattern.assign3(
                    scope,
                    false,
                    declaration.id,
                    declaration.init))),
              closure(scope)) :
            Lang.Block(
              [],
              Scope.BLOCK(
                scope,
                false,
                Collect.Lets([node.init]),
                Collect.Consts([node.init]),
                (scope) => ArrayLite.concat(
                  ArrayLite.flatMap(
                    node.init.declarations,
                    (declaration) => Lang.Expression(
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
            Lang.Expression(
              Visit.node(node.init, scope, true, null)),
            closure(scope))) :
        closure(scope)))
    (
      (scope) => Lang.While(
        (
          ArrayLite.includes(labels, null) ?
          labels :
          ArrayLite.concat(labels, [null])),
        (
          node.test ?
          Visit.node(node.test, scope, false, null) :
          Lang.primitive(true)),
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
              Lang.Block(
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
              Lang.Expression(
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
        Lang.Block(
          [],
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets([node.left]),
            Collect.Consts([node.left]),
            closure)) :
        closure(scope)))
    (scope) => Scope.Box(
      scope,
      "StatementForInRight",
      Visit.node(node.right, scope, false, null),
      (box1) => Scope.Box(
        scope,
        "StatementForInKeys",
        Lang.apply(
          Lang.builtin("Array.of"),
          Lang.primitive(void 0),
          []),
        (box2) => ArrayLite.concat(
          // We cannot use Object but the get/set convertion instead:
          // > Object.prototype.foo = "bar";
          // 'bar'
          // > for (let key in null) { console.log(key) }
          // undefined
          // > for (let key in Object(null)) { console.log(key) }
          // foo
          Lang.Expression(
            Scope.set(
              scope,
              box1,
              Object.obj(
                () => Scope.get(scope, box1)))),
          Lang.While(
            [],
            Scope.get(scope, box1),
            Scope.BLOCK(
              scope,
              false,
              [],
              [],
              (scope) => ArrayLite.concat(
                Lang.Expression(
                  Scope.set(
                    scope,
                    box2,
                    Lang.apply(
                      Lang.builtin("Array.prototype.concat"),
                      Scope.read(scope, box2),
                      [
                        Lang.apply(
                          Lang.builtin("Object.keys"),
                          Lang.primitive(void 0),
                          [
                            Scope.read(scope, box1)])]))),
                Scope.Expression(
                  Scope.set(
                    scope,
                    box1,
                    Lang.apply(
                      Lang.builtin("Reflect.getPrototypeOf"),
                      Lang.primitive(void 0),
                      [
                        Scope.get(scope, box1)])))))),
          Scope.Box(
            scope,
            "StatementForInIndex",
            Lang.primitive(0),
            (box3) => Scope.Box(
              scope,
              "StatementForInLength",
              Object.get(
                Scope.get(scope, box2),
                Lang.primitive("length")),
              (box4) => Lang.While(
                (
                  ArrayLite.includes(labels, null) ?
                  ArrayLite.concat(labels, [null]) :
                  labels),
                Lang.binary(
                  "<",
                  Scope.get(scope, box3),
                  Scope.get(scope, box4)),
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
                    Lang.Expression(
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
                          Scope.get(scope, box2),
                          Scope.get(scope, box3)))),
                    Lang.Block(
                      [],
                      Scope.BLOCK(
                        scope,
                        false,
                        Collect.Lets(_nodes),
                        Collect.Consts(_nodes),
                        (scope) => Block.Body(_nodes, scope, lexic))),
                    Lang.Expression(
                      Scope.set(
                        scope,
                        box3,
                        Lang.binary(
                          "+",
                          Scope.get(scope, box3),
                          Lang.primitive(1))))))))))))));

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
        Lang.Block(
          [],
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets([node.left]),
            Collect.Consts([node.left]),
            closure)) :
        closure(scope)))
    (scope) => Scope.Box(
      scope,
      "StatementForOfRight",
      Visit.node(node.right, scope, false, null),
      (box1) => Scope.Box(
        scope,
        "StatementForOfIterator",
        Lang.apply(
          Object.get(
            Object.obj(
              () => Scope.get(scope, box1)),
            Lang.builtin("Symbol.iterator")),
          Scope.get(scope, box1),
          []),
        (box2) => Scope.Box(
          scope,
          "StatementForOfStep",
          Lang.primitive(void 0),
          (box3) => Lang.While(
            (
              ArrayLite.includes(labels, null) ?
              ArrayLite.concat(labels, [null]) :
              labels),
            Lang.sequence(
              Scope.set(
                scope,
                box3,
                Lang.apply(
                  Object.get(
                    Scope.get(box2),
                    Lang.primitive("next")),
                  Scope.get(box2),
                  [])),
              Lang.unary(
                "!",
                Object.get(
                  Scope.get(box3),
                  Lang.primitive("done")))),
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
                Lang.Expression(
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
                      Scope.get(scope, box3),
                      Lang.primitive("value")))),
                Lang.Block(
                  [],
                  Scope.BLOCK(
                    scope,
                    false,
                    Collect.Lets(_nodes),
                    Collect.Consts(_nodes),
                    (scope) => Block.Body(_nodes, scope, lexic)))))))))));
