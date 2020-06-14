"use strict";

const ArrayLite = require("array-lite");

const Tree = require("../tree.js");
const Scope = require("../scope");
const Object = require("../object.js");
const Expression = require("./expression.js");
const Block = require("./block.js");
const State = require("../state.js");
const Pattern = require("./pattern.js");
const Completion = require("../completion.js");
const Statement = exports;

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

exports.Visit = (scope, node, completion, labels) => State._visit(node, [scope, node, completion, labels], visit);

const visit = (scope, node, completion, labels) => (
  node.type === "ExpressionStatement" ?
  visitors.ExpressionStatement(scope, node, completion, labels) :
  (
    Completion._is_last(completion) ?
    Tree.Bundle(
      [
        Tree.Lift(
          Scope.set(
            scope,
            Completion._get_box(completion),
            Tree.primitive(void 0))),
        visitors[node.type](scope, node, completion, labels)]) :
    visitors[node.type](scope, node, completion, labels)));

const visitors = {__proto__:null};

// type Node = ExpressionStatement ... etc
visitors.ExpressionStatement = (scope, node, completion, labels) => Tree.Lift(
  (
    Completion._is_last(completion) ?
    Scope.set(
      scope,
      Completion._get_box(completion),
      Expression.visit(scope, node.expression, true, null)) :
    Expression.visit(scope, node.expression, true, null)));

visitors.EmptyStatement = (scope, node, completion, labels) => Tree.Bundle([]);

visitors.BlockStatement = (scope, node, completion, labels) => Tree.Lone(
  labels,
  Block.REGULAR(scope, node.body, completion));

visitors.LabeledStatement = (scope, node, completion, labels) => Statement.Visit(
  scope,
  node.body,
  Completion._register_label(completion, node.label.name),
  ArrayLite.add(labels, node.label.name));

visitors.SwitchStatement = (scope, node, completion, labels) => Scope.Box(
  scope,
  "StatementSwitchDiscriminant",
  (
    node.discriminant.type === "Literal" ?
    node.discriminant.value :
    Visit.node(node.discriminant, scope, false, null)),
  (discriminant_box) => Scope.Box(
    scope,
    "StatementSwitchMatched",
    Tree.primitive(false),
    (matched_box) => Tree.Lone(
      ArrayLite.add(labels, null),
      Block.SWITCH(scope, node.cases, completion, discriminant_box, matched_box))));

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
visitors.WithStatement = (scope, node, completion, labels) => Scope.Box(
  scope,
  "StatementWithFrame",
  Visit.node(node.object, scope, false, null),
  (frame_box) => ArrayLite.concat(
    Tree.Expression(
      Scope.set(
        scope,
        frame_box,
        Object.obj(
          () => Scope.get(scope, frame_box)))),
    Scope.Box(
      scope,
      "StatementWithUnscopables",
      Tree.primitive(void 0),
      (unscopables_box) => Tree.Lone(
        labels,
        block(
          (
            node.body.type === "BlockStatement" ?
            node.body.body :
            [node.body]),
          Scope._extend_dynamic(scope, {frame_box, unscopables_box}),
          completion)))));

visitors.IfStatement = (scope, node, completion, labels) => Tree.If(
  labels,
  Visit.node(node.test, scope, false, null),
  block(
    (
      node.consequent.type === "BlockStatement" ?
      node.consequent.body :
      [node.consequent]),
    scope,
    completion),
  block(
    (
      node.alternate === null ?
      [] :
      (
        node.alternate.type === "BlockStatement" ?
        node.alternate.body :
        [node.alternate])),
    scope,
    completion));

visitors.BreakStatement = (scope, node, completion, labels) => (
  _label = (
    node.label === null ?
    null :
    node.label.name),
  (
    ArrayLite.includes(labels, _label) ?
    [] :
    Tree.Break(_label)));

visitors.ContinueStatement = (node, scope, completion, labels, _label) => (
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
    Tree.Continue(_label)));

visitors.ReturnStatement = (scope, node, completion, labels) => Tree.Return(
  (
    Lexic.IsFunction(scope) ?
    (
      node.argument ?
      Scope.box(
        scope,
        "StatementReturnArgument",
        Visit.node(node.argument, scope, false, null),
        (box) => Tree.conditional(
          Scope.read(scope, "new.target"),
          Tree.conditional(
            Tree.binary(
              "===",
              Tree.unary(
                "typeof",
                Scope.get(scope, box)),
              Tree.primitive("object")),
            Tree.conditional(
              Scope.get(scope, box),
              Scope.get(scope, box),
              Scope.read(scope, "this")),
            Tree.conditional(
              Tree.binary(
                "===",
                Tree.unary(
                  "typeof",
                  Scope.get(scope, box)),
                Tree.primitive("function")),
              Scope.get(scope, box),
              Scope.read(scope, "this"))),
          Scope.get(scope, box))) :
      Tree.conditional(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Tree.primitive(void 0))) :
    (
      node.argument ?
      Visit.node(node.argument, scope, "") :
      Tree.primitive(void 0))));

visitors.ThrowStatement = (scope, node, completion, labels) => Tree.Expression(
  Tree.throw(
    Visit.node(node.argument, scope, false, null)));

visitors.TryStatement = (scope, node, completion, labels) => Tree.Try(
  labels,
  Scope.BLOCK(
    scope,
    false,
    Collect.Lets(node.block.body),
    Collect.Consts(node.block.body),
    (scope) => Block.Body(node.block.body, scope, completion)),
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
          Lexic.IsProgram(completion) ?
          Tree.Expression(
            Tree.write(
              scope,
              Lexic.GetCompletion(completion),
              Tree.primitive(void 0))) :
          []),
        Tree.Expression(
          Pattern.assign2(
            scope,
            true,
            node.handler.param,
            Scope.error())),
        Block.Body(node.handler.body.body, scope, completion)))),
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
      (scope) => Block.Body(node.finalizer.body, scope, completion))));

visitors.DebuggerStatement = (scope, node, completion, labels) => Tree.Debugger();

visitors.VariableDeclaration = (scope, node, completion, labels) => Tree.Bundle(
  ArrayLite.map(
    node.declarations,
    (declaration) => Tree.Lift(
      Pattern.assign(
        scope,
        declaration.id,
        (
          declaration.init === null ?
          Tree.primitive(void 0) :
          Expression.visit(scope, declaration.init, null, false)),
        node.kind !== "var"))));

visitors.FunctionDeclaration = (scope, node, completion, labels) => Tree.Lift(
  Scope.write(
    scope,
    node.id.name,
    Closure.function(node, scope, false, null)));

visitors.ClassDeclaration = (scope, node, completion, labels) => Tree.Lift(
  Scope.write(
    scope,
    node.id.name,
    Closure.class(node, scope, false, null)));

visitors.WhileStatement = (node, scope, completion, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  Tree.While(
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
      (scope) => Block.Body(_nodes, scope, completion))));

visitors.DoWhileStatement = (node, scope, completion, labels, _nodes) => (
  _nodes = (
    node.body.type === "BlockStatement" ?
    node.body.body :
    [node.body]),
  Scope.Box(
    scope,
    "StatementDoWhileEntrance",
    Tree.primitive(true),
    (box) => Tree.While(
      (
        ArrayLite.includes(labels, null) ?
        labels :
        ArrayLite.concat(labels, [null])),
      Tree.conditional(
        Scope.get(scope, box),
        Tree.sequence(
          Scope.set(
            scope,
            box,
            Tree.primitive(false)),
          Tree.primitive(true)),
        Visit.node(node.test, scope, false, null)),
      Scope.BLOCK(
        scope,
        false,
        Collect.Lets(_nodes),
        Collect.Consts(_nodes),
        (scope) => Block.Body(_nodes, scope, completion)))));

visitors.ForStatement = (node, scope, completion, labels, _nodes) => (
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
                (declaration) => Tree.Expression(
                  Pattern.assign3(
                    scope,
                    false,
                    declaration.id,
                    declaration.init))),
              closure(scope)) :
            Tree.Block(
              [],
              Scope.BLOCK(
                scope,
                false,
                Collect.Lets([node.init]),
                Collect.Consts([node.init]),
                (scope) => ArrayLite.concat(
                  ArrayLite.flatMap(
                    node.init.declarations,
                    (declaration) => Tree.Expression(
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
            Tree.Expression(
              Visit.node(node.init, scope, true, null)),
            closure(scope))) :
        closure(scope)))
    (
      (scope) => Tree.While(
        (
          ArrayLite.includes(labels, null) ?
          labels :
          ArrayLite.concat(labels, [null])),
        (
          node.test ?
          Visit.node(node.test, scope, false, null) :
          Tree.primitive(true)),
        (
          node.update === null ?
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets(_nodes),
            Collect.Consts(_nodes),
            (scope) => Block.Body(_nodes, scope, completion)) :
          Scope.BLOCK(
            scope,
            false,
            [],
            [],
            (scope) => ArrayLite.concat(
              Tree.Block(
                [],
                Scope.BLOCK(
                  scope,
                  false,
                  Collect.Lets(_nodes),
                  Collect.Consts(_nodes),
                  (scope) => Block.Body(_nodes, scope, completion))),
              // No completion:
              // ==============
              // for (let index = 0; index < 10; index++) {}
              // undefined
              Tree.Expression(
                Visit.node(node.update, scope, true, null)))))))));


// for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}

// Variables in the left hand side belongs to the body of the while but still
// they must be shadowed to the right-hand side.
//
// > for (const x in {a:x, b:2}) { console.log(x) }
// Thrown:
// ReferenceError: Cannot access 'x' before initialization
visitors.ForInStatement = (node, scope, completion, labels, _nodes) => (
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
        Tree.Block(
          [],
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets([node.left]),
            Collect.Consts([node.left]),
            closure)) :
        closure(scope)))
    (
      (scope) => Scope.Box(
        scope,
        "StatementForInRight",
        Visit.node(node.right, scope, false, null),
        (box1) => Scope.Box(
          scope,
          "StatementForInKeys",
          Tree.apply(
            Tree.builtin("Array.of"),
            Tree.primitive(void 0),
            []),
          (box2) => ArrayLite.concat(
            // We cannot use Object but the get/set convertion instead:
            // > Object.prototype.foo = "bar";
            // 'bar'
            // > for (let key in null) { console.log(key) }
            // undefined
            // > for (let key in Object(null)) { console.log(key) }
            // foo
            Tree.Expression(
              Scope.set(
                scope,
                box1,
                Object.obj(
                  () => Scope.get(scope, box1)))),
            Tree.While(
              [],
              Scope.get(scope, box1),
              Scope.BLOCK(
                scope,
                false,
                [],
                [],
                (scope) => ArrayLite.concat(
                  Tree.Expression(
                    Scope.set(
                      scope,
                      box2,
                      Tree.apply(
                        Tree.builtin("Array.prototype.concat"),
                        Scope.read(scope, box2),
                        [
                          Tree.apply(
                            Tree.builtin("Object.keys"),
                            Tree.primitive(void 0),
                            [
                              Scope.read(scope, box1)])]))),
                  Scope.Expression(
                    Scope.set(
                      scope,
                      box1,
                      Tree.apply(
                        Tree.builtin("Reflect.getPrototypeOf"),
                        Tree.primitive(void 0),
                        [
                          Scope.get(scope, box1)])))))),
            Scope.Box(
              scope,
              "StatementForInIndex",
              Tree.primitive(0),
              (box3) => Scope.Box(
                scope,
                "StatementForInLength",
                Object.get(
                  Scope.get(scope, box2),
                  Tree.primitive("length")),
                (box4) => Tree.While(
                  (
                    ArrayLite.includes(labels, null) ?
                    ArrayLite.concat(labels, [null]) :
                    labels),
                  Tree.binary(
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
                      Tree.Expression(
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
                      Tree.Block(
                        [],
                        Scope.BLOCK(
                          scope,
                          false,
                          Collect.Lets(_nodes),
                          Collect.Consts(_nodes),
                          (scope) => Block.Body(_nodes, scope, completion))),
                      Tree.Expression(
                        Scope.set(
                          scope,
                          box3,
                          Tree.binary(
                            "+",
                            Scope.get(scope, box3),
                            Tree.primitive(1)))))))))))))));

// TODO Check await
// extend interface ForOfStatement {
//   await: boolean;
// }
visitors.ForOfStatement = (node, scope, completion, labels, _nodes) => (
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
        Tree.Block(
          [],
          Scope.BLOCK(
            scope,
            false,
            Collect.Lets([node.left]),
            Collect.Consts([node.left]),
            closure)) :
        closure(scope)))
    (
      (scope) => Scope.Box(
        scope,
        "StatementForOfRight",
        Visit.node(node.right, scope, false, null),
        (box1) => Scope.Box(
          scope,
          "StatementForOfIterator",
          Tree.apply(
            Object.get(
              Object.obj(
                () => Scope.get(scope, box1)),
              Tree.builtin("Symbol.iterator")),
            Scope.get(scope, box1),
            []),
          (box2) => Scope.Box(
            scope,
            "StatementForOfStep",
            Tree.primitive(void 0),
            (box3) => Tree.While(
              (
                ArrayLite.includes(labels, null) ?
                ArrayLite.concat(labels, [null]) :
                labels),
              Tree.sequence(
                Scope.set(
                  scope,
                  box3,
                  Tree.apply(
                    Object.get(
                      Scope.get(box2),
                      Tree.primitive("next")),
                    Scope.get(box2),
                    [])),
                Tree.unary(
                  "!",
                  Object.get(
                    Scope.get(box3),
                    Tree.primitive("done")))),
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
                  Tree.Expression(
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
                        Tree.primitive("value")))),
                  Tree.Block(
                    [],
                    Scope.BLOCK(
                      scope,
                      false,
                      Collect.Lets(_nodes),
                      Collect.Consts(_nodes),
                      (scope) => Block.Body(_nodes, scope, completion))))))))))));
