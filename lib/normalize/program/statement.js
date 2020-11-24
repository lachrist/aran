"use strict";

const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

const ArrayLite = require("array-lite");

const Stratum = require("../../stratum.js");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Builtin = require("../builtin.js");
const Expression = require("./expression.js");
const State = require("../state.js");
const Common = require("./common");
const Completion = require("../completion.js");
const Query = require("../query");
const Statement = exports;

const abort = (message) => { throw new global_Error(message) };

const is_function_declaration = (node) => node.type === "FunctionDeclaration";

const get_consequent = (node) => node.consequent;

const get_id = (node) => node.id;

const extract = (node) => (
  node.type === "BlockStatement" ?
  node.body :
  [node]);

exports._default_context = {
  __proto__: null,
  completion: Completion._make_empty(),
  labels: []};

const body = (nodes, completion) => (scope) => Tree.Bundle(
  Tree.Bundle(
    ArrayLite.map(
      nodes,
      (node) => Prelude.Visit(scope, node, Prelude._default_context))),
  Tree.Bundle(
    ArrayLite.map(
        nodes,
        (node, index) => Statement.Visit(
          scope,
          node,
          {
            __proto__: Statement._default_context,
            completion: Completion._extend(completion, nodes, index)},
          []))));

// Scope -> estree.Statement -> Completion -> aran.Block
const normal = (scope, node, completion, _nodes) => (
  _nodes = (
    node === null ?
    [] :
    extract(node)),
  Scope.NORMAL(
    scope,
    Query._get_block_hoisting(_nodes),
    body(_nodes, completion)));

// Scope -> Completion -> aran.Statement -> aran.Statement
const complete = (scope, completion, statement) => Tree.Bundle(
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

// Scope -> Init -> Node -> aran.Statement
// type Init = Boolean
// type Node = estree.Declaration
const declare = (scope, kind, node) => Tree.Lift(
  Common.assign(
    scope,
    kind,
    node.id,
    (
      node.id.type === "Identifier" ?
      Scope.box(
        scope,
        false,
        "name",
        Tree.primitive(node.id.name),
        (box) => (
          node.init === null ?
          Tree.primitive(void 0) :
          Expression.visit(
            scope,
            node.init,
            {
              __proto__: Expression._default_context,
              name: box}))) :
      Expression.visit(scope, node.init, Expression._default_context))));

exports.Visit = (scope, node, context) => State._visit(node, [scope, node, context], visitors[node.type]);

////////////
// Atomic //
////////////

const visitors = {__proto__:null};

visitors.EmptyStatement = (scope, node, context) => Tree.Bundle([]);

visitors.DebuggerStatement = (scope, node, context) => Tree.Debugger();

visitors.ExpressionStatement = (scope, node, context) => Tree.Lift(
  (
    Completion._is_last(context.completion) ?
    Scope.set_completion(
      scope,
      Expression.visit(scope, node.expression, Expression._default_context)) :
    Expression.visit(
      scope,
      node.expression,
      {
        __proto__: Expression._default_context,
        dropped: true})));

visitors.BreakStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    null :
    node.label.name),
  (
    ArrayLite.has(context.labels, _label) ?
    Tree.Bundle([]) :
    Tree.Break(
      Stratum._base(_label))));

visitors.ContinueStatement = (scope, node, context, _label) => (
  _label = (
    node.label === null ?
    null :
    node.label.name),
  (
    ArrayLite.has(context.labels, _label) ?
    abort("Break label used as continue label") :
    Tree.Continue(
      Stratum._base(_label))));

visitors.ThrowStatement = (scope, node, context) => Tree.Lift(
  Tree.throw(
    Expression.visit(scope, node.argument, Expression._default_context)));

visitors.ReturnStatement = (scope, node, context) => Tree.Return(
  (
    Scope._get_sort(scope) === "arrow" ||
    Scope._get_sort(scope) === "method") ?
  (
    node.argument === null ?
    Tree.primitive(void 0) :
    Expression.visit(scope, node.argument, Expression._default_context)) :
  (
    node.argument === null ?
    (
      Scope._get_sort(scope) === "function" ?
      Tree.conditional(
        Scope.read(scope, "new.target"),
        Scope.read(scope, "this"),
        Tree.primitive(void 0)) :
      // Early syntax error prevent return in top level
      // console.assert(Scope._get_sort(scope) === "constructor")
      (
        Scope._has_super(scope) ?
        Tree.conditional(
          Scope.read(scope, "this"),
          Scope.read(scope, "this"),
          Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
        Scope.read(scope, "this"))) :
    Scope.box(
      scope,
      false,
      "StatementReturnArgument",
      Expression.visit(scope, node.argument, Expression._default_context),
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
          Scope._get_sort(scope) === "function" ?
          Tree.conditional(
            Scope.read(scope, "new.target"),
            Tree.conditional(
              _expression,
              Scope.get(scope, box),
              Scope.read(scope, "this")),
            Scope.get(scope, box)) :
          ( // console.assert(Scope._get_sort(scope) === "constructor")
            Scope._has_super(scope) ?
            Tree.conditional(
              _expression,
              Scope.get(scope, box),
              Tree.conditional(
                Tree.binary(
                  "===",
                  Scope.get(scope, box),
                  Tree.primitive(void 0)),
                Tree.conditional(
                  Scope.read(scope, "this"),
                  Scope.read(scope, "this"),
                  Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")),
                Builtin.throw_type_error("Derived constructors may only return object or undefined"))) :
            Tree.conditional(
              _expression,
              Scope.get(scope, box),
              Scope.read(scope, "this"))))))));

/////////////////
// Declaration //
/////////////////

visitors.VariableDeclaration = (scope, node, context) => Tree.Bundle(
  ArrayLite.map(
    node.declarations,
    (declaration) => declare(scope, node.kind, declaration)));

visitors.FunctionDeclaration = (scope, node, context) => Tree.Bundle([]);

visitors.ClassDeclaration = (scope, node, context) => Tree.Lift(
  Scope.initialize(
    scope,
    "class",
    node.id.name,
    Common.class(
      scope,
      node,
      Expression._default_context)));

////////////
// Module //
////////////

visitors.ImportDeclaration = (scope, node, context) => Tree.Bundle([]);

visitors.ExportAllDeclaration = (scope, node, context) => Tree.Aggregate(scope.source);

visitors.ExportDefaultDeclaration = (scope, node, context) => Scope.Box(
  scope,
  false,
  "DefaultName",
  Tree.primitive("default"),
  (box) => Tree.Export(
    "default",
    (
      node.declaration.type === "FunctionDeclaration" ?
      (
        node.declaration.id === null ?
        Common.closure(
          scope,
          node.declaration,
          {
            __proto__: Expression._default_context,
            name: box}) :
        Scope.read(scope, node.declaration.id.name)) :
      (
        node.declaration.type === "Class" ?
        (
          node.declaration.id === null ?
          Common.class(
            scope,
            node.declaration,
            {
              __proto__: Expression._default_context,
              name: box}) :
          Scope.initialize(
            scope,
            "class",
            node.declaration.id.name,
            Class.visit(
              scope,
              node.declaration,
              Expression._default_context))) :
        Expression.visit(
          scope,
          node.declaration,
          Expression._default_context)))));

visitors.ExportNamedDeclaration = (scope, node, context) => (
  node.declaration !== null ?
  // console.assert(node.specifiers.length === 0 && node.source === null)
  (
    node.declaration.type === "VariableDeclaration" ?
    Tree.Bundle(
      Tree.Bundle(
        ArrayLite.map(
          node.declarations,
          (declaration) => declare(scope, node.kind, declaration))),
      Tree.Bundle(
        Query._get_parameter_hoisting(
          ArrayLite.map(
            node.declaration.declarations,
            get_id)),
        (variable) => Tree.Export(
          variable.name,
          Scope.read(scope, variable.name))))) :
    Tree.Export(
      node.id.name,
      (
        node.declaration.type === "FunctionDeclaration" ?
        Scope.read(scope, node.declaration.id.name) :
        // console.assert(node.declaration.type === "ClassDeclaration")
        Scope.initialize(
          scope,
          "class",
          Common.class(
            scope,
            node.declaration,
            Expression._default_context))))) :
  (
    node.source === null ?
    Tree.Bundle(
      ArrayLite.map(
        specifiers,
        (specifier) => Tree.Export(
          specifier.exported.name,
          Scope.read(scope, specifier.local.name)))) :
    Scope.ImportBox(
      scope,
      node.source.value,
      (box) => Tree.Bundle(
        ArrayLite.map(
          specifiers,
          (specifier) => Tree.Export(
            specifier.exported.name,
            Builtin.get(
              Scope.get(scope, box),
              Tree.primitive(specifier.local.name),
              null)))))));

//////////////
// Compound //
//////////////

visitors.BlockStatement = (scope, node, context) => Tree.Lone(
  ArrayLite.map(context.labels, Stratum._base),
  normal(scope, node, context.completion));

visitors.LabeledStatement = (scope, node, context) => Statement.Visit(
  scope,
  node.body,
  {
    __proto__: Statement._default_context,
    completion: Completion._register_label(context.completion, node.label.name),
    labels: ArrayLite.add(context.labels, node.label.name)});

visitors.IfStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Tree.If(
    ArrayLite.map(context.labels, Stratum._base),
    Expression.visit(scope, node.test, Expression._default_context),
    normal(
      scope,
      node.consequent,
      context.completion),
    normal(
      scope,
      node.alternate,
      context.completion)));

visitors.TryStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Tree.Try(
    ArrayLite.map(context.labels, Stratum._base),
    normal(scope, node.block, context.completion),
    Scope.CATCH(
      scope,
      (
        (
          node.handler === null ||
          node.handler.param === null) ?
        [] :
        Query._get_parameter_hoisting([node.handler.param])),
      (scope) => (
        node.handler === null ?
        Tree.Lift(
          Tree.throw(
            Scope.parameter(scope, "error"))) :
        // Completion reset on catch:
        // ==========================
        // eval("try { 'foo'; throw 'bar'; } catch (error) {}")
        // undefined
        complete(
          scope,
          context.completion,
          Tree.Bundle(
            (
              node.handler.param === null ?
              [] :
              [
                Tree.Lift(
                  Common.assign(
                    scope,
                    "param",
                    node.handler.param,
                    Scope.parameter(scope, "error"),
                    true))])))),
      (
        node.handler === null ?
        [] :
        Query._get_block_hoisting(node.handler.body.body)),
      body(
        (
          node.handler === null ?
          [] :
          node.handler.body.body),
        context.completion)),
    normal(
      scope,
      node.finalizer,
      // eval("foo: try { 123; } finally { 456 }") >> 123
      // eval("foo: try { 123; throw 'kakakakak'; } finally { 456; break foo; }") >> 456
      Completion._set_not_last(context.completion))));

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
visitors.WithStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Scope.Box(
    scope,
    true,
    "StatementWithFrame",
    Expression.visit(scope, node.object, Expression._default_context),
    (frame_box) => Tree.Bundle(
      [
        // Convertion at the beginning:
        // with (null) { console.log("this is never executed") } >> TypeError: Cannot convert undefined or null to object
        // with (123) { valueOf = "foobar"; console.log(valueOf); } >> foobar
        Tree.Lift(
          Scope.set(
            scope,
            frame_box,
            Builtin.fork_nullish(
              () => Scope.get(scope, frame_box),
              Builtin.throw_type_error("Cannot convert undefined or null to object"),
              null))),
        Tree.Lone(
          ArrayLite.map(context.labels, Stratum._base),
          Scope.WITH(
            scope,
            frame_box,
            Query._get_block_hoisting(
              extract(node.body)),
            body(
              extract(node.body),
              context.completion)))])));

visitors.WhileStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Tree.While(
    ArrayLite.map(
      ArrayLite.add(context.labels, null),
      Stratum._base),
    Expression.visit(scope, node.test, Expression._default_context),
    normal(scope, node.body, context.completion)));

visitors.DoWhileStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Scope.Box(
    scope,
    true,
    "StatementDoWhileEntrance",
    Tree.primitive(true),
    (box) => Tree.While(
      ArrayLite.map(
        ArrayLite.add(context.labels, null),
        Stratum._base),
      Tree.conditional(
        Scope.get(scope, box),
        Tree.sequence(
          Scope.set(
            scope,
            box,
            Tree.primitive(false)),
          Tree.primitive(true)),
        Expression.visit(scope, node.test, Expression._default_context)),
      normal(scope, node.body, context.completion))));

visitors.ForStatement = (scope, node, context) => complete(
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
              ArrayLite.concat(
                ArrayLite.map(
                  node.init.declarations,
                  (declaration) => declare(scope, "var", declaration)),
                [
                  closure(scope)])) :
            Tree.Lone(
              [],
              Scope.NORMAL(
                scope,
                Query._get_block_hoisting([node.init]),
                (scope) => Tree.Bundle(
                  ArrayLite.concat(
                    ArrayLite.map(
                      node.init.declarations,
                      (declaration) => declare(scope, node.init.kind, declaration)),
                    [
                      closure(scope)]))))) :
          Tree.Bundle(
            [
              Tree.Lift(
                Expression.visit(scope, node.init, Expression._default_context)),
              closure(scope)])) :
        closure(scope)))
    (
      // Scope -> aran.Statement
      (scope) => Tree.While(
        ArrayLite.map(
          ArrayLite.add(context.labels, null),
          Stratum._base),
        (
          node.test ?
          Expression.visit(scope, node.test, Expression._default_context) :
          Tree.primitive(true)),
        (
          node.update === null ?
          normal(scope, node.body, context.completion) :
          Scope.NORMAL(
            scope,
            [],
            (scope) => Tree.Bundle(
              [
                Tree.Lone(
                  [],
                  normal(scope, node.body, context.completion)),
                // No context.completion:
                // ==============
                // for (let index = 0; index < 10; index++) {}
                // undefined
                Tree.Lift(
                  Expression.visit(scope, node.update, Expression._default_context))])))))));

// for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}

// Variables in the left hand side belongs to the body of the while but still
// they must be shadowed to the right-hand side.
//
// > for (const x in {a:x, b:2}) { console.log(x) }
// Thrown:
// ReferenceError: Cannot access 'x' before initialization
visitors.ForInStatement = (scope, node, context) => complete(
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
          Scope.NORMAL(
            scope,
            Query._get_block_hoisting([node.left]),
            closure)) :
        closure(scope)))
    (
      (scope) => Scope.Box(
        scope,
        true,
        "StatementForInRight",
        Expression.visit(scope, node.right, Expression._default_context),
        (right_box) => Scope.Box(
          scope,
          true,
          "StatementForInKeys",
          Builtin.construct_array([]),
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
                  Builtin.fork_nullish(
                    () => Scope.get(scope, right_box),
                    Tree.primitive(null),
                    null))),
              Tree.While(
                [],
                Scope.get(scope, right_box),
                Scope.NORMAL(
                  scope,
                  [],
                  (scope) => Tree.Bundle(
                    [
                      Tree.Lift(
                        Scope.set(
                          scope,
                          keys_box,
                          Builtin.concat(
                            [
                              Scope.get(scope, keys_box),
                              Builtin.keys(
                                Scope.get(scope, right_box))]))),
                      Tree.Lift(
                        Scope.set(
                          scope,
                          right_box,
                          Builtin.get_prototype_of(
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
                  Builtin.get(
                    Scope.get(scope, keys_box),
                    Tree.primitive("length"),
                    null),
                  (length_box) => Tree.While(
                    ArrayLite.map(
                      ArrayLite.add(context.labels, null),
                      Stratum._base),
                    Tree.binary(
                      "<",
                      Scope.get(scope, index_box),
                      Scope.get(scope, length_box)),
                    Scope.NORMAL(
                      scope,
                      (
                        node.left.type === "VariableDeclaration" ?
                        Query._get_block_hoisting([node.left]) :
                        []),
                      (scope) => Tree.Bundle(
                        [
                          // It does not mathers to provide the correct name for the closure:
                          // for (let x in (() => {})) { /* cannot access the arrow */ }
                          Tree.Lift(
                            Common.assign(
                              scope,
                              (
                                node.left.type === "VariableDeclaration" ?
                                node.left.kind :
                                null),
                              (
                                node.left.type === "VariableDeclaration" ?
                                node.left.declarations[0].id :
                                node.left),
                              Builtin.get(
                                Scope.get(scope, keys_box),
                                Scope.get(scope, index_box),
                                null),
                              (
                                node.left.type === "VariableDeclaration" &&
                                node.left.kind !== "var"))),
                          Tree.Lone(
                            [],
                            normal(scope, node.body, context.completion)),
                          Tree.Lift(
                            Scope.set(
                              scope,
                              index_box,
                              Tree.binary(
                                "+",
                                Scope.get(scope, index_box),
                                Tree.primitive(1))))])))))]))))));

visitors.ForOfStatement = (scope, node, context) => (
  node.await ?
  abort("Unfortunately, Aran does not yet support asynchronous closures and await for-of statements.") :
  complete(
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
            Scope.NORMAL(
              scope,
              Query._get_block_hoisting([node.left]),
              closure)) :
          closure(scope)))
      (
        (scope) => Scope.Box(
          scope,
          false,
          "StatementForOfRight",
          Expression.visit(scope, node.right, Expression._default_context),
          (right_box) => Scope.Box(
            scope,
            false,
            "StatementForOfIterator",
            Tree.apply(
              Builtin.get(
                Builtin.fork_nullish(
                  () => Scope.get(scope, right_box),
                  null,
                  null),
                Builtin.grab("Symbol.iterator"),
                null),
              Scope.get(scope, right_box),
              []),
            (iterator_box) => Scope.Box(
              scope,
              true,
              "StatementForOfStep",
              Tree.primitive(void 0),
              (step_box) => Tree.While(
                ArrayLite.map(
                  ArrayLite.add(context.labels, null),
                  Stratum._base),
                Tree.sequence(
                  Scope.set(
                    scope,
                    step_box,
                    Tree.apply(
                      Builtin.get(
                        Scope.get(scope, iterator_box),
                        Tree.primitive("next"),
                        null),
                      Scope.get(scope, iterator_box),
                      [])),
                  Tree.unary(
                    "!",
                    Builtin.get(
                      Scope.get(scope, step_box),
                      Tree.primitive("done"),
                      null))),
                // The left pattern does not resides in the body's scope:
                // > let z = 1; for (let [x,y=(console.log("foo"), z)] in {a:1, b:2}) { console.log("bar"); let z }
                // foo
                // bar
                // foo
                // bar
                Scope.NORMAL(
                  scope,
                  (
                    node.left.type === "VariableDeclaration" ?
                    Query._get_block_hoisting([node.left]) :
                    []),
                  (scope) => Tree.Bundle(
                    [
                      Tree.Lift(
                        Common.assign(
                          scope,
                          (
                            node.left.type === "VariableDeclaration" ?
                            node.left.kind :
                            null),
                          (
                            node.left.type === "VariableDeclaration" ?
                            node.left.declarations[0].id :
                            node.left),
                          Builtin.get(
                            Scope.get(scope, step_box),
                            Tree.primitive("value"),
                            null),
                          (
                            node.left.type === "VariableDeclaration" &&
                            node.left.kind !== "var"))),
                      Tree.Lone(
                        [],
                        normal(scope, node.body, context.completion))]))))))))));

visitors.SwitchStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Scope.Box(
    scope,
    false,
    "StatementSwitchDiscriminant",
    Expression.visit(scope, node.discriminant, Expression._default_context),
    (discriminant_box) => Scope.Box(
      scope,
      true,
      "StatementSwitchMatched",
      Tree.primitive(false),
      (matched_box) => Tree.Lone(
        ArrayLite.map(
          ArrayLite.add(context.labels, null),
          Stratum._base),
        Scope.NORMAL(
          scope,
          Query._get_block_hoisting(
            ArrayLite.flatMap(node.cases, get_consequent)),
          (scope, _offset, _nodes) => (
            _offset = 0,
            _nodes = ArrayLite.flatMap(node.cases, get_consequent),
            Tree.Bundle(
              ArrayLite.map(
                _nodes,
                (node) => Prelude.Visit(scope, node, Prelude._default_context)),
              Tree.Bundle(
                ArrayLite.map(
                  node.cases,
                  (node) => (
                    node.test === null ?
                    // This lone block could go away but it is kept for consistency reasons...
                    // #performance-is-not-an-issue
                    Tree.Bundle(
                      [
                        Tree.Lift(
                          Scope.set(
                            scope,
                            matched_box,
                            Tree.primitive(true))),
                        Tree.Lone(
                          [],
                          Scope.CASE(
                            scope,
                            (scope) => Tree.Bundle(
                              ArrayLite.map(
                                node.consequent,
                                (node) => Statement.Visit(
                                  scope,
                                  node,
                                  {
                                    __proto__: Statement._default_context,
                                    completion: Completion._extend(context.completion, _nodes, _offset++)})))))]) :
                    // NB1: The test expression is not evaluated if previous match:
                    // > switch (123) { case 123: console.log("foo"); case console.log("bar"): console.log("qux"); }
                    // foo
                    // bar
                    // NB2: `===` is used and not `Object.is`:
                    // > switch (-0) { case +0: console.log("foo"); }
                    // foo
                    Tree.If(
                      [],
                      Tree.conditional(
                        Scope.get(scope, matched_box),
                        Tree.primitive(true),
                        Tree.conditional(
                          Tree.binary(
                            "===",
                            Scope.get(scope, discriminant_box),
                            Expression.visit(scope, node.test, Expression._default_context)),
                          Tree.sequence(
                            Scope.set(
                              scope,
                              matched_box,
                              Tree.primitive(true)),
                            Tree.primitive(true)),
                          Tree.primitive(false))),
                      Scope.CASE(
                        scope,
                        (scope) => Tree.Bundle(
                          ArrayLite.map(
                            ArrayLite.filterOut(node.consequent, is_function_declaration),
                            (node) => Statement.Visit(
                              scope,
                              node,
                              {
                                __proto__: Statement._default_context,
                                completion: Completion._extend(context.completion, _nodes, _offset++)})))),
                      Scope.CASE(
                        scope,
                        (scope) => Tree.Bundle([])))))))))))));
