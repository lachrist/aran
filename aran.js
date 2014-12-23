
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

  aran.initialize = function () {
    // window
    if (window.Proxy) {
      aran.saved_window = new Proxy ({}, {
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
    } else { aran.saved_window = {} }
    if (aran.traps.wrap) { aran.saved_window = aran.traps.wrap(aran.saved_window) }
    window.$window = aran.saved_window
    // eval
    aran.saved_eval = function (code) { return window.eval(aran.compile(code)) }
    if (aran.traps.wrap) { aran.saved_eval = aran.traps.wrap(aran.saved_eval) }
    window.$eval = aran.saved_eval
    // Function
    window.$Function = function () {
      var args = []
      for (var i=0; i<arguments.length-1; i++) { args.push("$"+arguments[i]) }
      var body = arguments[arguments.length]
      return window.eval(aran.compile("function ("+args.join(",")+" {\n"+body+"\n}"))
    }
    if (aran.traps.wrap) { window.$Function = aran.traps.wrap(window.$Function) }
  }


  // function populate (path, x) {
  //   if (typeof x !== "object") { return aran.traps.global?aran.traps.global(path, x):x }
  //   var o = {}
  //   Object.ownKeys function(x)

  //   for (var k in x) {
  //     o.k = populate(path.slice().push(k), o[k])
  //   }
  //   return o
  // }

  aran.compile = function (code) {
    var ast = esprima.parse(code, {tolerant:true})
    if (ast.type !== "Program") { throw new Error(node) }
    prepend(flaten(ast.body.map(visit_stmt)), ast.body)
    if (aran.hooks.program) {
      ast.body.unshift({
        type: "ExpressionsStatement",
        expression: call(shadow("hooks", "program"), [literal(ast.body.length)])
      })
    }
    return escodegen.generate(ast)
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
      var parts = aran.miley(node)
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

  aran.with = function (o) {
    if (!window.Proxy) { window.alert("JavaScript proxies are needed to support \"with\" statements") }
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
    return new Proxy(o, handlers)
  }

  // aran.for_left = function (o) {
  //   if (!window.Proxy) { window.alert("JavaScript proxies are needed to suport for-in statement with member expression as left parts") }
  //   return new Proxy(o, { set: function (o, k, v) { return aran.traps.set(o, k, v) } })
  // }

  aran.enumerate = function (o) {
    var ks = []
    for (var k in o) { ks.push(k) }
    return ks
  }

  /////////////
  // Helpers //
  /////////////

  function compute_member (node) {
    if (!node.computed) {
      if (node.property.type !== "Identifier") { throw new Error(node) }
      node.computed = true
      if (aran.traps.wrap) { node.property = call(shadow("traps", "wrap"), [literal(node.property.name)]) }
      else { node.property = literal(node.property.name) }
    }
  }

  /////////////////////
  // Statement Traps //
  /////////////////////

  var stmt_traps = {}

  // if (EXPR) STMT             >>> if (aran.traps.unwrap(EXPR)) STMT
  // if (EXPR) STMT1 else STMT2 >>> if (aran.traps.unwrap(EXPR)) STMT1 else STMT2
  stmt_traps.IfStatement = function (node) {
    node.test = azir.trap("unwrap", node.test)
  }

  // with (EXPR) STMT >>> with (aran.with(EXPR)) STMT
  stmt_traps.WithStatement = function (node) {
    inject(azir.shadow("with", [extract(node.test)]), node.test)
  }

  // switch (EXPR0) { case EXPR:STMT } >>> switch (aran.traps.unwrap(EXPR0)) { case aran.traps.unwrap(EXPR1): STMT }
  // etc...
  stmt_traps.SwitchStatement = function (node) {
    node.discriminant = azir.trap("unwrap", node.discriminant)
    node.cases.forEach(function (c) { if (c.test) { c.test = azir.trap("unwrap", c.test) } })
  }

  // try {} catch (ID) {} finally {} >>> try { aran.mark() } catch ($ID) {} finally { aran.ummark() }
  stmt_traps.TryStatement = function (node) {
    node.block.body.unshift(azir.expr_stmt(azir.shadow("mark", [])))
    if (node.handler) { node.handler.param.name = "$"+node.handler.param.name }
    if (!node.finalizer) { node.finalizer = azir.block([]) }
    node.finalizer.body.unshift(azir.expr_stmt(azir.shadow("unmark", [])))
  }

  // while (EXPR) STMT >>> while (aran.unwrap(EXPR)) STMT
  stmt_traps.WhileStatement = function (node) {
    node.test = azir.trap("unwrap", node.test)
  }

  // do STMT while (EXPR) >>> do STMT while (aran.unwrap(EXPR))
  stmt_traps.DoWhileStatement = function (node) {
    node.test = azir.trap("unwrap", node.test)
  }

  // for (EXPR1 ; EXPR2 ; EXPR3) STMT >>> for (EXPR1 ; aran.traps.unwrap(EXPR2) ; EXPR3) STMT
  // for (var ID1,ID2; EXPR2; EXPR3) STMT >>> for (var $ID1,$ID2; EXPR2; EXPR3) STMT
  // etc...
  stmt_traps.ForStatement = function (node) {
    if (node.test) { azir.trap("unwrap", node.test) }
    if (node.init && node.init.type === "VariableDeclaration") {
      node.init.declarations.forEach(function (d) { d.name = "$"+d.name })
    }
  }

  // for (var ID=EXPR1 in EXPR2) STMT >>> {
  //   var $ID=EXPR1;
  //   aran.push3(aran.traps.enumerate(EXPR2));
  //   try {
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.get()+1)) {
  //       $ID = aran.get3()[aran.get()];
  //       STMT
  //     }
  //   } finally {
  //     aran.pop();
  //     aran.pop3();
  //   }
  // }
  //
  // for (EXPR1[EXPR2] in EXPR3) STMT >>> {
  //   aran.push1(EXPR1);
  //   aran.push2(EXPR2);
  //   aran.push3(aran.traps.enumerate(EXPR3));
  //   try {
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.get()+1)) {
  //       aran.set(aran.get1(), aran.get2(), aran.get3()[aran.get()]);
  //       STMT
  //     }
  //   } finally {
  //     aran.pop();
  //     aran.pop1();
  //     aran.pop2();
  //     aran.pop3();
  //   }
  // }
  //
  // etc...
  stmt_traps.ForInStatement = function (node) {
    if (node.left.type === "MemberExpression") {
      compute_member(node.left)
      var obj = node.left.object
      var prop = node.left.property
    } else if (node.left.type === "VariableDeclaration") {
      var decl = node.left
      var name = "$"+node.left.declarations[0].id.name
      node.left.declarations[0].id.name=name
    } else if (node.left.type === "Identifier") {
      var name = "$"+node.left.name
    } else { throw new Error(node) }
    var copy = extract(node)
    node.type = "BlockStatement"
    node.body = []
    // Pre-try
    if (decl) { node.body.push(decl) }
    else if (obj) {
      node.body.push(azir.expr_stmt(push1(obj)))
      node.body.push(azir.expr_stmt(push1(prop)))
    }
    if (aran.traps.enumerate) { var arg = azir.trap("enumerate", [copy.right]) }
    else if (aran.traps.unwrap) { var arg = azir.shadow("enumerate", [azir.trap("unwrap", copy.right)]) }
    else { var arg = azir.shadow("enumerate", [copy.right]) }
    node.body.push(azir.expr_stmt(azir.push3(arg)))
    // Try statements
    var init = azir.shadow("push", [azir.literal(0)])
    var test = azirt.binary("<", get(), azir.member(azir.get3(), "length"))
    var update = azir.shadow("push", [azir.binary("+", azir.pop(), azir.literal(1))])
    var elem = azir.member(azir.get3(), azir.get())
    if (obj) {
      if (aran.traps.set) {
        var ass = azir.expr_stmt(azir.trap("set", [azir.get1, azir.get2, elem]))
      } else {
        var ass = azir.expr_stmt(azir.assignment(azir.member(azir.get1(), azir.get2), elem))
      }
    } else {
      var ass = azir.expr_stmt(azir.assignment(azir.identifier(name), elem))
    }
    var body = azir.block([ass, copy.body])
    // Finally statements
    var finally_stmts = [azir.expr_stmt(azir.pop())]
    if (obj) {
      finally_stmts.push(azir.expr_stmt(azir.pop1()))
      finally_stmts.push(azir.expr_stmt(azir.pop2()))
    }
    finally_stmts.push(azir.expr_stmt(azir.pop3()))
    // Assemble
    node.body.push(azir.try_stmt([azir.for_stmt(init, test, update, body)], null, finally_stmts))
  }

  // function ID (ID1,ID2) {} >>> var $ID = aran.traps.wrap(function ID (ID1,ID2) {})
  // etc...
  stmt_traps.FunctionDeclaration = function (node) {
    node.type = "FunctionExpression"
    node.params.forEach(function (p) { p.name = "$"+p.name })
    inject(azir.declaration(azir.identifier("$"+node.id.name), azir.trap("wrap", extract(node))), node)
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

  // this >>> this===window?aran.saved_window:this
  expr_traps.ThisExpression = function (node) {
    return azir.conditional(azir.binary("===", node, azir.identifier("window")), member(identifier("aran"), "saved_window"), node)
  }

  // [EXPR1,,EXPR2] >>> aran.traps.wrap([EXPR1,,EXPR2])
  // etc...
  expr_traps.ArrayExpression = function (node) {
    return azir.trap("wrap", node)
  }

  // {ID1:EXPR2, ID2:EXPR2} >>> aran.traps.wrap({ID1:EXPR2, ID2:EXPR2})
  // etc...
  expr_traps.ObjectExpression = function (node) {
    return azir.trap("wrap", node)
  }

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
      return azir.trap("unary", [azir.literal(node.operator), node.argument])
    }
    if (!aran.traps.delete) { return node }
    var args = [azir.literal(node.operator)]
    if (node.argument.type === "Identifier") {
      args.push(azir.member(azir.identifier("aran", "saved_window")))
      args.push(azir.literal(node.argument.name))
    } else if (node.argument.type === "MemberExpression") {
      compute_member(node.argument)
      args.push(node.argument.object)
      args.push(node.argument.property)
    } else {
      args.push(node)
    }
    return azir.trap("delete", args)
  }

  // EXPR1 OP EXPR2 >>> aran.traps.binary("OP", EXPR1, EXPR2)
  expr_traps.BinaryExpression = function (node) {
    if (!aran.traps.binary) { return node }
    return azir.traps("binary", [azir.literal(node.operator), node.left, node.right])
  }

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
        return azir.trap("set", [node.left.object, node.left.property, node.right])
      }
    } else {
      throw new Error(node)
    }
    var op = azir.literal(node.operator.replace("=", ""))
    if (node.left.type === "Identifier") {
      if (!aran.traps.binary) { return node }
      node.operator = "="
      node.right = azir.trap("binary", [op, azir.identifier(node.left.name), node.right])
      return node
    }
    if (node.left.type !== "MemberExpression") { throw new Error (node) }
    compute_member(node.left)
    var seq1 = azir.push1(node.left.object)
    var seq2 = azir.push2(node.left.property)
    var get, val, seq3
    (aran.traps.get)?(get=azir.trap("get", [azir.pop1(), azir.pop2()])):(get=azir.member(azir.pop1(), azir.pop2()));
    (aran.traps.binary)?(val=azir.trap("binary", [op, get, node.right])):(val=azir.binary(op.value, get, node.right));
    (aran.traps.set)?(seq3=azir.trap("set", [azir.get1(), azir.get2(), val])):(seq3=azir.assignment(azir.member(azir.get1(), azir.get2()), val));
    return sequence([seq1, seq2, seq3])
  }

  // ++ID           >>> $ID=aran.traps.binary("+", $ID, 1)
  // ID++           >>> (aran.push($ID), $ID=aran.traps.binary("+", $ID, 1), aran.pop())
  // ++EXPR1[EXPR2] >>> (
  //   aran.push1(EXPR1),
  //   aran.push2(EXPR2),
  //   aran.push3(aran.traps.get(aran.get1(), aran.get2())),
  //   aran.traps.set(aran.pop1(), aran.pop2(), aran.traps.binary("+", aran.pop3(), 1))
  // )
  // EXPR1[EXPR2]++ >>> (
  //   aran.push1(EXPR1),
  //   aran.push2(EXPR2),
  //   aran.push3(aran.traps.get(aran.get1(), aran.get2())),
  //   aran.traps.set(aran.pop1(), aran.pop2(), aran.traps.binary("+", aran.get3(), 1)),
  //   aran.pop3()
  // )
  // etc...
  expr_traps.UpdateExpression = function (node) {
    var op = node.operator[0]
    if (node.argument.type === "Identifier") {
      node.argument.name = "$"+node.argument.name
      if (!aran.traps.binary) { return node }
      var ass = azir.assignment(node.argument, azir.trap("binary", [azir.literal(op), azir.identifier(node.argument.name), azir.literal(1)]))
      if (node.prefix) { return ass }
      return sequence([push(identifier(node.argument.name)), ass, pop()])
    }
    if (!node.argument.type === "MemberExpression") { throw new Error (node) }
    compute_member(node.argument)
    var exprs = []
    exprs.push(push1(node.argument.object))
    exprs.push(push2(node.argument.property))
    exprs.push(push3(aran.traps.get?call(shadow("traps", "get"), [get1(), get2()]):member(get1(), get2())))
    var pop3get3 = node.prefix?pop3():get3()
    var val = aran.traps.binary?call(shadow("traps", "binary"), [literal(op), pop3get3, literal(1)]):binary(op, pop3get3, literal(1))
    exprs.push(aran.traps.set?call(shadow("traps", "set"), [pop1(), pop2(), val]):assignment(member(pop1(), pop2()), val))
    if (!node.prefix) { exprs.push(pop3()) }
    return sequence(exprs)
  }

  // EXPR1 && EXPR2 >>> (aran.push(EXPR1), aran.traps.unwrap(aran.get()) ? (aran.pop(),EXPR2) : aran.pop())
  // EXPR1 || EXPR2 >>> (aran.push(EXPR1), aran.traps.unwrap(aran.get()) ? aran.pop() : (aran.pop(),EXPR2))
  expr_traps.LogicalExpression = function (node) {
    var test = call(shadow("get"), [])
    test = unwrap(test)
    var cons = sequence([pop(), node.right])
    var alt = pop()
    if (node.operator === "||") { alt = [cons, cons=alt][0] }
    return sequence([push(node.left), conditional(test, cons, alt)])
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

  // eval(EXPR1, EXPR2) >>> (aran.push([EXPR1, EXPR2]), ($eval===aran.seval) ? eval(aran.compile(aran.unwrap(aran.pop()[0]))) : aran.traps.call($eval, aran.pop()))
  // EXPR(EXPR1, EXPR2) >>> aran.traps.apply(EXPR, $window, [EXPR1, EXPR2])
  // EXPR1[EXPR2](EXPR3, EXPR4) >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), aran.pop(), [EXPR1, EXPR2])
  // etc...
  expr_traps.CallExpression = function (node) {
    if (node.callee.type === "Identifier" && node.callee.name === "eval") {
      var test = binary("===", identifier("$eval"), shadow("saved_eval"))
      var cons = call(identifier("eval"), [call(shadow("compile"), [unwrap(member(pop(), literal(0)))])])
      if (aran.traps.apply) { var alt = call(shadow("traps", "apply"), [identifier("$eval"), pop()]) }
      else { var alt = call(member(unwrap(identifier("$eval")), "apply"), [identifier("window"), pop()]) }
      return sequence([push(array(node.arguments)), conditional(test, cons, alt)])
    }
    if (node.callee.type !== "MemberExpression") {
      if (!aran.traps.apply) { return node }
      return call(shadow("traps", "apply"), [node.callee, id("$window"), array(node.arguments)])
    }
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
