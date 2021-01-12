"use strict";

const global_String = global.String;
const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Identifier = require("../../identifier.js");
const Label = require("../../label.js");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Intrinsic = require("../intrinsic.js");
const Completion = require("../completion.js");
const Query = require("../query");
const Visit = require("./index.js");

const ghostify = (variable) => global_Object_assign(
  {},
  variable,
  {ghost:true});

// Scope -> Completion -> aran.Statement -> aran.Statement
const reset_completion = (scope, completion, statement) => Tree.BundleStatement(
  ArrayLite.concat(
    (
      Completion._is_last(completion) ?
      [
        Tree.ExpressionStatement(
          Scope.set_completion(
            scope,
            Tree.PrimitiveExpression(void 0)))] :
      []),
    [statement]));

exports.Statement = (scope, node, context) => (
  context = global_Object_assign(
    {
      completion: Completion._make_empty(),
      labels: []},
    context),
  visitors[node.type](scope, node, context));

////////////
// Atomic //
////////////

const visitors = {__proto__:null};

visitors.EmptyStatement = (scope, node, context) => Tree.BundleStatement([]);

visitors.DebuggerStatement = (scope, node, context) => Tree.DebuggerStatement();

visitors.ExpressionStatement = (scope, node, context) => (
  Completion._is_last(context.completion) ?
  (
    Scope._has_completion(scope) ?
    Tree.ExpressionStatement(
      Scope.set_completion(
        scope,
        Visit.expression(scope, node.expression, null))) :
    Tree.ReturnStatement(
      Visit.expression(scope, node.expression, null))) :
  Tree.ExpressionStatement(
    Visit.expression(
      scope,
      node.expression,
      {dropped: true})));

visitors.BreakStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    Label.EmptyBreak(
      Scope._fetch_loop(scope)) :
    Label.FullBreak(node.label.name)),
  (
    ArrayLite.has(
      ArrayLite.map(context.labels, Label.FullBreak),
      _label) ?
    Tree.BundleStatement([]) :
    Tree.BreakStatement(_label)));

visitors.ContinueStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    Label.EmptyContinue(
      Scope._fetch_loop(scope)) :
    Label.FullContinue(node.label.name)),
  Throw.assert(
    !ArrayLite.has(
      ArrayLite.map(context.labels, Label.FullContinue),
      _label),
    null,
    `Break label used as continue label`),
  Tree.BreakStatement(_label));

visitors.ThrowStatement = (scope, node, context) => Tree.ExpressionStatement(
  Tree.ThrowExpression(
    Visit.expression(scope, node.argument, null)));

visitors.ReturnStatement = (scope, node, context) => Tree.ReturnStatement(
  (
    Scope._fetch_sort(scope) === "arrow" ||
    Scope._fetch_sort(scope) === "method") ?
  (
    node.argument === null ?
    Tree.PrimitiveExpression(void 0) :
    Visit.expression(scope, node.argument, null)) :
  (
    node.argument === null ?
    (
      Scope._fetch_sort(scope) === "function" ?
      Tree.ConditionalExpression(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Tree.PrimitiveExpression(void 0)) :
      // Early syntax error prevent return in top level
      // console.assert(Scope._fetch_sort(scope) === "constructor" || Scope._fetch_sort(scope) === "derived-constructor")
      Scope.read(scope, "this")) :
    Scope.box(
      scope,
      false,
      "StatementReturnArgument",
      Visit.expression(scope, node.argument, null),
      (box, _expression) => (
        _expression = Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Tree.UnaryExpression(
              "typeof",
              Scope.get(scope, box)),
            Tree.PrimitiveExpression("object")),
          Scope.get(scope, box),
          Tree.BinaryExpression(
            "===",
            Tree.UnaryExpression(
              "typeof",
              Scope.get(scope, box)),
            Tree.PrimitiveExpression("function"))),
        (
          Scope._fetch_sort(scope) === "function" ?
          Tree.ConditionalExpression(
            Scope.read(scope, "new.target"),
            Tree.ConditionalExpression(
              _expression,
              Scope.get(scope, box),
              Scope.read(scope, "this")),
            Scope.get(scope, box)) :
          (
            Scope._fetch_sort(scope) === "derived-constructor" ?
            Tree.ConditionalExpression(
              _expression,
              Scope.get(scope, box),
              Tree.ConditionalExpression(
                Tree.BinaryExpression(
                  "===",
                  Scope.get(scope, box),
                  Tree.PrimitiveExpression(void 0)),
                Scope.read(scope, "this"),
                Intrinsic.throw_type_error("Derived constructors may only return an object or undefined"))) :
            // console.assert(Scope._fetch_sort(scope) === "constructor")
            Tree.ConditionalExpression(
              _expression,
              Scope.get(scope, box),
              Scope.read(scope, "this"))))))));

/////////////////
// Declaration //
/////////////////

exports.Declarator = (scope, node, context) => (
  Throw.assert(node.type === "VariableDeclarator", null, `Invalid Declarator node`),
  Visit._pattern(
    scope,
    node.id,
    {
      kind: context.kind,
      expression: (
        node.init === null ?
        Tree.PrimitiveExpression(void 0) :
        (
          (
            node.id.type === "Identifier" &&
            (
              node.init.type === "ArrowFunctionExpression" ||
              node.init.type === "FunctionExpression")) ?
          Scope.box(
            scope,
            false,
            "name",
            Tree.PrimitiveExpression(node.id.name),
            (box) => Visit.closure(
              scope,
              node.init,
              {name:box})) :
          Visit.expression(scope, node.init, null)))}));

visitors.VariableDeclaration = (scope, parent, context) => Tree.BundleStatement(
  ArrayLite.map(
    parent.declarations,
    (child) => Visit.Declarator(
      scope,
      child,
      {kind:parent.kind})));

visitors.ClassDeclaration = (scope, node, context) => Scope.Initialize(
  scope,
  "class",
  node.id.name,
  Visit.class(
    scope,
    node,
    {
      __proto__: null,
      visited: true}));

visitors.FunctionDeclaration = (scope, node, context) => Tree.BundleStatement([]);

visitors.ImportDeclaration = (scope, node, context) => Tree.BundleStatement([]);

visitors.ExportAllDeclaration = (scope, node, context) => Tree.BundleStatement([]);

visitors.ExportDefaultDeclaration = (scope, node, context) => (
  (
    node.declaration.type === "ClassDeclaration" ||
    node.declaration.type === "FunctionDeclaration") ?
  (
    node.declaration.id === null ?
    Tree.ExpressionStatement(
      Scope.box(
        scope,
        false,
        "DefaultName",
        Tree.PrimitiveExpression("default"),
        (box) => Tree.ExportExpression(
          "default",
          Visit[node.declaration.type === "ClassDeclaration" ? "class" : "closure"](
            scope,
            node.declaration,
            {name:box})))) :
    Visit.Statement(scope, node.declaration, null)) :
  Tree.ExpressionStatement(
    Tree.ExportExpression(
      "default",
      Visit.expression(scope, node.declaration, null))));

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration !== null ?
  // console.assort(node.source === null)
  Visit.Statement(scope, node.declaration, null) :
  Tree.BundleStatement([]));

//////////////
// Compound //
//////////////

visitors.BlockStatement = (scope, node, context) => Tree.BlockStatement(
  Visit.Block(
    scope,
    node,
    {
      completion:context.completion,
      labels: ArrayLite.map(context.labels, Label.FullBreak)}));

visitors.LabeledStatement = (scope, node, context) => (
  (
    node.body.type === "FunctionDeclaration" ||
    node.body.type === "ImportDeclaration") ?
  Tree.BundleStatement([]) :
  Visit.Statement(
    scope,
    node.body,
    {
      completion: Completion._register_label(context.completion, node.label.name),
      labels: ArrayLite.add(context.labels, node.label.name)}));

visitors.IfStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Tree.IfStatement(
    Visit.expression(scope, node.test, null),
    Visit.Block(
      scope,
      node.consequent,
      {
        completion: context.completion, 
        labels: ArrayLite.map(context.labels, Label.FullBreak)}),
    (
      node.alternate === null ?
      Scope.Block(
        scope,
        [],
        [],
        (scope) => Tree.BundleStatement([])) :
      Visit.Block(
        scope,
        node.alternate,
        {
          completion:context.completion,
          labels: ArrayLite.map(context.labels, Label.FullBreak)}))));

exports.CATCH = (scope, node, context) => (
  Throw.assert(node.type === "CatchClause", null, `Invalid CATCH node`),
  context = global_Object_assign(
    {
      completion: Completion._make_empty(),
      labels: []},
    context),
  (
    node.param === null ?
    Visit.Block(
      scope,
      node.body,
      {
        completion: context.completion,
        labels: context.labels,
        reset: true}) :
    Scope.Block(
      scope,
      [],
      Query._get_parameter_hoisting(node.param),
      (scope) => Tree.BundleStatement(
        [
          Visit._pattern(
            scope,
            node.param,
            {
              kind: "param",
              expression: Scope.input(scope, "error")}),
          Tree.BlockStatement(
            Visit.Block(
              scope,
              node.body,
              {
                completion: context.completion,
                labels: context.labels,
                reset: true}))]))));

visitors.TryStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Tree.TryStatement(
    Visit.Block(
      scope,
      node.block,
      {
        completion: context.completion,
        labels: ArrayLite.map(context.labels, Label.FullBreak)}),
    // Completion reset on catch:
    // ==========================
    // eval("try { 'foo'; throw 'bar'; } catch (error) {}")
    // undefined
    (
      node.handler === null ?
      Scope.Block(
        scope,
        [],
        [],
        (scope) => Tree.ExpressionStatement(
          Tree.ThrowExpression(
            Scope.input(scope, "error")))) :
      Visit.CATCH(
        scope,
        node.handler,
        {
          completion: context.completion,
          labels: ArrayLite.map(context.labels, Label.FullBreak)})),
    // eval("foo: try { 123; } finally { 456 }") >> 123
    // eval("foo: try { 123; throw 'kakakakak'; } finally { 456; break foo; }") >> 456
    (
      node.finalizer === null ?
      Scope.Block(
        scope,
        [],
        [],
        (scope) => Tree.BundleStatement([])) :
      Visit.Block(
        scope,
        node.finalizer,
        {
          completion: Completion._anticipate(context.completion, true),
          labels: ArrayLite.map(context.labels, Label.FullBreak)}))));

// With keeps the same converted ObjectExpression:
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
visitors.WithStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Scope.Box(
    scope,
    true,
    "StatementWithFrame",
    Visit.expression(scope, node.object, null),
    (box) => Tree.BundleStatement(
      [
        // Convertion at the beginning:
        // with (null) { console.log("this is never executed") } >> TypeError: Cannot convert undefined or null to object
        // with (123) { valueOf = "foobar"; console.log(valueOf); } >> foobar
        Tree.ExpressionStatement(
          Scope.set(
            scope,
            box,
            Intrinsic.fork_nullish(
              () => Scope.get(scope, box),
              Intrinsic.throw_type_error("Cannot convert undefined or null to object"),
              null))),
        Tree.BlockStatement(
          Visit.Block(
            Scope._extend_dynamic_with(scope, box),
            node.body,
            {
              completion: context.completion,
              labels: ArrayLite.map(context.labels, Label.FullBreak)}))])));

visitors.WhileStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope._get_depth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BlockStatement(
      Scope.Block(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        [],
        (scope) => Tree.WhileStatement(
          Visit.expression(scope, node.test, null),
          Visit.Block(
            Scope._extend_loop(scope, _depth),
            node.body,
            {
              completion: context.completion,
              labels: ArrayLite.add(
                ArrayLite.map(context.labels, Label.FullContinue),
                Label.EmptyContinue(_depth))}))))));

visitors.DoWhileStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope._get_depth(scope)),
  reset_completion(
    scope,
    context.completion,
    Scope.Box(
      scope,
      true,
      "StatementDoWhileEntrance",
      Tree.PrimitiveExpression(true),
      (box) => Tree.BlockStatement(
        Scope.Block(
          scope,
          ArrayLite.add(
            ArrayLite.map(context.labels, Label.FullBreak),
            Label.EmptyBreak(_depth)),
          [],
          (scope) => Tree.WhileStatement(
            Tree.ConditionalExpression(
              Scope.get(scope, box),
              Tree.SequenceExpression(
                Scope.set(
                  scope,
                  box,
                  Tree.PrimitiveExpression(false)),
                Tree.PrimitiveExpression(true)),
              Visit.expression(scope, node.test, null)),
            Visit.Block(
              Scope._extend_loop(scope, _depth),
              node.body,
              {
                completion:context.completion,
                labels: ArrayLite.add(
                  ArrayLite.map(context.labels, Label.FullContinue),
                  Label.EmptyContinue(_depth))})))))));

visitors.ForStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope._get_depth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BlockStatement(
      Scope.Block(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        (
          (
            node.init !== null &&
            node.init.type === "VariableDeclaration") ?
          Query._get_shallow_hoisting(node.init) :
          []),
        (scope) => Tree.BundleStatement(
          [
            Tree.BundleStatement(
              (
                node.init === null ?
                [] :
                (
                  node.init.type === "VariableDeclaration" ?
                  [
                    Visit.Statement(scope, node.init, null)] :
                  [
                    Tree.ExpressionStatement(
                      Visit.expression(scope, node.init, null))]))),
            Tree.WhileStatement(
              (
                node.test ?
                Visit.expression(scope, node.test, null) :
                Tree.PrimitiveExpression(true)),
              (
                node.update === null ?
                Visit.Block(
                  Scope._extend_loop(scope, _depth),
                  node.body,
                  {
                    completion: context.completion,
                    labels: ArrayLite.add(
                      ArrayLite.map(context.labels, Label.FullContinue),
                      Label.EmptyContinue(_depth))}) :
                Scope.Block(
                  scope,
                  [],
                  [],
                  (scope) => Tree.BundleStatement(
                    [
                      Tree.BlockStatement(
                        Visit.Block(
                          Scope._extend_loop(scope, _depth),
                          node.body,
                          {
                            completion: context.completion,
                            labels: ArrayLite.add(
                              ArrayLite.map(context.labels, Label.FullContinue),
                              Label.EmptyContinue(_depth))})),
                      // No completion
                      // =============
                      // for (let index = 0; index < 10; index++) {}
                      // undefined
                      Tree.ExpressionStatement(
                        Visit.expression(scope, node.update, null))]))))])))));

// for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}

// Variables in the left hand side belongs to the body of the while but still
// they must be shadowed to the right-hand side.
//
// > for (const x in {a:x, b:2}) { console.log(x) }
// Thrown:
// ReferenceError: Cannot access 'x' before initialization
visitors.ForInStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope._get_depth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BlockStatement(
      Scope.Block(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        ArrayLite.map(
          (
            node.left.type === "VariableDeclaration" ?
            Query._get_shallow_hoisting(node.left) :
            []),
          ghostify),
        (scope) => Scope.Box(
          scope,
          true,
          "StatementForInRight",
          Visit.expression(scope, node.right, null),
          (right_box) => Scope.Box(
            scope,
            true,
            "StatementForInKeys",
            Intrinsic.construct_array([]),
            (keys_box) => Tree.BundleStatement(
              [
                // We cannot use Object but the get/set convertion instead:
                // > Object.prototype.foo = "bar";
                // 'bar'
                // > for (let key in null) { console.log(key) }
                // undefined
                // > for (let key in Object(null)) { console.log(key) }
                // foo
                Tree.ExpressionStatement(
                  Scope.set(
                    scope,
                    right_box,
                    Intrinsic.fork_nullish(
                      () => Scope.get(scope, right_box),
                      Tree.PrimitiveExpression(null),
                      null))),
                Tree.WhileStatement(
                  Scope.get(scope, right_box),
                  Scope.Block(
                    scope,
                    [],
                    [],
                    (scope) => Tree.BundleStatement(
                      [
                        Tree.ExpressionStatement(
                          Scope.set(
                            scope,
                            keys_box,
                            Intrinsic.concat(
                              [
                                Scope.get(scope, keys_box),
                                Intrinsic.keys(
                                  Scope.get(scope, right_box))]))),
                        Tree.ExpressionStatement(
                          Scope.set(
                            scope,
                            right_box,
                            Intrinsic.get_prototype_of(
                              Scope.get(scope, right_box))))]))),
                Scope.Box(
                  scope,
                  true,
                  "StatementForInIndex",
                  Tree.PrimitiveExpression(0),
                  (index_box) => Scope.Box(
                    scope,
                    false,
                    "StatementForInLength",
                    Intrinsic.get(
                      Scope.get(scope, keys_box),
                      Tree.PrimitiveExpression("length"),
                      null),
                    (length_box) => Tree.WhileStatement(
                      Tree.BinaryExpression(
                        "<",
                        Scope.get(scope, index_box),
                        Scope.get(scope, length_box)),
                      Scope.Block(
                        scope,
                        [],
                        (
                          node.left.type === "VariableDeclaration" ?
                          Query._get_shallow_hoisting(node.left) :
                          []),
                        (scope) => Tree.BundleStatement(
                          [
                            // It does not mathers to provide the correct name for the ClosureExpression:
                            // for (let x in (() => {})) { /* cannot access the arrow */ }
                            (
                              node.left.type === "VariableDeclaration" ?
                              Visit._pattern(
                                scope,
                                node.left.declarations[0].id,
                                {
                                  kind: node.left.kind,
                                  expression: Intrinsic.get(
                                    Scope.get(scope, keys_box),
                                    Scope.get(scope, index_box),
                                    null)}) :
                              Tree.ExpressionStatement(
                                Visit._pattern(
                                  scope,
                                  node.left,
                                  {
                                    kind: null,
                                    expression: Intrinsic.get(
                                      Scope.get(scope, keys_box),
                                      Scope.get(scope, index_box),
                                      null)}))),
                            Tree.BlockStatement(
                              Visit.Block(
                                Scope._extend_loop(scope, _depth),
                                node.body,
                                {
                                  completion: context.completion,
                                  labels: ArrayLite.add(
                                    ArrayLite.map(context.labels, Label.FullContinue),
                                    Label.EmptyContinue(_depth))})),
                            Tree.ExpressionStatement(
                              Scope.set(
                                scope,
                                index_box,
                                Tree.BinaryExpression(
                                  "+",
                                  Scope.get(scope, index_box),
                                  Tree.PrimitiveExpression(1))))])))))])))))));

// https://www.ecma-international.org/ecma-262/#sec-getiterator
visitors.ForOfStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope._get_depth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BlockStatement(
      Scope.Block(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        ArrayLite.map(
          (
            node.left.type === "VariableDeclaration" ?
            Query._get_shallow_hoisting(node.left) :
            []),
          ghostify),
        (scope) => Scope.Box(
          scope,
          false,
          "StatementForOfRight",
          Visit.expression(scope, node.right, null),
          (right_box) => Scope.Box(
            scope,
            false,
            "StatementForOfIterator",
            Tree.ApplyExpression(
              (
                node.await ?
                Scope.box(
                  scope,
                  false,
                  "StatementForOfAsyncIterator",
                  Intrinsic.get(
                    Intrinsic.fork_nullish(
                      () => Scope.get(scope, right_box),
                      null,
                      null),
                    Intrinsic.grab("Symbol.asyncIterator"),
                    null),
                  (async_iterator_box) => Intrinsic.fork_nullish(
                    () => Scope.get(scope, async_iterator_box),
                    Intrinsic.get(
                      Intrinsic.fork_nullish(
                        () => Scope.get(scope, right_box),
                        null,
                        null),
                      Intrinsic.grab("Symbol.iterator"),
                      null),
                    Scope.get(scope, async_iterator_box))) :
                Intrinsic.get(
                  Intrinsic.fork_nullish(
                    () => Scope.get(scope, right_box),
                    null,
                    null),
                  Intrinsic.grab("Symbol.iterator"),
                  null)),
              Scope.get(scope, right_box),
              []),
            (iterator_box) => Scope.Box(
              scope,
              true,
              "StatementForOfStep",
              Tree.PrimitiveExpression(void 0),
              (step_box) => Tree.TryStatement(
                Scope.Block(
                  scope,
                  [],
                  [],
                  (scope) => Tree.WhileStatement(
                    Tree.SequenceExpression(
                      Scope.set(
                        scope,
                        step_box,
                        (
                          (
                            (expression) => (
                              node.await ?
                              Tree.AwaitExpression(expression) :
                              expression))
                          (
                            Tree.ApplyExpression(
                              Intrinsic.get(
                                Scope.get(scope, iterator_box),
                                Tree.PrimitiveExpression("next"),
                                null),
                              Scope.get(scope, iterator_box),
                              [])))),
                      Tree.UnaryExpression(
                        "!",
                        Intrinsic.get(
                          Scope.get(scope, step_box),
                          Tree.PrimitiveExpression("done"),
                          null))),
                    // The left pattern does not resides in the body's scope:
                    // > let z = 1; for (let [x,y=(console.log("foo"), z)] in {a:1, b:2}) { console.log("bar"); let z }
                    // foo
                    // bar
                    // foo
                    // bar
                    Scope.Block(
                      scope,
                      [],
                      (
                        node.left.type === "VariableDeclaration" ?
                        Query._get_shallow_hoisting(node.left) :
                        []),
                      (scope) => Tree.BundleStatement(
                        [
                          (
                            node.left.type === "VariableDeclaration" ?
                            Visit._pattern(
                              scope,
                              node.left.declarations[0].id,
                              {
                                kind: node.left.kind,
                                expression: Intrinsic.get(
                                  Scope.get(scope, step_box),
                                  Tree.PrimitiveExpression("value"),
                                  null)}) :
                            Tree.ExpressionStatement(
                              Visit._pattern(
                                scope,
                                node.left,
                                {
                                  kind: null,
                                  expression: Intrinsic.get(
                                    Scope.get(scope, step_box),
                                    Tree.PrimitiveExpression("value"),
                                    null)}))),
                          Tree.BlockStatement(
                            Visit.Block(
                              Scope._extend_loop(scope, _depth),
                              node.body,
                              {
                                completion: context.completion,
                                labels: ArrayLite.add(
                                  ArrayLite.map(context.labels, Label.FullContinue),
                                  Label.EmptyContinue(_depth))}))])))),
                  Scope.Block(
                    scope,
                    [],
                    [],
                    (scope) => Tree.BundleStatement(
                      [
                        Tree.ExpressionStatement(
                          Scope.set(
                            scope,
                            step_box,
                            Tree.PrimitiveExpression(void 0))),
                        Tree.ExpressionStatement(
                          Tree.ThrowExpression(
                            Scope.input(scope, "error")))])),
                  Scope.Block(
                    scope,
                    [],
                    [],
                    (scope) => Tree.ExpressionStatement(
                      Tree.ConditionalExpression(
                        Scope.get(scope, step_box),
                        Tree.ConditionalExpression(
                          Intrinsic.get(
                            Scope.get(scope, step_box),
                            Tree.PrimitiveExpression("done"),
                            null),
                          Tree.PrimitiveExpression(void 0),
                          Scope.box(
                            scope,
                            false,
                            "StatementForOfReturn",
                            Intrinsic.get(
                              Scope.get(scope, iterator_box),
                              Tree.PrimitiveExpression("return"),
                              null),
                            (return_box) => Intrinsic.fork_nullish(
                              () => Scope.get(scope, return_box),
                              Tree.PrimitiveExpression(void 0),
                              Tree.ApplyExpression(
                                Scope.get(scope, return_box),
                                Scope.get(scope, iterator_box),
                                [])))),
                        Tree.PrimitiveExpression(void 0))))))))))));

visitors.SwitchStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope._get_depth(scope)),
  reset_completion(
    scope,
    context.completion,
    Scope.Box(
      scope,
      false,
      "StatementSwitchDiscriminant",
      Visit.expression(scope, node.discriminant, null),
      (discriminant_box) => Scope.Box(
        scope,
        true,
        "StatementSwitchMatched",
        Tree.PrimitiveExpression(false),
        (matched_box) => Tree.BlockStatement(
          Visit.SWITCH(
            Scope._extend_loop(scope, _depth),
            node,
            {
              completion: context.completion,
              labels: ArrayLite.add(
                ArrayLite.map(context.labels, Label.FullBreak),
                Label.EmptyBreak(_depth)),
              matched: matched_box,
              discriminant: discriminant_box}))))));
