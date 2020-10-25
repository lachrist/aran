"use strict";

const global_Error = global.Error;

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

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_String_prototype_substring = global.String.prototype.substring;

exports._default_context = {
  __proto__: null,
  completion: Completion._make_empty(),
  labels: []};

// Scope -> estree.Statement -> Completion -> aran.Block
const block = (scope, node, completion, _nodes) => (
  _nodes = (
    node === null ?
    [] :
    (
      node.type === "BlockStatement" ?
      node.body :
      [node])),
  Scope.EXTEND_STATIC(
    scope,
    Query._get_shallow_hoisting(_nodes),
    (scope) => Tree.Bundle(
      ArrayLite.map(
        ArrayLite.concat(
          ArrayLite.filter(_nodes, Query._is_function_declaration_statement),
          ArrayLite.filter(_nodes, Query._is_not_function_declaration_statement)),
        (node, index, nodes) => Statement.Visit(
          scope,
          node,
          {
            __proto__: Statement._default_context,
            completion: Completion._extend(completion, nodes, index)},
          [])))));

// Scope -> Completion -> aran.Statement -> aran.Statement
const complete = (scope, completion, statement) => Tree.Bundle(
  ArrayLite.concat(
    (
      Completion._is_last(completion) ?
      [
        Tree.Lift(
          Scope.set(
            scope,
            Scope._get_binding_last(scope),
            Tree.primitive(void 0)))] :
      []),
    [statement]));

// Scope -> Init -> Node -> aran.Statement
// type Init = Boolean
// type Node = estree.Declaration
const declare = (scope, init, node) => Tree.Lift(
  Common.assign(
    scope,
    node.id,
    (
      node.id.type === "Identifier" ?
      Scope.box(
        scope,
        "name",
        false,
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
      Expression.visit(scope, node.init, Expression._default_context)), // console.assert(declaration.init !== null)
    init));

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
    Scope.set(
      scope,
      Scope._get_binding_last(scope, context.completion),
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
    (
      (
        () => { throw new global_Error("Break label used as continue label") })
      ()) :
    Tree.Continue(
      Stratum._base(_label))));

visitors.ThrowStatement = (scope, node, context) => Tree.Lift(
  Tree.throw(
    Expression.visit(scope, node.argument, Expression._default_context)));

visitors.ReturnStatement = (scope, node, context) => Tree.Return(
  (
    Scope._get_binding_tag(scope) === "arrow" ||
    Scope._get_binding_tag(scope) === "method") ?
  (
    node.argument === null ?
    Tree.primitive(void 0) :
    Expression.visit(scope, node.argument, Expression._default_context)) :
  (
    Scope._get_binding_tag(scope) === null ?
    (
      (
        () => { throw new global_Error("Unexpected empty closure tag") })
      ()) :
    (
      node.argument === null ?
      (
        Scope._get_binding_tag(scope) === "function" ?
        Tree.conditional(
          Scope.read(scope, "new.target"),
          Scope.read(scope, "this"),
          Tree.primitive(void 0)) :
        ( // console.assert(Scope._get_binding_tag(scope) === "constructor")
          Scope._get_binding_super(scope) === null ?
          Scope.read(scope, "this") :
          Tree.conditional(
            Scope.read(scope, "this"),
            Scope.read(scope, "this"),
            Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")))) :
      Scope.box(
        scope,
        "StatementReturnArgument",
        false,
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
            Scope._get_binding_tag(scope) === "function" ?
            Tree.conditional(
              Scope.read(scope, "new.target"),
              Tree.conditional(
                _expression,
                Scope.get(scope, box),
                Scope.read(scope, "this")),
              Scope.get(scope, box)) :
            ( // console.assert(Scope._get_binding_tag(scope) === "constructor")
              Scope._get_binding_super(scope) === null ?
              Tree.conditional(
                _expression,
                Scope.get(scope, box),
                Scope.read(scope, "this")) :
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
                  Builtin.throw_type_error("Derived constructors may only return object or undefined"))))))))));

/////////////////
// Declaration //
/////////////////

visitors.VariableDeclaration = (scope, node, context) => Tree.Bundle(
  ArrayLite.map(
    node.declarations,
    (declaration) => declare(scope, node.kind !== "var", declaration)));

visitors.FunctionDeclaration = (scope, node, context) => Tree.Lift(
  Scope.write(
    scope,
    node.id.name,
    Common.closure(
      scope,
      node,
      Expression._default_context)));

visitors.ClassDeclaration = (scope, node, context) => Tree.Lift(
  Scope.initialize(
    scope,
    node.id.name,
    Common.class(
      scope,
      node,
      Expression._default_context)));

//////////////
// Compound //
//////////////

visitors.BlockStatement = (scope, node, context) => Tree.Lone(
  ArrayLite.map(context.labels, Stratum._base),
  block(scope, node, context.completion));

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
    block(
      scope,
      node.consequent,
      context.completion),
    block(
      scope,
      node.alternate,
      context.completion)));

visitors.TryStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Tree.Try(
    ArrayLite.map(context.labels, Stratum._base),
    block(scope, node.block, context.completion),
    Scope.EXTEND_STATIC(
      scope,
      (
        (
          node.handler === null ||
          node.handler.param === null) ?
        {__proto__: null} :
        Query._get_parameter_hoisting(node.handler.param)),
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
            ArrayLite.concat(
              (
                node.handler.param === null ?
                [] :
                [
                  Tree.Lift(
                    Common.assign(
                      scope,
                      node.handler.param,
                      Scope.parameter(scope, "error"),
                      true))]),
              [
                Tree.Lone(
                  [],
                  block(scope, node.handler.body, context.completion))]))))),
    block(
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
    "StatementWithFrame",
    true,
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
          block(
            Scope._extend_with(scope, frame_box),
            node.body,
            context.completion))])));

visitors.WhileStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Tree.While(
    ArrayLite.map(
      ArrayLite.add(context.labels, null),
      Stratum._base),
    Expression.visit(scope, node.test, Expression._default_context),
    block(scope, node.body, context.completion)));

visitors.DoWhileStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Scope.Box(
    scope,
    "StatementDoWhileEntrance",
    true,
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
      block(scope, node.body, context.completion))));

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
                  (declaration) => declare(scope, false, declaration)),
                [
                  closure(scope)])) :
            Tree.Lone(
              [],
              Scope.EXTEND_STATIC(
                scope,
                Query._get_shallow_hoisting([node.init]),
                (scope) => Tree.Bundle(
                  ArrayLite.concat(
                    ArrayLite.map(
                      node.init.declarations,
                      (declaration) => declare(scope, true, declaration)),
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
          block(scope, node.body, context.completion) :
          Scope.EXTEND_STATIC(
            scope,
            {__proto__:null},
            (scope) => Tree.Bundle(
              [
                Tree.Lone(
                  [],
                  block(scope, node.body, context.completion)),
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
          Scope.EXTEND_STATIC(
            scope,
            Query._get_shallow_hoisting([node.left]),
            closure)) :
        closure(scope)))
    (
      (scope) => Scope.Box(
        scope,
        "StatementForInRight",
        true,
        Expression.visit(scope, node.right, Expression._default_context),
        (right_box) => Scope.Box(
          scope,
          "StatementForInKeys",
          true,
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
                Scope.EXTEND_STATIC(
                  scope,
                  {__proto__:null},
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
                "StatementForInIndex",
                true,
                Tree.primitive(0),
                (index_box) => Scope.Box(
                  scope,
                  "StatementForInLength",
                  false,
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
                    Scope.EXTEND_STATIC(
                      scope,
                      (
                        node.left.type === "VariableDeclaration" ?
                        Query._get_shallow_hoisting([node.left]) :
                        {__proto__:null}),
                      (scope) => Tree.Bundle(
                        [
                          // It does not mathers to provide the correct name for the closure:
                          // for (let x in (() => {})) { /* cannot access the arrow */ }
                          Tree.Lift(
                            Common.assign(
                              scope,
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
                            block(scope, node.body, context.completion)),
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
  (
    (
      () => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous closures and await for-of statements.") })
    ()) :
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
            Scope.EXTEND_STATIC(
              scope,
              Query._get_shallow_hoisting([node.left]),
              closure)) :
          closure(scope)))
      (
        (scope) => Scope.Box(
          scope,
          "StatementForOfRight",
          false,
          Expression.visit(scope, node.right, Expression._default_context),
          (right_box) => Scope.Box(
            scope,
            "StatementForOfIterator",
            false,
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
              "StatementForOfStep",
              true,
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
                Scope.EXTEND_STATIC(
                  scope,
                  (
                    node.left.type === "VariableDeclaration" ?
                    Query._get_shallow_hoisting([node.left]) :
                    {__proto__: null}),
                  (scope) => Tree.Bundle(
                    [
                      Tree.Lift(
                        Common.assign(
                          scope,
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
                        block(scope, node.body, context.completion))]))))))))));

visitors.SwitchStatement = (scope, node, context) => complete(
  scope,
  context.completion,
  Scope.Box(
    scope,
    "StatementSwitchDiscriminant",
    false,
    Expression.visit(scope, node.discriminant, Expression._default_context),
    (discriminant_box) => Scope.Box(
      scope,
      "StatementSwitchMatched",
      true,
      Tree.primitive(false),
      (matched_box) => Tree.Lone(
        ArrayLite.map(
          ArrayLite.add(context.labels, null),
          Stratum._base),
        Scope.EXTEND_STATIC(
          scope,
          Query._get_shallow_hoisting(
            ArrayLite.flatMap(node.cases, Query._get_consequent_case)),
          (scope, _nodes1, _nodes2, _offset) => (
            _nodes1 = ArrayLite.filter(
              ArrayLite.flatMap(node.cases, Query._get_consequent_case),
              Query._is_function_declaration_statement),
            _nodes2 = ArrayLite.filter(
              ArrayLite.flatMap(node.cases, Query._get_consequent_case),
              Query._is_not_function_declaration_statement),
            _offset = 0,
            Tree.Bundle(
              ArrayLite.concat(
                ArrayLite.map(
                  _nodes1,
                  (node) => Statement.Visit(scope, node, Statement._default_context)),
                ArrayLite.map(
                  node.cases,
                  (node, index, nodes) => (
                    (
                      index === 0 ?
                      null :
                      _offset += ArrayLite.filter(nodes[index - 1].consequent, Query._is_not_function_declaration_statement).length),
                    (
                      node.test === null ?
                      // This lone block could go away but it is kept to bundle the consequent statements together...
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
                            Scope.EXTEND_STATIC(
                              scope,
                              {__proto__:null},
                              (scope) => Tree.Bundle(
                                ArrayLite.map(
                                  ArrayLite.filter(node.consequent, Query._is_not_function_declaration_statement),
                                  (node, index, nodes) => Statement.Visit(
                                    scope,
                                    node,
                                    {
                                      __proto__: Statement._default_context,
                                      completion: Completion._extend(context.completion, _nodes2, _offset + index)})))))]) :
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
                        Scope.EXTEND_STATIC(
                          scope,
                          {__proto__:null},
                          (scope) => Tree.Bundle(
                            ArrayLite.map(
                              ArrayLite.filter(node.consequent, Query._is_not_function_declaration_statement),
                              (node, index, nodes) => Statement.Visit(
                                scope,
                                node,
                                {
                                  __proto__: Statement._default_context,
                                  completion: Completion._extend(context.completion, _nodes2, _offset + index)})))),
                        Scope.EXTEND_STATIC(
                          scope,
                          {__proto__:null},
                          (scope) => Tree.Bundle([]))))))))))))));
