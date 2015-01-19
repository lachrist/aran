
module.exports = function (aran) {

  var ptraps = Ptah.trap(aran)

  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    ast.body.forEach(visit_stmt)
    if (aran.hooks.program) { ast.body.unshift(Ptah.expr_stmt(Ptah.hook("program", [Ptah.literal(ast.body.length)]))) }
    return Escodegen.generate(ast)
  }

  //////////////
  // Visitors //
  //////////////

  var visit_stmt
  var visit_expr
  (function () {
    visit_stmt = function (node) { return visit(node, true) }
    visit_expr = function (node) { return visit(node, false) }
    function visit (node, is_stmt) {
      var parts = Miley(node)
      // Hooks //
      if (aran.hooks[node.type]) {
        var copy = Util.extract(node)
        var hook = Ptah.hook(copy.type, parts.infos.map(nodify))
        if (is_stmt) {
          node.type = "BlockStatement"
          node.body = [Ptah.expr_stmt(hook), copy]
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
        node = Ptah.extract(node)
        decl.type = "EmptyStatement"
      }
      // Traps //
      if (is_stmt) { stmts[node.type](node) }
      else { Util.inject(exprs[node.type](extract(node)), node) }
      // Recursion //
      parts.exprs.forEach(visit_expr)
      var decls = Util.flaten(parts.stmts.map(visit_stmt))
      if (body) {
        Util.prepend(decls, body)
        if (decl) { return [node] }
        return []
      }
      return decls
    }
  } ())

  /////////////
  // Helpers //
  /////////////

  function escape (s) {
    if (/^\$*aran$/.test(s)) { return "$"+s }
    return s
  }

  function compute_member (node) {
    if (!node.computed) {
      node.computed = true
      node.property = ptraps.wrap(Ptah.literal(node.property.name))
    }
  }

  // function (ID1, ID2) BODY >>>
  //   aran.push1(aran.traps.wrap(function ($ID1,$ID2) BODY))
  //   aran.traps.set(aran.get1(), aran.traps.wrap("__proto__"), aran.prototypes.function)
  //   aran.traps.define(aran.get1(), "length", {writable:false, enumerable:false, configurable:false, value: 2})
  //   aran.push2(aran.traps.object())
  //   aran.traps.set(aran.get2(), aran.traps.wrap("__proto__"), aran.prototypes.object)
  //   aran.traps.define(aran.get2(), "constructor", {writable:true, enumerable:false, configurable:true, value:aran.get1()})
  //   aran.traps.define(aran.get1(), "prototype", {writable:true, enumerable:false, configurable:false, value:aran.pop2()})
  //   aran.pop1()
  // etc...
  function visit_fct (node) {
    node.params.forEach(function (p) { p.name = "$"+p.name })
    var exprs = []
    exprs.push(Ptah.push1(ptraps.wrap(node)))
    exprs.push(ptraps.set(Ptah.get1(), ptraps.wrap(Ptah.literal("__proto__")), Ptah.member(Ptah.shadow("prototypes"), "function")))
    exprs.push(ptraps.define(Ptah.get1(), Ptah.literal("length"), Ptah.data_descr(false, false, false, ptraps.wrap(Ptah.literal(node.params.length)))))
    exprs.push(Ptah.push2(ptraps.object()))
    exprs.push(ptraps.set(Ptah.get2(), ptraps.wrap(Ptah.literal("__proto__")), Ptah.member(Ptah.shadow("prototypes"), "object")))
    exprs.push(ptraps.define(Ptah.get2(), Ptah.literal("constructor"), Ptah.data_descr(true, false, true, Ptah.get1())))
    exprs.push(ptraps.define(Ptah.get1(), Ptah.literal("prototype"), Ptah.data_descr(false, false, true, Ptah.pop2())))
    exprs.push(pop1())
    return Ptah.sequence(exprs)
  }

  /////////////////////////
  // Statement Compilers //
  /////////////////////////

  var stmts = {}

  // if (EXPR) STMT             >>> if (aran.traps.unwrap(EXPR)) STMT
  // if (EXPR) STMT1 else STMT2 >>> if (aran.traps.unwrap(EXPR)) STMT1 else STMT2
  stmts.IfStatement = function (node) {
    node.test = ptraps.wrap(node.text)
  }

  // with (EXPR) STMT >>> with (aran.with(EXPR)) STMT
  stmts.WithStatement = function (node) {
    node.test = Ptah.with(node.test)
  }

  // switch (EXPR0) { case EXPR:STMT } >>> switch (aran.traps.unwrap(EXPR0)) { case aran.traps.unwrap(EXPR1): STMT }
  // etc...
  stmts.SwitchStatement = function (node) {
    node.discriminant = ptraps.unwrap(node.discriminant)
    node.cases.forEach(function (c) { if (c.test) { c.test = ptraps.unwrap(c.test) } })
  }

  // try {} catch (ID) {} finally {} >>> try { aran.mark() } catch ($ID) {} finally { aran.ummark() }
  stmts.TryStatement = function (node) {
    node.block.body.unshift(Ptah.expr_stmt(Ptah.mark()))
    if (node.handler) { node.handler.param.name = "$"+node.handler.param.name }
    if (!node.finalizer) { node.finalizer = Ptah.block([]) }
    node.finalizer.body.unshift(Ptah.expr_stmt(Ptah.unmark()))
  }

  // while (EXPR) STMT >>> while (aran.unwrap(EXPR)) STMT
  stmts.WhileStatement = function (node) {
    node.test = ptraps.unwrap(node.test)
  }

  // do STMT while (EXPR) >>> do STMT while (aran.unwrap(EXPR))
  stmts.DoWhileStatement = function (node) {
    node.test = ptraps.unwrap(node.test)
  }

  // for (EXPR1 ; EXPR2 ; EXPR3) STMT >>> for (EXPR1 ; aran.traps.unwrap(EXPR2) ; EXPR3) STMT
  // for (var ID1,ID2; EXPR2; EXPR3) STMT >>> for (var $ID1,$ID2; EXPR2; EXPR3) STMT
  // etc...
  stmts.ForStatement = function (node) {
    if (node.test) { node.test = ptraps.unwrap(node.test) }
    if (node.init && node.init.type === "VariableDeclaration") {
      node.init.declarations.forEach(function (d) { d.name = "$"+d.name })
    }
  }

  // TODO would like to remove enumerate
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
  // stmts.ForInStatement = function (node) {
  //   if (node.left.type === "MemberExpression") {
  //     compute_member(node.left)
  //     var obj = node.left.object
  //     var prop = node.left.property
  //   } else if (node.left.type === "VariableDeclaration") {
  //     var decl = node.left
  //     var name = "$"+node.left.declarations[0].id.name
  //     node.left.declarations[0].id.name=name
  //   } else if (node.left.type === "Identifier") {
  //     var name = "$"+node.left.name
  //   } else { throw new Error(node) }
  //   var copy = extract(node)
  //   node.type = "BlockStatement"
  //   node.body = []
  //   // Pre-try
  //   if (decl) { node.body.push(decl) }
  //   else if (obj) {
  //     node.body.push(azir.expr_stmt(push1(obj)))
  //     node.body.push(azir.expr_stmt(push1(prop)))
  //   }
  //   if (aran.traps.enumerate) { var arg = azir.trap("enumerate", [copy.right]) }
  //   else if (aran.traps.unwrap) { var arg = azir.shadow("enumerate", [azir.trap("unwrap", copy.right)]) }
  //   else { var arg = azir.shadow("enumerate", [copy.right]) }
  //   node.body.push(azir.expr_stmt(azir.push3(arg)))
  //   // Try statements
  //   var init = azir.shadow("push", [azir.literal(0)])
  //   var test = azirt.binary("<", get(), azir.member(azir.get3(), "length"))
  //   var update = azir.shadow("push", [azir.binary("+", azir.pop(), azir.literal(1))])
  //   var elem = azir.member(azir.get3(), azir.get())
  //   if (obj) {
  //     if (aran.ptraps.set) {
  //       var ass = azir.expr_stmt(azir.trap("set", [azir.get1, azir.get2, elem]))
  //     } else {
  //       var ass = azir.expr_stmt(azir.assignment(azir.member(azir.get1(), azir.get2), elem))
  //     }
  //   } else {
  //     var ass = azir.expr_stmt(azir.assignment(azir.identifier(name), elem))
  //   }
  //   var body = azir.block([ass, copy.body])
  //   // Finally statements
  //   var finally_stmts = [azir.expr_stmt(azir.pop())]
  //   if (obj) {
  //     finally_stmts.push(azir.expr_stmt(azir.pop1()))
  //     finally_stmts.push(azir.expr_stmt(azir.pop2()))
  //   }
  //   finally_stmts.push(azir.expr_stmt(azir.pop3()))
  //   // Assemble
  //   node.body.push(azir.try_stmt([azir.for_stmt(init, test, update, body)], null, finally_stmts))
  // }

  // function ID (ID1,ID2) {} >>> var $ID = ...
  // cf visit_fct
  stmts.FunctionDeclaration = function (node) {
    Util.inject(Ptah.declaration("$"+node.id.name, visit_fct(extract(node))), node)
  }

  // var ID1=EXPR1, ID2=EXPR2 >>> var $ID1=EXPR1, $ID2=EXPR2
  // etc...
  stmts.VariableDeclaration = function (node) {
    node.declarations.forEach(function (d) { d.id.name = "$"+d.id.name })
  }

  //////////////////////////
  // Expression Compilers //
  //////////////////////////

  var exprs = {}

  // this >>> this===global?aran.global:this
  exprs.ThisExpression = function (node) {
    return Ptah.conditional(Ptah.binary("===", node, Ptah.identifier("global")), Ptah.shadow("global"), node)
  }

  // [EXPR1,,EXPR2] >>>
  //   aran.push(aran.traps.array())
  //   aran.traps.set(aran.get(), aran.traps.wrap("__proto__"), aran.prototype.array)
  //   aran.traps.set(aran.get(), aran.traps.wrap(0), EXPR1)
  //   aran.traps.set(aran.get(), aran.traps.wrap(2), EXPR2)
  //   aran.pop()
  // 
  // etc...
  exprs.ArrayExpression = function (node) {
    var exprs = []
    exprs.push(Ptah.push(ptraps.array()))
    exprs.push(Ptah.ptraps.set(Ptah.get(), ptraps.wrap(Ptah.literal("__proto__")), Ptah.member(Ptah.shadow("prototype"), "array")))
    for (var i=0; i<elements.length; i++) {
      if (elements[i]) {
        exprs.push(Ptah.ptraps("set", [Ptah.get(), ptraps.wrap(Ptah.literal(i)), elements[i]]))
      }
    }
    exprs.push(Ptah.pop())
    return Ptah.sequence(exprs)
  }

  // {ID1:EXPR2, ID2:EXPR2, get ID3 EXPR3, set ID3 EXPR4} >>>
  //   aran.push(aran.traps.object())
  //   aran.traps.set(aran.get(), aran.traps.wrap("__proto__"), aran.prototypes.object),
  //   aran.traps.set(aran.get(), aran.traps.wrap("ID1"), EXPR1),
  //   aran.traps.set(aran.get(), aran.traps.wrap("ID2"), EXPR2),
  //   aran.traps.define(aran.get(), "ID3", {configurable:true, enumerable:true, get:EXPR3, set:EXPR4})
  //   aran.pop()
  // etc...
  exprs.ObjectExpression = function (node) {
    var exprs = [Ptah.push(ptraps.object())]
    exprs.push(ptraps.set(Ptah.get(), ptraps.wrap("__proto__"), Ptah.member(Ptah.shadow("prototypes"), "object")))
    var props = {}
    for (var i=0; i<node.properties.length; i++) {
      var key = (node.properties[i].key.type==="Identifier") ? node.properties[i].key.name : String(node.properties[i].key.value)
      if (node.properties[i].kind === "init") {
        exprs.push(ptraps.set(Ptah.get(), ptraps.wrap(Ptah.literal(key)), node.properties[i].value))
      } else {
        if (!props[key]) { props[key] = Ptah.object(Ptah.property("configurable", Ptah.literal(true)), Ptah.property("enumerable", Ptah.literal(true))) }
        props[key].properties.push(Ptah.property(node.properties[i].kind, node.properties[i].value))
      } 
    }
    for (key in prop) { exprs.push(ptraps.define(Ptah.get(), Ptah.literal(key), props[key])) }
    exprs.push(Ptah.pop())
    return Ptah.sequence(exprs)
  }

  // cf visit_fct
  exprs.FunctionExpression = visit_fct

  // void EXPR           >>> aran.traps.unary("void", EXPR)
  // delete ID           >>> aran.traps.delete("delete", aran.global, "ID")
  // delete EXPR.ID      >>> aran.traps.delete("delete", EXPR, "ID")
  // delete EXPR1[EXPR2] >>> aran.traps.delete("delete", EXPR1, EXPR2)
  // delete EXPR         >>> aran.traps.delete("delete", EXPR)
  exprs.UnaryExpression = function (node) {
    if (node.operator !== "delete") { return ptraps.unary(Ptah.literal(node.operator), node.argument) }
    if (node.argument.type === "Identifier") { return ptraps.delete(Ptah.shadow("global"), Ptah.literal(node.argument.name)) }
    if (node.argument.type === "MemberExpression") {
      compute_member(node.argument)
      return ptraps.delete(node.argument.object, node.argument.property)
    }
    return node.argument
  }

  // EXPR1 OP EXPR2 >>> aran.traps.binary("OP", EXPR1, EXPR2)
  exprs.BinaryExpression = function (node) {
    return ptraps.binary(Ptah.literal(node.operator), node.left, node.right)
  }

  // ID = <EXPR>                >>> $ID = <EXPR>
  // ID OP= <EXPR>              >>> $ID = aran.traps.binary("OP", $ID, <EXPR>)
  // <EXPR1>[<EXPR2>] = <EXPR3> >>> aran.traps.set(<EXPR1>, <EXPR2>, <EXPR3>)
  // <EXPR1>[<EXPR2>] OP= <EXPR3> >>> aran.traps.set(aran.push1(EXPR1), aran.push2(EXPR2), aran.traps.binary("OP", aran.trap.get(aran.pop1(), aran.pop2()), EXPR3))
  exprs.AssignmentExpression = function (node) {
    if (node.left.type === "Identifier") {
      node.left.name = "$"+node.left.name
      if (node.operator === "=") { return node }
    } else if (node.left.type === "MemberExpression") {
      compute_member(node.left)
      if (node.operator === "=") { return ptraps.set(node.left.object, node.left.property, node.right) }
    } else { throw new Error(node) }
    var op = Ptah.literal(node.operator.replace("=", ""))
    if (node.left.type === "Identifier") {
      node.operator = "="
      node.right = ptraps.binary(op, Ptah.identifier(node.left.name), node.right)
      return node
    }
    return ptraps.set(Ptah.push1(node.left.object), Ptah.push2(node.left.property), ptraps.binary(op, ptraps.get(Ptah.pop1(), Ptah.pop2()), node.right))
  }

  // ++ID           >>> $ID=aran.traps.binary("+", $ID, 1)
  // ID++           >>> (aran.push($ID), $ID=aran.traps.binary("+", $ID, 1), aran.pop())
  // ++EXPR1[EXPR2] >>> aran.traps.set(aran.push1(EXPR1), aran.push2(EXPR2), aran.traps.binary("+", aran.traps.get(aran.pop1(), aran.pop2()), 1))
  // EXPR1[EXPR2]++ >>> (
  //   aran.push3(aran.traps.get(aran.push1(EXPR1), aran.push2(EXPR2))),
  //   aran.traps.set(aran.pop1(), aran.pop2(), aran.traps.binary("+", aran.get3(), 1)),
  //   aran.pop3()
  // )
  // etc...
  exprs.UpdateExpression = function (node) {
    var op = literal(node.operator)
    if (node.argument.type === "Identifier") {
      function id () { return Ptah.identifier("$"+node.argument.name) }
      var ass = Ptah.assignment(id(), ptraps.binary(op, id(), Ptah.literal(1)))
      if (node.prefix) { return ass }
      return sequence([Ptah.push(id()), ass, Ptah.pop()])
    }
    if (!node.argument.type === "MemberExpression") { throw new Error (node) }
    compute_member(node.argument)
    if (node.prefix) {
      var val = ptraps.binary(op, ptraps.get(Ptah.pop1(), Ptah.pop2()), Ptah.literal(1))
      return ptraps.set(Ptah.push1(node.argument.object), Ptah.push2(node.argument.property), val)
    }
    var val = ptraps.get(Ptah.push1(node.argument.object), Ptah.push2(node.argument.property))
    var ass = ptraps.set(Ptah.pop1(), Ptah.pop2(), ptraps.binary(op, Ptah.get3(), 1))
    return sequence([Ptah.push3(val), ass, Ptah.pop3()])
  }

  // EXPR1 && EXPR2 >>> (aran.push(EXPR1), aran.traps.unwrap(aran.get()) ? (aran.pop(),EXPR2) : aran.pop())
  // EXPR1 || EXPR2 >>> (aran.push(EXPR1), aran.traps.unwrap(aran.get()) ? aran.pop() : (aran.pop(),EXPR2))
  exprs.LogicalExpression = function (node) {
    var test = ptraps.unwrap(Ptah.get())
    var cons = sequence([Path.pop(), node.right])
    var alt = Ptah.pop()
    if (node === "||") { var saved = cons; cons=alt; alt=saved }
    return Ptah.sequence([Ptah.push(node.left), Ptah.conditional(test, cons, alt)])
  }

  // EXPR1 ? EXPR2 : EXPR3 >>> aran.traps.unwrap(EXPR1) ? EXPR2 : EXPR3
  exprs.ConditionalExpression = function (node) {
    node.test = ptraps.unwrap(node.test)
    return node
  }

  // new EXPR(EXPR1, EXPR2) >>>
  //   aran.traps.set(aran.push1(aran.traps.object()), aran.traps.wrap("__proto__"), aran.traps.get(aran.push2(EXPR), aran.traps.wrap("prototype")))
  //   aran.push3(aran.traps.apply(aran.pop2(), aran.get1(), [EXPR1, EXPR2]))
  //   aran.traps.unwrap(aran.traps.binary("===", aran.traps.wrap("object"), aran.traps.unary("typeof", aran.traps.get3())))
  //     ? aran.get3() ? (aran.pop1(), aran.pop3())  : (aran.pop3(), aran.pop1())
  //     : (aran.pop3(), aran.pop1())
  // etc..
  exprs.NewExpression = function (node) {
    var set_proto = ptraps.set(Ptah.push1(ptraps.object()), ptraps.wrap("__proto__"), ptraps.get(Ptah.push2(node.callee), ptraps.wrap("prototype")))
    var construct = ptraps.apply(Ptah.pop2(), Ptah.pop1(), node.arguments)
    var test = ptraps.unwrap(ptraps.binary(Ptah.literal("==="), ptraps.wrap(Ptah.literal("object")), ptraps.unary(Ptah.literal("typeof"), Ptah.get3())))
    var cons = Ptah.conditional(Ptah.get3(), Ptah.sequence([Ptah.pop1(), Ptah.pop3()]), Ptah.sequence([Ptah.pop3(), Ptah.pop1()]))
    var alte = Ptah.sequence([Ptah.pop3(), Ptah.pop1()])
    return Ptah.sequence([set_proto, construct, Ptah.conditional(test, cons, alt)])
  }

  // eval(EXPR1, EXPR2) >>> (aran.push([EXPR1, EXPR2]), ($eval===aran.seval) ? eval(aran.compile(aran.unwrap(aran.pop()[0]))) : aran.traps.call($eval, aran.pop()))
  // EXPR(EXPR1, EXPR2) >>> aran.traps.apply(EXPR, aran.global, [EXPR1, EXPR2])
  // EXPR1[EXPR2](EXPR3, EXPR4) >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), aran.pop(), [EXPR1, EXPR2])
  // etc...
  exprs.CallExpression = function (node) {
    if (node.callee.type === "Identifier" && node.callee.name === "eval") {
      // TODO
      // var test = Ptah.binary("===", Ptah.push(identifier("$eval")), Ptah.shadow("eval"))
      // var cons = Ptah.call(Ptah.pop(), [Ptah.call(Ptah.shadow("compile"), [trap.unwrap()  member(pop(), literal(0)))])])
      // var alt = ptraps.apply(Ptah.pop(), Ptah.identifier("undefined"), node.arguments)

      // if (aran.traps.apply) { var alt = call(shadow("traps", "apply"), [identifier("$eval"), pop()]) }
      // else { var alt = call(member(unwrap(identifier("$eval")), "apply"), [identifier("window"), pop()]) }
      // return sequence([push(array(node.arguments)), conditional(test, cons, alt)])
    }
    if (node.callee.type !== "MemberExpression") { return ptraps.apply(node.callee, Ptah.identifier("undefined"), node.arguments) }
    compute_member(node.callee)
    return ptraps.apply(ptraps.get(Ptah.push(node.callee.object), node.callee.property), Ptah.pop(), node.arguments)
  }

  // EXPR.ID      >>> aran.traps.get(EXPR, "ID")
  // EXPR1[EXPR2] >>> aran.traps.get(EXPR1, EXPR2)
  exprs.MemberExpression = function (node) {
    compute_member
    return ptraps.get(node.object, node.property)
  }



var p = new Proxy([], {
  getPrototypeOf:function (t) {console.log("getPrototypeOf"); return Object.getPrototypeOf(t)},
  setPrototypeOf:function (t, p) {console.log("setPrototypeOf"); return Object.setPrototypeOf(t, p)},
  isExtensible:function (t) {console.log("isExtensible"); return Object.isExtensible(t)},
  preventExtension:function (t) {console.log("preventExtension"); return Object.preventExtension(t)},
  getOwnPropertyDescriptor:function (t, p) {console.log("getOwnPropertyDescriptor"); return Object.getOwnPropertyDescriptor(t, p) },
  defineProperty:function(t, p, d) {console.log("defineProperty"); return Object.defineProperty(t, p, d) },
  has:function (t, p) {console.log("has"); return o in t},
  get:function (t, p) {console.log("get"); return t[p]},
  set:function (t, p, v) {console.log("set"); return t[p]=v},
  deleteProperty:function (t, p) {console.log("deleteProperty"); return delete t[p]},
  enumerate:function (t) {console.log("enumerate")},
  ownKeys:function (t) {console.log("ownKeys"); return Object.getOwnPropertyNames(t)},
  apply:function (t, th, args) {console.log("apply"); return t.apply(th, args)},
  construct:function (t, args) {console.log("construct"); return new t(args)}
})

  // ID >>> $ID
  exprs.Identifier = function (node) {
    node.name = "$"+node.name
    return node
  }

  // LIT >>> aran.traps.wrap(LIT)
  exprs.Literal = function (node) {
    return ptraps.wrap(node)
  }
