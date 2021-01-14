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
const reset_completion = (scope, completion, statement) => Tree.ListStatement(
  ArrayLite.concat(
    (
      Completion.isLast(completion) ?
      [
        Tree.ExpressionStatement(
          Scope.makeCloseCompletionExpression(
            scope,
            Tree.PrimitiveExpression(void 0)))] :
      []),
    [statement]));

exports.visitStatement = (scope, node, context) => (
  context = global_Object_assign(
    {
      completion: Completion.Empty(),
      labels: []},
    context),
  visitors[node.type](scope, node, context));

////////////
// Atomic //
////////////

const visitors = {__proto__:null};

visitors.EmptyStatement = (scope, node, context) => Tree.ListStatement([]);

visitors.DebuggerStatement = (scope, node, context) => Tree.DebuggerStatement();

visitors.ExpressionStatement = (scope, node, context) => (
  Completion.isLast(context.completion) ?
  (
    Scope.hasCompletion(scope) ?
    Tree.ExpressionStatement(
      Scope.makeCloseCompletionExpression(
        scope,
        Visit.visitExpression(scope, node.expression, null))) :
    Tree.ReturnStatement(
      Visit.visitExpression(scope, node.expression, null))) :
  Tree.ExpressionStatement(
    Visit.visitExpression(
      scope,
      node.expression,
      {dropped: true})));

visitors.BreakStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    Label.EmptyBreak(
      Scope.fetchLoop(scope)) :
    Label.FullBreak(node.label.name)),
  (
    ArrayLite.has(
      ArrayLite.map(context.labels, Label.FullBreak),
      _label) ?
    Tree.ListStatement([]) :
    Tree.BreakStatement(_label)));

visitors.ContinueStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    Label.EmptyContinue(
      Scope.fetchLoop(scope)) :
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
    Visit.visitExpression(scope, node.argument, null)));

visitors.ReturnStatement = (scope, node, context) => Tree.ReturnStatement(
  (
    Scope.fetchSort(scope) === "arrow" ||
    Scope.fetchSort(scope) === "method") ?
  (
    node.argument === null ?
    Tree.PrimitiveExpression(void 0) :
    Visit.visitExpression(scope, node.argument, null)) :
  (
    node.argument === null ?
    (
      Scope.fetchSort(scope) === "function" ?
      Tree.ConditionalExpression(
        Scope.makeReadExpression(scope, "new.target"),
        Scope.makeReadExpression(scope, "this"),
        Tree.PrimitiveExpression(void 0)) :
      // Early syntax error prevent return in top level
      // console.assert(Scope.fetchSort(scope) === "constructor" || Scope.fetchSort(scope) === "derived-constructor")
      Scope.makeReadExpression(scope, "this")) :
    Scope.makeBoxExpression(
      scope,
      false,
      "StatementReturnArgument",
      Visit.visitExpression(scope, node.argument, null),
      (box, _expression) => (
        _expression = Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Tree.UnaryExpression(
              "typeof",
              Scope.makeOpenExpression(scope, box)),
            Tree.PrimitiveExpression("object")),
          Scope.makeOpenExpression(scope, box),
          Tree.BinaryExpression(
            "===",
            Tree.UnaryExpression(
              "typeof",
              Scope.makeOpenExpression(scope, box)),
            Tree.PrimitiveExpression("function"))),
        (
          Scope.fetchSort(scope) === "function" ?
          Tree.ConditionalExpression(
            Scope.makeReadExpression(scope, "new.target"),
            Tree.ConditionalExpression(
              _expression,
              Scope.makeOpenExpression(scope, box),
              Scope.makeReadExpression(scope, "this")),
            Scope.makeOpenExpression(scope, box)) :
          (
            Scope.fetchSort(scope) === "derived-constructor" ?
            Tree.ConditionalExpression(
              _expression,
              Scope.makeOpenExpression(scope, box),
              Tree.ConditionalExpression(
                Tree.BinaryExpression(
                  "===",
                  Scope.makeOpenExpression(scope, box),
                  Tree.PrimitiveExpression(void 0)),
                Scope.makeReadExpression(scope, "this"),
                Intrinsic.makeThrowTypeErrorExpression("Derived constructors may only return an object or undefined"))) :
            // console.assert(Scope.fetchSort(scope) === "constructor")
            Tree.ConditionalExpression(
              _expression,
              Scope.makeOpenExpression(scope, box),
              Scope.makeReadExpression(scope, "this"))))))));

/////////////////
// Declaration //
/////////////////

exports.Declarator = (scope, node, context) => (
  Throw.assert(node.type === "VariableDeclarator", null, `Invalid Declarator node`),
  Visit.visitPattern(
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
          Scope.makeBoxExpression(
            scope,
            false,
            "name",
            Tree.PrimitiveExpression(node.id.name),
            (box) => Visit.visitClosure(
              scope,
              node.init,
              {name:box})) :
          Visit.visitExpression(scope, node.init, null)))}));

visitors.VariableDeclaration = (scope, parent, context) => Tree.ListStatement(
  ArrayLite.map(
    parent.declarations,
    (child) => Visit.visitDeclarator(
      scope,
      child,
      {kind:parent.kind})));

visitors.ClassDeclaration = (scope, node, context) => Scope.makeInitializeStatement(
  scope,
  "class",
  node.id.name,
  Visit.visitClass(
    scope,
    node,
    {
      __proto__: null,
      visited: true}));

visitors.FunctionDeclaration = (scope, node, context) => Tree.ListStatement([]);

visitors.ImportDeclaration = (scope, node, context) => Tree.ListStatement([]);

visitors.ExportAllDeclaration = (scope, node, context) => Tree.ListStatement([]);

visitors.ExportDefaultDeclaration = (scope, node, context) => (
  (
    node.declaration.type === "ClassDeclaration" ||
    node.declaration.type === "FunctionDeclaration") ?
  (
    node.declaration.id === null ?
    Tree.ExpressionStatement(
      Scope.makeBoxExpression(
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
    Visit.visitStatement(scope, node.declaration, null)) :
  Tree.ExpressionStatement(
    Tree.ExportExpression(
      "default",
      Visit.visitExpression(scope, node.declaration, null))));

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration !== null ?
  // console.assort(node.source === null)
  Visit.visitStatement(scope, node.declaration, null) :
  Tree.ListStatement([]));

//////////////
// Compound //
//////////////

visitors.BlockStatement = (scope, node, context) => Tree.BranchStatement(
  Visit.visitBlock(
    scope,
    node,
    {
      completion:context.completion,
      labels: ArrayLite.map(context.labels, Label.FullBreak)}));

visitors.LabeledStatement = (scope, node, context) => (
  (
    node.body.type === "FunctionDeclaration" ||
    node.body.type === "ImportDeclaration") ?
  Tree.ListStatement([]) :
  Visit.visitStatement(
    scope,
    node.body,
    {
      completion: Completion.registerLabel(context.completion, node.label.name),
      labels: ArrayLite.add(context.labels, node.label.name)}));

visitors.IfStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Tree.IfStatement(
    Visit.visitExpression(scope, node.test, null),
    Visit.visitBlock(
      scope,
      node.consequent,
      {
        completion: context.completion, 
        labels: ArrayLite.map(context.labels, Label.FullBreak)}),
    (
      node.alternate === null ?
      Scope.makeNormalBlock(
        scope,
        [],
        [],
        (scope) => Tree.ListStatement([])) :
      Visit.visitBlock(
        scope,
        node.alternate,
        {
          completion:context.completion,
          labels: ArrayLite.map(context.labels, Label.FullBreak)}))));

exports.visitCatch = (scope, node, context) => (
  Throw.assert(node.type === "CatchClause", null, `Invalid CATCH node`),
  context = global_Object_assign(
    {
      completion: Completion.Empty(),
      labels: []},
    context),
  (
    node.param === null ?
    Visit.visitBlock(
      scope,
      node.body,
      {
        completion: context.completion,
        labels: context.labels,
        reset: true}) :
    Scope.makeNormalBlock(
      scope,
      [],
      Query.getParameterHoisting(node.param),
      (scope) => Tree.ListStatement(
        [
          Visit.visitPattern(
            scope,
            node.param,
            {
              kind: "param",
              expression: Scope.makeInputExpression(scope, "error")}),
          Tree.BranchStatement(
            Visit.visitBlock(
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
    Visit.visitBlock(
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
      Scope.makeNormalBlock(
        scope,
        [],
        [],
        (scope) => Tree.ExpressionStatement(
          Tree.ThrowExpression(
            Scope.makeInputExpression(scope, "error")))) :
      Visit.visitCatch(
        scope,
        node.handler,
        {
          completion: context.completion,
          labels: ArrayLite.map(context.labels, Label.FullBreak)})),
    // eval("foo: try { 123; } finally { 456 }") >> 123
    // eval("foo: try { 123; throw 'kakakakak'; } finally { 456; break foo; }") >> 456
    (
      node.finalizer === null ?
      Scope.makeNormalBlock(
        scope,
        [],
        [],
        (scope) => Tree.ListStatement([])) :
      Visit.visitBlock(
        scope,
        node.finalizer,
        {
          completion: Completion.anticipateValuation(context.completion, true),
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
  Scope.makeBoxStatement(
    scope,
    true,
    "StatementWithFrame",
    Visit.visitExpression(scope, node.object, null),
    (box) => Tree.ListStatement(
      [
        // Convertion at the beginning:
        // with (null) { console.log("this is never executed") } >> TypeError: Cannot convert undefined or null to object
        // with (123) { valueOf = "foobar"; console.log(valueOf); } >> foobar
        Tree.ExpressionStatement(
          Scope.makeCloseExpression(
            scope,
            box,
            Intrinsic.makeNullishExpression(
              () => Scope.makeOpenExpression(scope, box),
              Intrinsic.makeThrowTypeErrorExpression("Cannot convert undefined or null to object"),
              null))),
        Tree.BranchStatement(
          Visit.visitBlock(
            Scope.WithDynamicScope(scope, box),
            node.body,
            {
              completion: context.completion,
              labels: ArrayLite.map(context.labels, Label.FullBreak)}))])));

visitors.WhileStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope.getDepth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BranchStatement(
      Scope.makeNormalBlock(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        [],
        (scope) => Tree.WhileStatement(
          Visit.visitExpression(scope, node.test, null),
          Visit.visitBlock(
            Scope.LoopBindingScope(scope, _depth),
            node.body,
            {
              completion: context.completion,
              labels: ArrayLite.add(
                ArrayLite.map(context.labels, Label.FullContinue),
                Label.EmptyContinue(_depth))}))))));

visitors.DoWhileStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope.getDepth(scope)),
  reset_completion(
    scope,
    context.completion,
    Scope.makeBoxStatement(
      scope,
      true,
      "StatementDoWhileEntrance",
      Tree.PrimitiveExpression(true),
      (box) => Tree.BranchStatement(
        Scope.makeNormalBlock(
          scope,
          ArrayLite.add(
            ArrayLite.map(context.labels, Label.FullBreak),
            Label.EmptyBreak(_depth)),
          [],
          (scope) => Tree.WhileStatement(
            Tree.ConditionalExpression(
              Scope.makeOpenExpression(scope, box),
              Tree.SequenceExpression(
                Scope.makeCloseExpression(
                  scope,
                  box,
                  Tree.PrimitiveExpression(false)),
                Tree.PrimitiveExpression(true)),
              Visit.visitExpression(scope, node.test, null)),
            Visit.visitBlock(
              Scope.LoopBindingScope(scope, _depth),
              node.body,
              {
                completion:context.completion,
                labels: ArrayLite.add(
                  ArrayLite.map(context.labels, Label.FullContinue),
                  Label.EmptyContinue(_depth))})))))));

visitors.ForStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope.getDepth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BranchStatement(
      Scope.makeNormalBlock(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        (
          (
            node.init !== null &&
            node.init.type === "VariableDeclaration") ?
          Query.getShallowHoisting(node.init) :
          []),
        (scope) => Tree.ListStatement(
          [
            Tree.ListStatement(
              (
                node.init === null ?
                [] :
                (
                  node.init.type === "VariableDeclaration" ?
                  [
                    Visit.visitStatement(scope, node.init, null)] :
                  [
                    Tree.ExpressionStatement(
                      Visit.visitExpression(scope, node.init, null))]))),
            Tree.WhileStatement(
              (
                node.test ?
                Visit.visitExpression(scope, node.test, null) :
                Tree.PrimitiveExpression(true)),
              (
                node.update === null ?
                Visit.visitBlock(
                  Scope.LoopBindingScope(scope, _depth),
                  node.body,
                  {
                    completion: context.completion,
                    labels: ArrayLite.add(
                      ArrayLite.map(context.labels, Label.FullContinue),
                      Label.EmptyContinue(_depth))}) :
                Scope.makeNormalBlock(
                  scope,
                  [],
                  [],
                  (scope) => Tree.ListStatement(
                    [
                      Tree.BranchStatement(
                        Visit.visitBlock(
                          Scope.LoopBindingScope(scope, _depth),
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
                        Visit.visitExpression(scope, node.update, null))]))))])))));

// for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}

// Variables in the left hand side belongs to the body of the while but still
// they must be shadowed to the right-hand side.
//
// > for (const x in {a:x, b:2}) { console.log(x) }
// Thrown:
// ReferenceError: Cannot access 'x' before initialization
visitors.ForInStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope.getDepth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BranchStatement(
      Scope.makeNormalBlock(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        ArrayLite.map(
          (
            node.left.type === "VariableDeclaration" ?
            Query.getShallowHoisting(node.left) :
            []),
          ghostify),
        (scope) => Scope.makeBoxStatement(
          scope,
          true,
          "StatementForInRight",
          Visit.visitExpression(scope, node.right, null),
          (right_box) => Scope.makeBoxStatement(
            scope,
            true,
            "StatementForInKeys",
            Intrinsic.makeArrayExpression([]),
            (keys_box) => Tree.ListStatement(
              [
                // We cannot use Object but the get/set convertion instead:
                // > Object.prototype.foo = "bar";
                // 'bar'
                // > for (let key in null) { console.log(key) }
                // undefined
                // > for (let key in Object(null)) { console.log(key) }
                // foo
                Tree.ExpressionStatement(
                  Scope.makeCloseExpression(
                    scope,
                    right_box,
                    Intrinsic.makeNullishExpression(
                      () => Scope.makeOpenExpression(scope, right_box),
                      Tree.PrimitiveExpression(null),
                      null))),
                Tree.WhileStatement(
                  Scope.makeOpenExpression(scope, right_box),
                  Scope.makeNormalBlock(
                    scope,
                    [],
                    [],
                    (scope) => Tree.ListStatement(
                      [
                        Tree.ExpressionStatement(
                          Scope.makeCloseExpression(
                            scope,
                            keys_box,
                            Intrinsic.makeConcatExpression(
                              [
                                Scope.makeOpenExpression(scope, keys_box),
                                Intrinsic.makeKeysExpression(
                                  Scope.makeOpenExpression(scope, right_box))]))),
                        Tree.ExpressionStatement(
                          Scope.makeCloseExpression(
                            scope,
                            right_box,
                            Intrinsic.makeGetPrototypeOfExpression(
                              Scope.makeOpenExpression(scope, right_box))))]))),
                Scope.makeBoxStatement(
                  scope,
                  true,
                  "StatementForInIndex",
                  Tree.PrimitiveExpression(0),
                  (index_box) => Scope.makeBoxStatement(
                    scope,
                    false,
                    "StatementForInLength",
                    Intrinsic.makeGetExpression(
                      Scope.makeOpenExpression(scope, keys_box),
                      Tree.PrimitiveExpression("length"),
                      null),
                    (length_box) => Tree.WhileStatement(
                      Tree.BinaryExpression(
                        "<",
                        Scope.makeOpenExpression(scope, index_box),
                        Scope.makeOpenExpression(scope, length_box)),
                      Scope.makeNormalBlock(
                        scope,
                        [],
                        (
                          node.left.type === "VariableDeclaration" ?
                          Query.getShallowHoisting(node.left) :
                          []),
                        (scope) => Tree.ListStatement(
                          [
                            // It does not mathers to provide the correct name for the ClosureExpression:
                            // for (let x in (() => {})) { /* cannot access the arrow */ }
                            (
                              node.left.type === "VariableDeclaration" ?
                              Visit.visitPattern(
                                scope,
                                node.left.declarations[0].id,
                                {
                                  kind: node.left.kind,
                                  expression: Intrinsic.makeGetExpression(
                                    Scope.makeOpenExpression(scope, keys_box),
                                    Scope.makeOpenExpression(scope, index_box),
                                    null)}) :
                              Tree.ExpressionStatement(
                                Visit.visitPattern(
                                  scope,
                                  node.left,
                                  {
                                    kind: null,
                                    expression: Intrinsic.makeGetExpression(
                                      Scope.makeOpenExpression(scope, keys_box),
                                      Scope.makeOpenExpression(scope, index_box),
                                      null)}))),
                            Tree.BranchStatement(
                              Visit.visitBlock(
                                Scope.LoopBindingScope(scope, _depth),
                                node.body,
                                {
                                  completion: context.completion,
                                  labels: ArrayLite.add(
                                    ArrayLite.map(context.labels, Label.FullContinue),
                                    Label.EmptyContinue(_depth))})),
                            Tree.ExpressionStatement(
                              Scope.makeCloseExpression(
                                scope,
                                index_box,
                                Tree.BinaryExpression(
                                  "+",
                                  Scope.makeOpenExpression(scope, index_box),
                                  Tree.PrimitiveExpression(1))))])))))])))))));

// https://www.ecma-international.org/ecma-262/#sec-getiterator
visitors.ForOfStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope.getDepth(scope)),
  reset_completion(
    scope,
    context.completion,
    Tree.BranchStatement(
      Scope.makeNormalBlock(
        scope,
        ArrayLite.add(
          ArrayLite.map(context.labels, Label.FullBreak),
          Label.EmptyBreak(_depth)),
        ArrayLite.map(
          (
            node.left.type === "VariableDeclaration" ?
            Query.getShallowHoisting(node.left) :
            []),
          ghostify),
        (scope) => Scope.makeBoxStatement(
          scope,
          false,
          "StatementForOfRight",
          Visit.visitExpression(scope, node.right, null),
          (right_box) => Scope.makeBoxStatement(
            scope,
            false,
            "StatementForOfIterator",
            Tree.ApplyExpression(
              (
                node.await ?
                Scope.makeBoxExpression(
                  scope,
                  false,
                  "StatementForOfAsyncIterator",
                  Intrinsic.makeGetExpression(
                    Intrinsic.makeNullishExpression(
                      () => Scope.makeOpenExpression(scope, right_box),
                      null,
                      null),
                    Intrinsic.makeGrabExpression("Symbol.asyncIterator"),
                    null),
                  (async_iterator_box) => Intrinsic.makeNullishExpression(
                    () => Scope.makeOpenExpression(scope, async_iterator_box),
                    Intrinsic.makeGetExpression(
                      Intrinsic.makeNullishExpression(
                        () => Scope.makeOpenExpression(scope, right_box),
                        null,
                        null),
                      Intrinsic.makeGrabExpression("Symbol.iterator"),
                      null),
                    Scope.makeOpenExpression(scope, async_iterator_box))) :
                Intrinsic.makeGetExpression(
                  Intrinsic.makeNullishExpression(
                    () => Scope.makeOpenExpression(scope, right_box),
                    null,
                    null),
                  Intrinsic.makeGrabExpression("Symbol.iterator"),
                  null)),
              Scope.makeOpenExpression(scope, right_box),
              []),
            (iterator_box) => Scope.makeBoxStatement(
              scope,
              true,
              "StatementForOfStep",
              Tree.PrimitiveExpression(void 0),
              (step_box) => Tree.TryStatement(
                Scope.makeNormalBlock(
                  scope,
                  [],
                  [],
                  (scope) => Tree.WhileStatement(
                    Tree.SequenceExpression(
                      Scope.makeCloseExpression(
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
                              Intrinsic.makeGetExpression(
                                Scope.makeOpenExpression(scope, iterator_box),
                                Tree.PrimitiveExpression("next"),
                                null),
                              Scope.makeOpenExpression(scope, iterator_box),
                              [])))),
                      Tree.UnaryExpression(
                        "!",
                        Intrinsic.makeGetExpression(
                          Scope.makeOpenExpression(scope, step_box),
                          Tree.PrimitiveExpression("done"),
                          null))),
                    // The left pattern does not resides in the body's scope:
                    // > let z = 1; for (let [x,y=(console.log("foo"), z)] in {a:1, b:2}) { console.log("bar"); let z }
                    // foo
                    // bar
                    // foo
                    // bar
                    Scope.makeNormalBlock(
                      scope,
                      [],
                      (
                        node.left.type === "VariableDeclaration" ?
                        Query.getShallowHoisting(node.left) :
                        []),
                      (scope) => Tree.ListStatement(
                        [
                          (
                            node.left.type === "VariableDeclaration" ?
                            Visit.visitPattern(
                              scope,
                              node.left.declarations[0].id,
                              {
                                kind: node.left.kind,
                                expression: Intrinsic.makeGetExpression(
                                  Scope.makeOpenExpression(scope, step_box),
                                  Tree.PrimitiveExpression("value"),
                                  null)}) :
                            Tree.ExpressionStatement(
                              Visit.visitPattern(
                                scope,
                                node.left,
                                {
                                  kind: null,
                                  expression: Intrinsic.makeGetExpression(
                                    Scope.makeOpenExpression(scope, step_box),
                                    Tree.PrimitiveExpression("value"),
                                    null)}))),
                          Tree.BranchStatement(
                            Visit.visitBlock(
                              Scope.LoopBindingScope(scope, _depth),
                              node.body,
                              {
                                completion: context.completion,
                                labels: ArrayLite.add(
                                  ArrayLite.map(context.labels, Label.FullContinue),
                                  Label.EmptyContinue(_depth))}))])))),
                  Scope.makeNormalBlock(
                    scope,
                    [],
                    [],
                    (scope) => Tree.ListStatement(
                      [
                        Tree.ExpressionStatement(
                          Scope.makeCloseExpression(
                            scope,
                            step_box,
                            Tree.PrimitiveExpression(void 0))),
                        Tree.ExpressionStatement(
                          Tree.ThrowExpression(
                            Scope.makeInputExpression(scope, "error")))])),
                  Scope.makeNormalBlock(
                    scope,
                    [],
                    [],
                    (scope) => Tree.ExpressionStatement(
                      Tree.ConditionalExpression(
                        Scope.makeOpenExpression(scope, step_box),
                        Tree.ConditionalExpression(
                          Intrinsic.makeGetExpression(
                            Scope.makeOpenExpression(scope, step_box),
                            Tree.PrimitiveExpression("done"),
                            null),
                          Tree.PrimitiveExpression(void 0),
                          Scope.makeBoxExpression(
                            scope,
                            false,
                            "StatementForOfReturn",
                            Intrinsic.makeGetExpression(
                              Scope.makeOpenExpression(scope, iterator_box),
                              Tree.PrimitiveExpression("return"),
                              null),
                            (return_box) => Intrinsic.makeNullishExpression(
                              () => Scope.makeOpenExpression(scope, return_box),
                              Tree.PrimitiveExpression(void 0),
                              Tree.ApplyExpression(
                                Scope.makeOpenExpression(scope, return_box),
                                Scope.makeOpenExpression(scope, iterator_box),
                                [])))),
                        Tree.PrimitiveExpression(void 0))))))))))));

visitors.SwitchStatement = (scope, node, context, _depth) => (
  _depth = global_String(
    Scope.getDepth(scope)),
  reset_completion(
    scope,
    context.completion,
    Scope.makeBoxStatement(
      scope,
      false,
      "StatementSwitchDiscriminant",
      Visit.visitExpression(scope, node.discriminant, null),
      (discriminant_box) => Scope.makeBoxStatement(
        scope,
        true,
        "StatementSwitchMatched",
        Tree.PrimitiveExpression(false),
        (matched_box) => Tree.BranchStatement(
          Visit.visitSwitch(
            Scope.LoopBindingScope(scope, _depth),
            node,
            {
              completion: context.completion,
              labels: ArrayLite.add(
                ArrayLite.map(context.labels, Label.FullBreak),
                Label.EmptyBreak(_depth)),
              matched: matched_box,
              discriminant: discriminant_box}))))));
