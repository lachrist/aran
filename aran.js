
// Output:
//
// aran.compile
// aran.load
// aran.with
// aran.for
// aran.push[1->3]
// aran.pop[1->3]
// aran.mark
// aran.unmark
// aran.swindow
// aran.seval
// window.$window
// window.$eval

// Require:
//
// aran
// aran.traps
// aran.hooks
// miley
// exprima
// escodegen

(function () {

  ///////////////
  // Top-level //
  ///////////////

  aran.load = function (src, async) {
    var req = XMLHttpsRequest()
    if (async) {
      req.onreadystatechange = function () {
        if (req.readyState === 4) {
          if (req.status !== 200) { throw new Error("Cannot fetch resource "+src) }
          window.eval(aran.compile(req.responseText))
        }
      }
      req.open("get", src)
      send()
    } else {
      req.open("get", src, false)
      req.send()
      if (req.status !== 200) { throw new Error("Cannot fetch resource "+src) }
      window.aran.eval(req.responseText)
    }
  }

  aran.compile = function (code) {
    console.log(code)
    var ast = esprima.parse(code)
    console.log(JSON.stringify(ast))
    if (ast.type !== "Program") { throw new Error(node) }
    prepend(flaten(ast.body.map(visit_stmt)), ast.body)
    if (aran.hooks.program) {
      ast.body.unshift({
        type: "ExpressionsStatement",
        expression: call(shadow("hooks", "program"), [literal(ast.body.length)])
      })
    }
    console.log("POST")
    console.log(JSON.stringify(ast))
    code = escodegen.generate(ast)
    console.log(code)
    return code
  }

  //////////////
  // Visitors //
  //////////////

  var visit_stmt
  var visit_expr
  (function () {
    visit_stmt = function (node, decls) { return visit(node, true) }
    visit_expr = function (node) { return visit(node, false) }
    function visit (node, is_stmt) {
      var parts = miley(node)
      // Hooks //
      if (aran.hooks[node.type]) {
        var copy = extract(node)
        var hook = call(shadow("hooks", copy.type), parts.infos.map(nodify))
        if (is_stmt) {
          node.type = "BlockStatement"
          node.body = [expr_stmt(hook), copy]
        } else {
          node.type = "SequenceExpression"
          node.expressions = [hook, copy]
        }
        node = copy
      }
      // Declarations //
      if (node.type === "FunctionExpression") { var body = node.body }
      if (node.type === "FunctionDeclaration") {
        var body = node.body
        var decl = node
        node = extract(node)
        decl.type = "EmptyStatement"
      }
      // Traps //
      if (is_stmt) { if (stmt_traps[node.type]) { stmt_traps[node.type](node) } }
      else { if (expr_traps[node.type]) { inject(expr_traps[node.type](extract(node)), node) } }
      // Recursion //
      parts.exprs.forEach(visit_expr)
      var decls = flaten(parts.stmts.map(visit_stmt))
      if (body) {
        prepend(decls, body)
        if (decl) { return [node] }
        return []
      }
      return decls
    }
  } ())

  /////////////
  // Utility //
  /////////////

  function flaten (xss) {
    return xss.reduce(function (xs, ys) { return xs.concat(ys) }, [])
  }

  function prepend (xs, ys) {
    for (var i=xs.length-1; i>=0; i--) { ys.unshift(xs[i]) }
  }

  function extract (o1) {
    var o2 = {}
    for (var k in o1) {
      o2[k] = o1[k]
      delete o1[k]
    }
    return o2
  }

  function inject (o1, o2) {
    var k
    for (k in o2) { delete o2[k] }
    for (k in o1) { o2[k] = o1[k] }
  }

  //////////////
  // Builders //
  //////////////

  function nodify (x) {
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

  function wrap (node) {
    if (!aran.traps.wrap) { return node }
    return call(shadow("traps", "wrap"), [node])
  }

  function unwrap (node) {
    if (!aran.traps.unwrap) { return node }
    return call(shadow("traps", "unwrap"), [node])
  }

  function shadow () {
    var node = identifier("aran")
    for (var i in arguments) {
      node = member(node, arguments[i])
    }
    return node
  }

  function empty () {
    return { type: "EmptyStatement" }
  }

  function identifier (name) {
    return {
      type: "Identifier",
      name: name
    }
  }

  function literal (value) {
    return {
      type: "Literal",
      value: value
    }
  }

  function member (object, k) {
    return {
      type: "MemberExpression",
      computed: (typeof k !== "string"),
      object:object,
      property: (typeof k === "string")?identifier(k):k
    }
  }

  function block (body) {
    return {
      type: "BlockStatement",
      body: body
    }
  }

  function call (callee, arguments) {
    return {
      type: "CallExpression",
      callee: callee,
      arguments: arguments
    }
  }

  function array (elements) {
    return {
      type: "ArrayExpression",
      elements: elements
    }
  }

  function declaration (id, init) {
    return {
      type: "VariableDeclaration",
      kind: "var",
      declarations: [{type:"VariableDeclarator", id:id, init:init}]
    }
  }

  function conditional (test, consequent, alternate) {
    return {
      type: "ConditionalExpression",
      test: test,
      consequent: consequent,
      alternate: alternate
    }
  }

  function sequence (expressions) {
    return {
      type: "SequenceExpression",
      expressions: expressions
    }
  }

  function assignment (left, right) {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: left,
      right: right
    }
  }

  function expr_stmt (expression) {
    return {
      type: "ExpressionStatement",
      expression: expression
    }
  }

  function binary (operator, left, right) {
    return {
      type: "BinaryExpression",
      operator: operator,
      left: left,
      right: right
    }
  }

  ////////////
  // Stacks //
  ////////////

  var marks = []
  var stack = []
  var stack1 = []
  var stack2 = []
  var stack3 = []
  aran.push = function (x) { return stack.push(x) }
  aran.push1 = function (x) { return stack1.push(x) }
  aran.push2 = function (x) { return stack2.push(x) }
  aran.push3 = function (x) { return stack3.push(x) }
  aran.pop = function () { return stack.pop() }
  aran.pop1 = function () { return stack1.pop() }
  aran.pop2 = function () { return stack1.pop() }
  aran.pop3 = function () { return stack1.pop() }
  aran.get = function () { return stack[stack1.length] }
  aran.get1 = function () { return stack1[stack1.length] }
  aran.get2 = function () { return stack2[stack2.length] }
  aran.get3 = function () { return stack2[stack2.length] }

  aran.mark = function () {
    var mark = marks.push({})
    stack.push(mark)
    stack1.push(mark)
    stack2.push(mark)
    stack3.push(mark)
  }
  
  (function () {
    aran.unmark = function () {
      var mark = marks.pop()
      unmark(stack, mark)
      unmark(stack1, mark)
      unmark(stack2, mark)
      unmark(stack3, mark)
    }
    function unmark (stack, mark) {
      if (stack.pop() !== mark) { unmark(stack, mark) }
    }
  } ())

  ////////////////////
  // Runtime Access //
  ////////////////////

  aran.swindow = {}
  if (window.Proxy) {
    aran.swindow = new window.Proxy ({}, {
      getOwnPropertyDescriptor: function (_, k) { return Object.getOwnPropertyDescriptor(window, "$"+k) },
      ownKeys: function (_) {
        var keys = []
        Object.keys(window).map(function (k) {
          k = String(k)
          if (k.substring[0] === "$") { keys.push(k.substring(1)) }
        })
        return keys
      },
      defineProperty: function (_, k, d) { return Object.defineProperty(window, "$"+k, d) },
      deleteProperty: function (_, k) { return delete window["$"+k] },
      preventExtensions: function () { return Object.preventExtensions(window) },
      has: function (_, k) { return ("$"+k) in window },
      get: function (_, k) { return window["$"+k] },
      set: function (_, k, v) { return window["$"+k] = v },
      enumerate: function (_) {
        var keys = []
        for (var key in window) {
          if (key.substring(0,1) === "$") { keys.push(key.substring(1)) }
        }
      }
    })
  }
  if (aran.traps.wrap) { aran.swindow = aran.traps.wrap(aran.swindow) }
  window.$window = aran.swindow

  aran.with = function (o) {
    var handlers = {}
    if (aran.traps.binary) {
      handlers.has = function (o, k) { return aran.traps.binary("in", String(k).substring(1), o) }
    } else {
      handlers.has = function (o,k) { return String(k).substring(1) in o }
    }
    if (aran.traps.get) {
      handlers.get = function (o, k) { return aran.traps.get(o, String(k).substring(1)) }
    } else {
      handlers.get = function (o, k) { return o[String(k).substring(1)] }
    }
    if (aran.traps.set) {
      handlers.set = function (o, k, v) { return aran.traps.set(o, String(k).substring(1), v) }
    } else {
      handlers.set = function (o, k, v) { return o[String(k).substring(1)] = v }
    }
    if (!window.Proxy) { window.alert("JavaScript proxies are needed to support with statements") }
    return new Proxy(o, handlers)
  }
  
  aran.for = function (o) {
    if (!window.Proxy) { window.alert("JavaScript proxies are needed to suport for-in statement with member expression as left parts") }
    return new Proxy(o, { set: function (o, k, v) { return aran.traps.set(o, k, v) } })
  }

  /////////////
  // Helpers //
  /////////////

  function compute_member (node) {
    if (!node.computed) {
      if (node.property.type !== "Identifier") { throw new Error(node) }
      node.computed = true
      node.property = literal(node.property.name)
    }
  }

  /////////////////////
  // Statement Traps //
  /////////////////////

  var stmt_traps = {}

  // if (EXPR) STMT             >>> if (aran.traps.unwrap(EXPR)) STMT
  // if (EXPR) STMT1 else STMT2 >>> if (aran.traps.unwrap(EXPR)) STMT1 else STMT2
  stmt_traps.IfStatement = function (node) {
    node.test = unwrap(node.test)
  }

  // with (EXPR) STMT >>> with (aran.with(EXPR)) STMT
  stmt_traps.WithStatement = function (node) {
    inject(call(shadow("with"), [extract(node.test)]), node.test)
  }

  // switch (EXPR0) { case EXPR:STMT } >>> switch (aran.traps.unwrap(EXPR0)) { case aran.traps.unwrap(EXPR1): STMT }
  // etc...
  stmt_traps.SwitchStatement = function (node) {
    node.discriminant = unwrap(node.discriminant)
    node.cases.forEach(function (c) {if (c.test) { c.test = unwrap(c.test) }})
  }

  // try {} catch (ID) {} finally {} >>> try { aran.mark() } catch ($ID) {} finally { aran.ummark() }
  stmt_traps.TryStatement = function (node) {
    node.block.body.unshift(expr_stmt(call(shadow("mark"), [])))
    if (node.handler) { node.handler.param.name = "$"+node.handler.param.name }
    if (!node.finalyzer) { node.finalyzer = block([]) }
    node.finalyzer.body.unshift(expr_stmt(call(shadow("unmark"), [])))
  }

  // while (EXPR) STMT >>> while (aran.unwrap(EXPR)) STMT
  stmt_traps.WhileStatement = function (node) {
    node.test = unwrap(node.test)
  }

  // do STMT while (EXPR) >>> do STMT while (aran.unwrap(EXPR))
  stmt_traps.DoWhileStatement = function (node) {
    node.test = unwrap(node.test)
  }

  // for (EXPR1 ; EXPR2 ; EXPR3) STMT >>> for (EXPR1 ; aran.traps.unwrap(EXPR2) ; EXPR3) STMT
  // for (var ID1,ID2; EXPR2; EXPR3) STMT >>> for (var $ID1,$ID2; EXPR2; EXPR3) STMT
  // etc...
  stmt_traps.ForStatement = function (node) {
    if (node.test) { unwrap(node.test) }
    if (node.init && node.init.type === "VariableDeclaration") {
      node.init.declarations.forEach(function (d) { d.name = "$"+d.name })
    }
  }

  // for (var ID in EXPR) STMT        >>> for (var $ID in EXPR) STMT
  // for (ID in EXPR) STMT            >>> for ($ID in EXPR) STMT
  // for (EXPR1[EXPR2] in EXPR3) STMT >>> for (aran.for(EXPR1)[EXPR2] in EXPR3) STMT
  // for (EXPR1.ID in EXPR2) STMT     >>> for (aran.for(EXPR1)["ID"] in EXPR2) STMT
  stmt_traps.ForInStatement = function (node) {
    if (node.left.type === "VariableDeclaration") {
      node.left.declarations[0].id.name = "$"+node.left.declarations[0].id.name
    } else if (node.left.type === "Identifier") {
      node.left.name = "$"+node.left.name
    } else if (node.left.type === "MemberExpression") {
      if (aran.traps.set) { node.left.object = call(shadow("for"), [node.left.object]) }
    } else {
      throw new Error(node)
    }
  }

  // function ID (ID1,ID2) {} >>> var $ID = aran.traps.wrap(function ID (ID1,ID2) {})
  // etc...
  stmt_traps.FunctionDeclaration = function (node) {
    node.type = "FunctionExpression"
    node.params.forEach(function (p) { p.name = "$"+p.name })
    inject(declaration(identifier("$"+node.id.name), wrap(extract(node))), node)
  }

  // var ID1=EXPR1, ID2=EXPR2 >>> var $ID1=EXPR1, $ID2=EXPR2
  // etc...
  stmt_traps.VariableDeclaration = function (node) {
    node.declarations.forEach(function (d) { d.id.name = "$"+d.id.name })
  }

  //////////////////////
  // Expression Traps //
  //////////////////////

  var expr_traps = {}

  // this >>> this===window?aran.swindow:this
  expr_traps.ThisExpression = function (node) {
    return conditional(binary("===", node, identifier("window")), shadow("swindow"), node)
  }

  // [EXPR1,,EXPR2] >>> aran.traps.wrap([EXPR1,,EXPR2])
  // etc...
  expr_traps.ArrayExpression = wrap

  // {ID1:EXPR2, ID2:EXPR2} >>> aran.traps.wrap({ID1:EXPR2, ID2:EXPR2})
  // etc...
  expr_traps.ObjectExpression = wrap

  // function (ID1, ID2) {} = aran.traps.wrap(function ($ID1,$ID2) {})
  // etc...
  expr_traps.FunctionExpression = function (node) {
    node.params.forEach(function (p) { p.name = "$"+p.name })
    return wrap(node)
  }

  // void EXPR           >>> aran.traps.unary("void", EXPR)
  // delete ID           >>> aran.traps.unary("delete", aran.swindow, "ID")
  // delete EXPR.ID      >>> aran.traps.unary("delete", EXPR, "ID")
  // delete EXPR1[EXPR2] >>> aran.traps.unary("delete", EXPR1, EXPR2)
  // delete EXPR         >>> aran.traps.unary("delete", EXPR)
  expr_traps.UnaryExpression = function (node) {
    if (node.operator !== "delete") {
      if (!aran.traps.unary) { return node }
      return call(shadow("traps", "unary"), [literal(node.operator), node.argument])
    }
    if (!aran.traps.delete) { return node }
    var args = [literal(node.operator)]
    if (node.argument.type === "Identifier") {
      args.push(shadow("swindow"))
      args.push(literal(node.argument.name))
    } else if (node.argument.type === "MemberExpression") {
      compute_member(node.argument)
      args.push(node.argument.object)
      args.push(node.argument.property)
    } else {
      args.push(node)
    }
    return call(shadow("traps", "delete"), args)
  }

  // EXPR1 OP EXPR2 >>> aran.traps.binary("OP", EXPR1, EXPR2)
  expr_traps.BinaryExpression = function (node) {
    if (!aran.traps.binary) { return node }
    return call(shadow("traps", "binary"), [literal(node.operator), node.left, node.right])
  }

  // TODO += is bugged
  // ID = <EXPR>                >>> $ID = <EXPR>
  // ID OP= <EXPR>              >>> $ID = aran.traps.binary("OP", $ID, <EXPR>)
  // <EXPR1>[<EXPR2>] = <EXPR3> >>> aran.traps.set(<EXPR1>, <EXPR2>, <EXPR3>)
  // <EXPR1>[<EXPR2>] OP= <EXPR3>
  // >>> (aran.push1(<EXPR1>),
  //      aran.push2(<EXPR2>),
  //      aran.traps.set(aran.get1(), aran.get2(), aran.traps.binary("OP", aran.traps.get(aran.pop1(), aran.pop2()), <EXPR3>)
  expr_traps.AssignmentExpression = function (node) {
    if (node.left.type === "Identifier") {
      node.left.name = "$"+node.left.name
      if (node.operator === "=") { return node }
    } else if (node.left.type === "MemberExpression") {
      compute_member(node.left)
      if (node.operator === "=") {
        if (!aran.traps.set) { return node }
        return call(shadow("traps", "set"), [node.left.object, node.left.property, node.right])
      }
    } else {
      throw new Error(node)
    }
    var op = literal(node.operator.replace("=", ""))
    if (node.left.type === "Identifier") {
      node.operator = "="
      node.right = call(shadow("traps", "binary"), [op, identifier(node.left.name), node.argument])
      return node
    }
    if (node.left.type !== "MemberExpression") { throw new Error (node) }
    compute_member(node.left)
    var get1 = call(shadow("get1"), [])
    var get2 = call(shadow("get2"), [])
    var pop1 = call(shadow("pop1"), [])
    var pop2 = call(shadow("pop2"), [])
    var get, val, seq3
    (aran.traps.get)?(get=call(shadow("traps", "get"), [pop1, pop2])):(get=member(pop1, pop2))
    (aran.traps.binary)?(val=call(shadow("traps.binary"), [op, get, node.right])):(binary(op.value, get, node.right))
    (aran.traps.set)?(seq3=call(shadow("traps", "set"), [get1, get2, val])):seq3=assignment(member(get1, get2), val)
    var seq1 = call(shadow("push1"), [node.left.object])
    var seq2 = call(shadow("push2"), [node.left.property])
    return sequence([seq1, seq2, seq3])
  }

  // ++ID          >>> $ID=aran.traps.binary("+", $ID, 1)
  // ID++          >>> (aran.push($ID), $ID=aran.traps.binary("+", $ID, 1), aran.pop())
  // ++EXPR1[EXPR2]  >>> (aran.push(EXPR1), aran.push(EXPR2), aran.traps.set(aran.get1(), aran.get2(), binar))
  // EXPR[EXPR]+++ >>>
  // TODO
  expr_traps.UpdateExpression = function (node) {
    window.alert("Update expression (e.g. x++) are not supported (yet)")
  }

  // EXPR1 && EXPR2 >>> (aran.push(EXPR1), aran.traps.unwrap(aran.get()) ? (aran.pop(),EXPR2) : aran.pop())
  // EXPR1 || EXPR2 >>> (aran.push(EXPR1), aran.traps.unwrap(aran.get()) ? aran.pop() : (aran.pop(),EXPR2))
  expr_traps.LogicalExpression = function (node) {
    var test = call(shadow("get"), [])
    test = unwrap(test)
    var cons = sequence([call(shadow("pop"), []), node.right])
    var alt = call(shadow("pop"), [])
    if (node.operator === "||") { alt = [cons, cons=alt][0] }
    return sequence([call(shadow("push"), [node.left]), conditional(test, cons, alt)])
  }

  // EXPR1 ? EXPR2 : EXPR3 >>> aran.traps.unwrap(EXPR1) ? EXPR2 : EXPR3
  expr_traps.ConditionalExpression = function (node) {
    node.test = unwrap(node.test)
    return node
  }

  // new EXPR(EXPR1, EXPR2) >>> aran.traps.new(EXPR, [EXPR1, EXPR2])
  // etc..
  expr_traps.NewExpression = function (node) {
    if (!aran.traps.new) { return node }
    return call(shadow("traps", "new"), [node.callee, array(node.arguments)])
  }

  // eval(EXPR) >>> (aran.push(EXPR), ($eval===aran.seval) ? eval(aran.compile(aran.unwrap(aran.pop()))) : aran.traps.call($eval, aran.pop()))
  // EXPR(EXPR1, EXPR2) >>> aran.traps.apply(EXPR, [EXPR1, EXPR2])
  // etc...
  //   if (aran.traps.apply) {
  //   if (node.callee.type === "Identifier" && node.callee.name === "eval") {
  //     var test = binary("===", identifier("$eval"), shadow("seval")) 
  //     var cons = call(identifier("eval"), [call(shadow("compile"), [call(shadow("unwrap"), [call(shadow("pop"), [])])])])
  //     var alt = call(shadow("traps", "apply"), [identifier("$eval"), array([call(shadow("pop"), [])])]) 
  //     inject(sequence([call(shadow("push"), node.arguments), conditional(test, cons, alt)]))
  //   } else { inject(call(shadow("traps", "apply"), [node.callee, array(node.arguments)]), node) }
  // }
  // TODO eval
  expr_traps.CallExpression = function (node) {
    if (!aran.traps.apply) { return node }
    return call(shadow("traps", "apply"), [node.callee, array(node.arguments)])
  }

  // EXPR.ID      >>> aran.traps.get(EXPR, "ID")
  // EXPR1[EXPR2] >>> aran.traps.get(EXPR1, EXPR2)
  expr_traps.MemberExpression = function (node) {
    if (!aran.traps.get) { return node }
    compute_member(node)
    return call(shadow("traps", "get"), [node.object, node.property])
  }

  // ID >>> $ID
  expr_traps.Identifier = function (node) {
    node.name = "$"+node.name
    return node
  }

  // LIT >>> aran.traps.wrap(LIT)
  expr_traps.Literal = wrap

} ());
