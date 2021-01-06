"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Stratum = require("../../stratum.js");
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
const reset_completion = (scope, completion, statement) => Tree.Bundle(
  ArrayLite.concat(
    (
      Completion._is_last(completion) ?
      [
        Tree.Lift(
          Scope.set_completion(
            scope,
            Tree.primitive(void 0)))] :
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

visitors.EmptyStatement = (scope, node, context) => Tree.Bundle([]);

visitors.DebuggerStatement = (scope, node, context) => Tree.Debugger();

visitors.ExpressionStatement = (scope, node, context) => (
  Completion._is_last(context.completion) ?
  (
    Scope._has_completion(scope) ?
    Tree.Lift(
      Scope.set_completion(
        scope,
        Visit.expression(scope, node.expression, null))) :
    Tree.Return(
      Visit.expression(scope, node.expression, null))) :
  Tree.Lift(
    Visit.expression(
      scope,
      node.expression,
      {dropped: true})));

visitors.BreakStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    Scope._fetch_loop(scope) :
    Stratum._base(node.label.name)),
  (
    ArrayLite.has(context.labels, _label) ?
    Tree.Bundle([]) :
    Tree.Break(_label)));

visitors.ContinueStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    Scope._fetch_loop(scope) :
    Stratum._base(node.label.name)),
  Throw.assert(
    !ArrayLite.has(context.labels, _label),
    null,
    `Break label used as continue label`),
  Tree.Continue(_label));

visitors.ThrowStatement = (scope, node, context) => Tree.Lift(
  Tree.throw(
    Visit.expression(scope, node.argument, null)));

visitors.ReturnStatement = (scope, node, context) => Tree.Return(
  (
    Scope._fetch_sort(scope) === "arrow" ||
    Scope._fetch_sort(scope) === "method") ?
  (
    node.argument === null ?
    Tree.primitive(void 0) :
    Visit.expression(scope, node.argument, null)) :
  (
    node.argument === null ?
    (
      Scope._fetch_sort(scope) === "function" ?
      Tree.conditional(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Tree.primitive(void 0)) :
      // Early syntax error prevent return in top level
      // console.assert(Scope._fetch_sort(scope) === "constructor" || Scope._fetch_sort(scope) === "derived-constructor")
      Scope.read(scope, "this")) :
    Scope.box(
      scope,
      false,
      "StatementReturnArgument",
      Visit.expression(scope, node.argument, null),
      (box, _expression) => (
        _expression = Tree.conditional(
          Tree.binary(
            "===",
            Tree.unary(
              "typeof",
              Scope.get(scope, box)),
            Tree.primitive("object")),
          Scope.get(scope, box),
          Tree.binary(
            "===",
            Tree.unary(
              "typeof",
              Scope.get(scope, box)),
            Tree.primitive("function"))),
        (
          Scope._fetch_sort(scope) === "function" ?
          Tree.conditional(
            Scope.read(scope, "new.target"),
            Tree.conditional(
              _expression,
              Scope.get(scope, box),
              Scope.read(scope, "this")),
            Scope.get(scope, box)) :
          (
            Scope._fetch_sort(scope) === "derived-constructor" ?
            Tree.conditional(
              _expression,
              Scope.get(scope, box),
              Tree.conditional(
                Tree.binary(
                  "===",
                  Scope.get(scope, box),
                  Tree.primitive(void 0)),
                Scope.read(scope, "this"),
                Intrinsic.throw_type_error("Derived constructors may only return an object or undefined"))) :
            // console.assert(Scope._fetch_sort(scope) === "constructor")
            Tree.conditional(
              _expression,
              Scope.get(scope, box),
              Scope.read(scope, "this"))))))));

/////////////////
// Declaration //
/////////////////

exports.Declarator = (scope, node, context) => (
  Throw.assert(node.type === "VariableDeclarator", null, `Invalid Declarator node`),
  Tree.Lift(
    Visit.pattern(
      scope,
      node.id,
      {
        kind: context.kind,
        expression: (
          node.init === null ?
          Tree.primitive(void 0) :
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
              Tree.primitive(node.id.name),
              (box) => Visit.closure(
                scope,
                node.init,
                {name:box})) :
            Visit.expression(scope, node.init, null)))})));

visitors.VariableDeclaration = (scope, parent, context) => Tree.Bundle(
  ArrayLite.map(
    parent.declarations,
    (child) => Visit.Declarator(
      scope,
      child,
      {kind:parent.kind})));

visitors.ClassDeclaration = (scope, node, context) => Tree.Lift(
  Scope.initialize(
    scope,
    "class",
    node.id.name,
    Visit.class(
      scope,
      node,
      {
        __proto__: null,
        visited: true})));

visitors.FunctionDeclaration = (scope, node, context) => Tree.Bundle([]);

visitors.ImportDeclaration = (scope, node, context) => Tree.Bundle([]);

visitors.ExportAllDeclaration = (scope, node, context) => Tree.Bundle([]);

visitors.ExportDefaultDeclaration = (scope, node, context) => (
  (
    node.declaration.type === "ClassDeclaration" ||
    node.declaration.type === "FunctionDeclaration") ?
  (
    node.declaration.id === null ?
    Tree.Lift(
      Scope.box(
        scope,
        false,
        "DefaultName",
        Tree.primitive("default"),
        (box) => Tree.export(
          "default",
          Visit[node.declaration.type === "ClassDeclaration" ? "class" : "closure"](
            scope,
            node.declaration,
            {name:box})))) :
    Visit.Statement(scope, node.declaration, null)) :
  Tree.Lift(
    Tree.export(
      "default",
      Visit.expression(scope, node.declaration, null))));

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration !== null ?
  // console.assort(node.source === null)
  Visit.Statement(scope, node.declaration, null) :
  Tree.Bundle([]));

//////////////
// Compound //
//////////////

visitors.BlockStatement = (scope, node, context) => Tree.Lone(
  context.labels,
  Visit.BLOCK(
    scope,
    node,
    {completion:context.completion}));

visitors.LabeledStatement = (scope, node, context) => (
  (
    node.body.type === "FunctionDeclaration" ||
    node.body.type === "ImportDeclaration") ?
  Tree.Bundle([]) :
  Visit.Statement(
    scope,
    node.body,
    {
      completion: Completion._register_label(context.completion, node.label.name),
      labels: ArrayLite.add(
        context.labels,
        Stratum._base(node.label.name))}));

visitors.IfStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Tree.If(
    context.labels,
    Visit.expression(scope, node.test, null),
    Visit.BLOCK(
      scope,
      node.consequent,
      {completion:context.completion}),
    (
      node.alternate === null ?
      Scope.BLOCK(
        scope,
        [],
        (scope) => Tree.Bundle([])) :
      Visit.BLOCK(
        scope,
        node.alternate,
        {completion:context.completion}))));

exports.CATCH = (scope, node, context) => (
  Throw.assert(node.type === "CatchClause", null, `Invalid CATCH node`),
  (
    node.param === null ?
    Visit.BLOCK(
      scope,
      node.body,
      {
        completion: context.completion,
        reset: true}) :
    Scope.BLOCK(
      scope,
      Query._get_parameter_hoisting(node.param),
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Visit.pattern(
              scope,
              node.param,
              {
                kind: "param",
                expression: Scope.input(scope, "error")})),
          Tree.Lone(
            [],
            Visit.BLOCK(
              scope,
              node.body,
              {
                completion: context.completion,
                reset: true}))]))));

visitors.TryStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Tree.Try(
    context.labels,
    Visit.BLOCK(
      scope,
      node.block,
      {completion:context.completion}),
    // Completion reset on catch:
    // ==========================
    // eval("try { 'foo'; throw 'bar'; } catch (error) {}")
    // undefined
    (
      node.handler === null ?
      Scope.BLOCK(
        scope,
        [],
        (scope) => Tree.Lift(
          Tree.throw(
            Scope.input(scope, "error")))) :
      Visit.CATCH(
        scope,
        node.handler,
        {completion:context.completion})),
    // eval("foo: try { 123; } finally { 456 }") >> 123
    // eval("foo: try { 123; throw 'kakakakak'; } finally { 456; break foo; }") >> 456
    (
      node.finalizer === null ?
      Scope.BLOCK(
        scope,
        [],
        (scope) => Tree.Bundle([])) :
      Visit.BLOCK(
        scope,
        node.finalizer,
        {
          completion: Completion._anticipate(context.completion, true)}))));

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
visitors.WithStatement = (scope, node, context) => reset_completion(
  scope,
  context.completion,
  Scope.Box(
    scope,
    true,
    "StatementWithFrame",
    Visit.expression(scope, node.object, null),
    (box) => Tree.Bundle(
      [
        // Convertion at the beginning:
        // with (null) { console.log("this is never executed") } >> TypeError: Cannot convert undefined or null to object
        // with (123) { valueOf = "foobar"; console.log(valueOf); } >> foobar
        Tree.Lift(
          Scope.set(
            scope,
            box,
            Intrinsic.fork_nullish(
              () => Scope.get(scope, box),
              Intrinsic.throw_type_error("Cannot convert undefined or null to object"),
              null))),
        Tree.Lone(
          context.labels,
          Visit.BLOCK(
            Scope._extend_dynamic_with(scope, box),
            node.body,
            {completion: context.completion}))])));

visitors.WhileStatement = (scope, node, context, _label) => (
  _label = Stratum._meta(
    `while_${Scope._get_depth(scope)}`),
  reset_completion(
    scope,
    context.completion,
    Tree.While(
      ArrayLite.add(context.labels, _label),
      Visit.expression(scope, node.test, null),
      Visit.BLOCK(
        Scope._extend_loop(scope, _label),
        node.body,
        {completion:context.completion}))));

visitors.DoWhileStatement = (scope, node, context, _label) => (
  _label = Stratum._meta(
    `do_while_${Scope._get_depth(scope)}`),
  reset_completion(
    scope,
    context.completion,
    Scope.Box(
      scope,
      true,
      "StatementDoWhileEntrance",
      Tree.primitive(true),
      (box) => Tree.While(
        ArrayLite.add(context.labels, _label),
        Tree.conditional(
          Scope.get(scope, box),
          Tree.sequence(
            Scope.set(
              scope,
              box,
              Tree.primitive(false)),
            Tree.primitive(true)),
          Visit.expression(scope, node.test, null)),
        Visit.BLOCK(
          Scope._extend_loop(scope, _label),
          node.body,
          {completion:context.completion})))));

visitors.ForStatement = (scope, node, context, _label) => (
  _label = Stratum._meta(
    `for_${Scope._get_depth(scope)}`),
  reset_completion(
    scope,
    context.completion,
    (
      (
        // (Scope -> aran.Statement) -> aran.Statement
        (closure) => (
          node.init ?
          (
            node.init.type === "VariableDeclaration" ?
            (
              node.init.kind === "var" ?
              Tree.Bundle(
                [
                  Visit.Statement(scope, node.init, null),
                  closure(scope)]) :
              Tree.Lone(
                [],
                Scope.BLOCK(
                  scope,
                  Query._get_shallow_hoisting(node.init),
                  (scope) => Tree.Bundle(
                    [
                      Visit.Statement(scope, node.init, null),
                      closure(scope)])))) :
            Tree.Bundle(
              [
                Tree.Lift(
                  Visit.expression(scope, node.init, null)),
                closure(scope)])) :
          closure(scope)))
      (
        // Scope -> aran.Statement
        (scope) => Tree.While(
          ArrayLite.add(context.labels, _label),
          (
            node.test ?
            Visit.expression(scope, node.test, null) :
            Tree.primitive(true)),
          (
            node.update === null ?
            Visit.BLOCK(
              Scope._extend_loop(scope, _label),
              node.body,
              {completion:context.completion}) :
            Scope.BLOCK(
              scope,
              [],
              (scope) => Tree.Bundle(
                [
                  Tree.Lone(
                    [],
                    Visit.BLOCK(
                      Scope._extend_loop(scope, _label),
                      node.body,
                      {completion:context.completion})),
                  // No completion
                  // =============
                  // for (let index = 0; index < 10; index++) {}
                  // undefined
                  Tree.Lift(
                    Visit.expression(scope, node.update, null))]))))))));

// for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}

// Variables in the left hand side belongs to the body of the while but still
// they must be shadowed to the right-hand side.
//
// > for (const x in {a:x, b:2}) { console.log(x) }
// Thrown:
// ReferenceError: Cannot access 'x' before initialization
visitors.ForInStatement = (scope, node, context, _label) => (
  _label = Stratum._meta(
    `for_in_${Scope._get_depth(scope)}`),
  reset_completion(
    scope,
    context.completion,
    (
      (
        // (Scope -> aran.Statement) -> aran.Statement
        (closure) => (
          (
            node.left.type === "VariableDeclaration" &&
            node.left.kind !== "var") ?
          Tree.Lone(
            [],
            Scope.BLOCK(
              scope,
              ArrayLite.map(
                Query._get_shallow_hoisting(node.left),
                ghostify),
              closure)) :
          closure(scope)))
      (
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
            (keys_box) => Tree.Bundle(
              [
                // We cannot use Object but the get/set convertion instead:
                // > Object.prototype.foo = "bar";
                // 'bar'
                // > for (let key in null) { console.log(key) }
                // undefined
                // > for (let key in Object(null)) { console.log(key) }
                // foo
                Tree.Lift(
                  Scope.set(
                    scope,
                    right_box,
                    Intrinsic.fork_nullish(
                      () => Scope.get(scope, right_box),
                      Tree.primitive(null),
                      null))),
                Tree.While(
                  [],
                  Scope.get(scope, right_box),
                  Scope.BLOCK(
                    scope,
                    [],
                    (scope) => Tree.Bundle(
                      [
                        Tree.Lift(
                          Scope.set(
                            scope,
                            keys_box,
                            Intrinsic.concat(
                              [
                                Scope.get(scope, keys_box),
                                Intrinsic.keys(
                                  Scope.get(scope, right_box))]))),
                        Tree.Lift(
                          Scope.set(
                            scope,
                            right_box,
                            Intrinsic.get_prototype_of(
                              Scope.get(scope, right_box))))]))),
                Scope.Box(
                  scope,
                  true,
                  "StatementForInIndex",
                  Tree.primitive(0),
                  (index_box) => Scope.Box(
                    scope,
                    false,
                    "StatementForInLength",
                    Intrinsic.get(
                      Scope.get(scope, keys_box),
                      Tree.primitive("length"),
                      null),
                    (length_box) => Tree.While(
                      ArrayLite.add(context.labels, _label),
                      Tree.binary(
                        "<",
                        Scope.get(scope, index_box),
                        Scope.get(scope, length_box)),
                      Scope.BLOCK(
                        scope,
                        (
                          node.left.type === "VariableDeclaration" ?
                          Query._get_shallow_hoisting(node.left) :
                          []),
                        (scope) => Tree.Bundle(
                          [
                            // It does not mathers to provide the correct name for the closure:
                            // for (let x in (() => {})) { /* cannot access the arrow */ }
                            Tree.Lift(
                              Visit.pattern(
                                scope,
                                (
                                  node.left.type === "VariableDeclaration" ?
                                  node.left.declarations[0].id :
                                  node.left),
                                {
                                  kind: (
                                    (
                                      node.left.type === "VariableDeclaration" &&
                                      node.left.kind !== "var") ?
                                    node.left.kind :
                                    null),
                                  expression: Intrinsic.get(
                                    Scope.get(scope, keys_box),
                                    Scope.get(scope, index_box),
                                    null)})),
                            Tree.Lone(
                              [],
                              Visit.BLOCK(
                                Scope._extend_loop(scope, _label),
                                node.body,
                                {completion:context.completion})),
                            Tree.Lift(
                              Scope.set(
                                scope,
                                index_box,
                                Tree.binary(
                                  "+",
                                  Scope.get(scope, index_box),
                                  Tree.primitive(1))))])))))])))))));

visitors.ForOfStatement = (scope, node, context, _label) => (
  Throw.assert(!node.await, null, `await for-of statement should never be reached`),
  _label = Stratum._meta(
    `for_of_${Scope._get_depth(scope)}`),
  reset_completion(
    scope,
    context.completion,
    (
      (
        (closure) => (
          (
            node.left.type === "VariableDeclaration" &&
            node.left.kind !== "var") ?
          Tree.Lone(
            [],
            Scope.BLOCK(
              scope,
              ArrayLite.map(
                Query._get_shallow_hoisting(node.left),
                ghostify),
              closure)) :
          closure(scope)))
      (
        (scope) => Scope.Box(
          scope,
          false,
          "StatementForOfRight",
          Visit.expression(scope, node.right, null),
          (right_box) => Scope.Box(
            scope,
            false,
            "StatementForOfIterator",
            Tree.apply(
              Intrinsic.get(
                Intrinsic.fork_nullish(
                  () => Scope.get(scope, right_box),
                  null,
                  null),
                Intrinsic.grab("Symbol.iterator"),
                null),
              Scope.get(scope, right_box),
              []),
            (iterator_box) => Scope.Box(
              scope,
              true,
              "StatementForOfStep",
              Tree.primitive(void 0),
              (step_box) => Tree.While(
                ArrayLite.add(context.labels, _label),
                Tree.sequence(
                  Scope.set(
                    scope,
                    step_box,
                    Tree.apply(
                      Intrinsic.get(
                        Scope.get(scope, iterator_box),
                        Tree.primitive("next"),
                        null),
                      Scope.get(scope, iterator_box),
                      [])),
                  Tree.unary(
                    "!",
                    Intrinsic.get(
                      Scope.get(scope, step_box),
                      Tree.primitive("done"),
                      null))),
                // The left pattern does not resides in the body's scope:
                // > let z = 1; for (let [x,y=(console.log("foo"), z)] in {a:1, b:2}) { console.log("bar"); let z }
                // foo
                // bar
                // foo
                // bar
                Scope.BLOCK(
                  scope,
                  (
                    node.left.type === "VariableDeclaration" ?
                    Query._get_shallow_hoisting(node.left) :
                    []),
                  (scope) => Tree.Bundle(
                    [
                      Tree.Lift(
                        Visit.pattern(
                          scope,
                          (
                            node.left.type === "VariableDeclaration" ?
                            node.left.declarations[0].id :
                            node.left),
                          {
                            kind: (
                              node.left.type === "VariableDeclaration" ?
                              node.left.kind :
                              null),
                            expression: Intrinsic.get(
                              Scope.get(scope, step_box),
                              Tree.primitive("value"),
                              null)})),
                      Tree.Lone(
                        [],
                        Visit.BLOCK(
                          Scope._extend_loop(scope, _label),
                          node.body,
                          {completion:context.completion}))]))))))))));

visitors.SwitchStatement = (scope, node, context, _label) => (
  _label = Stratum._meta(
    `switch_${Scope._get_depth(scope)}`),
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
        Tree.primitive(false),
        (matched_box) => Tree.Lone(
          ArrayLite.add(context.labels, _label),
          Visit.SWITCH(
            Scope._extend_loop(scope, _label),
            node,
            {
              completion: context.completion,
              matched: matched_box,
              discriminant: discriminant_box}))))));
