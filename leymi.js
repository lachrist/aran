
(function () {

  var leymi = {}
  window.aran.leymi = leymi

  //////////////
  // Standard //
  //////////////

  leymi.nodify = function (x) {
    if (x === null) { return {type:"Literal", value:x} }
    if (x instanceof RegExp) { return {type:"Literal", value:x} }
    if (["boolean", "string", "number"].indexOf(typeof x) !== -1) { return {type:"Literal", value:x} }
    if (x instanceof Array) { return { type:"ArrayExpression", elements:x.map(nodify) } }
    if (typeof x !== "object") { throw new Error ("Unknown type for "+x) }
    var node = {type:"ObjectExpression", properties:[]}
    for (var k in x) {
      node.properties.push({
        type: "Property",
        key: {type:"Identifier", name:k},
        value: nodify(x[k]),
        kind: "init"
      })
    }
    return node
  }

  leymi.empty = function () {
    return { type: "EmptyStatement" }
  }

  leymi.identifier = function (name) {
    return {
      type: "Identifier",
      name: name
    }
  }

  leymi.literal = function (value) {
    return {
      type: "Literal",
      value: value
    }
  }

  leymi.member = function (object, k) {
    return {
      type: "MemberExpression",
      computed: (typeof k !== "string"),
      object:object,
      property: (typeof k === "string")?identifier(k):k
    }
  }

  leymi.block = function (body) {
    return {
      type: "BlockStatement",
      body: body
    }
  }

  leymi.call = function (callee, arguments) {
    return {
      type: "CallExpression",
      callee: callee,
      arguments: arguments
    }
  }

  leymi.array = function (elements) {
    return {
      type: "ArrayExpression",
      elements: elements
    }
  }

  leymi.declaration = function (id, init) {
    return {
      type: "VariableDeclaration",
      kind: "var",
      declarations: [{type:"VariableDeclarator", id:id, init:init}]
    }
  }

  leymi.conditional = function (test, consequent, alternate) {
    return {
      type: "ConditionalExpression",
      test: test,
      consequent: consequent,
      alternate: alternate
    }
  }

  leymi.sequence = function (expressions) {
    return {
      type: "SequenceExpression",
      expressions: expressions
    }
  }

  leymi.assignment = function (left, right) {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: left,
      right: right
    }
  }

  leymi.expr_stmt = function (expression) {
    return {
      type: "ExpressionStatement",
      expression: expression
    }
  }

  leymi.try_stmt = function (try_stmts, catch_clause, finally_stmts) {
    return {
      type: "TryStatement",
      block: block(try_stmts),
      guardedHandlers: [],
      handlers: catch_clause?[catch_clause]:[],
      finalizer: finally_stmts?block(finally_stmts):null
    }
  }

  leymi.binary = function (operator, left, right) {
    return {
      type: "BinaryExpression",
      operator: operator,
      left: left,
      right: right
    }
  }

  leymi.for_stmt = function (init, test, update, body) {
    return {
      type: "ForStatement",
      init: init,
      test: test,
      update: update,
      body: body
    }
  }

  //////////////
  // Specific //
  //////////////

  function shadow () {
    for (var i=1; i<arguments.length; i++) { args.push(arguments[i]) }
    return leymi.call(member(identifier("aran"), arguments[0]), args)
  }

  leymi.trap = function () {
    var name = arguments[0]
    if (!aran.traps[name]) { return }
    for (var i=1; i<arguments.length; i++) { args.push(arguments[i]) }
    return leymi.call(member(member(identifier("aran"), "traps"), name), args)
  }

  // leymi.wrap = function (node) {
  //   if (!aran.traps.wrap) { return node }
  //   return call(shadow("traps", "wrap"), [node])
  // }

  // leymi.unwrap = function (node) {
  //   if (!aran.traps.unwrap) { return node }
  //   return call(shadow("traps", "unwrap"), [node])
  // }

  leymi.push = function (x) { return leymi.shadow("push", [x]) }
  leymi.push1 = function (x) { return leymi.shadow("push1" [x]) }
  leymi.push2 = function (x) { return leymi.(shadow("push2", [x]) }
  leymi.push3 = function (x) { return leymi.shadow("push3", [x]) }
  leymi.pop = function () { return leymi.shadow("pop", []) }
  leymi.pop1 = function () { return leymi.shadow("pop1", []) }
  leymi.pop2 = function () { return leymi.shadow("pop2", []) }
  leymi.pop3 = function () { return leymi.shadow("pop3", []) }
  leymi.get = function () { return leymi.shadow("get", []) }
  leymi.get1 = function () { return leymi.shadow("get1", []) }
  leymi.get2 = function () { return leymi.shadow("get2", []) }
  leymi.get3 = function () { return leymi.shadow("get3", []) }

} ())

