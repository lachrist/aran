
var Esprima = require("esprima")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("./util.js")
var Miley = require("./miley.js")
var Ptah = require("./ptah.js")
var Pstack = require("./pstack.js")
var Ptrap = require("./ptrap.js")

module.exports = function (aran) {

  var ptrap = Ptrap(aran)

  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    ast.body.forEach(visit_stmt)
    if (aran.hooks.program) { ast.body.unshift(Ptah.exprstmt(phook("Program", [Ptah.literal(ast.body.length)]))) }
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { throw errors[0] }
    return Escodegen.generate(ast)
  }

  /////////////
  // Helpers //
  /////////////

  function escape (s) {
    if (/^\$*aran$/.test(s)) { return "$"+s }
    return s
  }

  function escape_id (id) {
    id.name = escape(id.name)
  }

  function escape_decl (decl) {
    decl.id.name = escape(decl.id.name)
  }

  function compute_member (node) {
    if (!node.computed) {
      node.computed = true
      node.property = ptrap.wrap(Ptah.literal(node.property.name))
    }
  }

  function pshadow (name) {
    return Ptah.member(Ptah.identifier("aran"), name)
  }

  function phook (name, args) {
    return Ptah.call(Ptah.member(pshadow("hooks"), name), args)
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
      var parts = Miley[node.type](node)
      // Hooks //
      if (aran.hooks[node.type]) {
        var copy = Util.extract(node)
        var hook = phook(copy.type, parts.infos.map(Ptah.nodify))
        if (is_stmt) {
          node.type = "BlockStatement"
          node.body = [Ptah.exprstmt(hook), copy]
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
        node = Util.extract(node)
        decl.type = "EmptyStatement"
      }
      // Traps //
      if (is_stmt) { stmts[node.type](node) }
      else { Util.inject(exprs[node.type](Util.extract(node)), node) }
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

  /////////////////////////
  // Statement Compilers //
  /////////////////////////

  var stmts = {}

  stmts.EmptyStatement = Util.nil

  stmts.BlockStatement = Util.nil

  stmts.ExpressionStatement = Util.nil

  // if (EXPR) STMT             >>> if (aran.traps.booleanize(EXPR)) STMT
  // if (EXPR) STMT1 else STMT2 >>> if (aran.traps.booleanize(EXPR)) STMT1 else STMT2
  stmts.IfStatement = function (node) {
    node.test = ptrap.booleanize(node.test)
  }

  stmts.LabeledStatement = Util.nil

  stmts.BreakStatement = Util.nil

  stmts.ContinueStatement = Util.nil

  // with (EXPR) STMT >>> with (aran.with(EXPR)) STMT
  stmts.WithStatement = function (node) {
    node.object = Ptah.call(pshadow("with"), [node.object])
  }

  // TODO
  // dificult to prevent label clash
  // has to perform upfront parsing to find break
  // switchlabel: { if (descriminant === CASE1) ... }
  // stmts.SwitchStatement = function (node) {}

  stmts.ReturnStatement = Util.nil

  stmts.ThrowStatement = Util.nil

  // try {} catch (ID) {} finally {} >>> try { aran.mark() } catch (#ID) {} finally { aran.ummark() }
  stmts.TryStatement = function (node) {
    node.block.body.unshift(Ptah.exprstmt(Pstack.mark()))
    if (node.handler) { node.handler.param.name = escape(node.handler.param.name) }
    if (!node.finalizer) { node.finalizer = Ptah.block([]) }
    node.finalizer.body.unshift(Ptah.exprstmt(Pstack.unmark()))
  }

  // while (EXPR) STMT >>> while (aran.traps.booleanize(EXPR)) STMT
  stmts.WhileStatement = function (node) {
    node.test = ptrap.booleanize(node.test)
  }

  // do STMT while (EXPR) >>> do STMT while (aran.traps.booleanize(EXPR))
  stmts.DoWhileStatement = function (node) {
    node.test = ptrap.booleanize(node.test)
  }

  // for (EXPR1 ; EXPR2 ; EXPR3) STMT >>> for (EXPR1 ; aran.traps.booleanize(EXPR2) ; EXPR3) STMT
  // for (var ID1,ID2; EXPR2; EXPR3) STMT >>> for (var #ID1,#ID2; EXPR2; EXPR3) STMT
  // etc...
  stmts.ForStatement = function (node) {
    if (node.test) { node.test = ptrap.booleanize(node.test) }
    if (node.init && node.init.type === "VariableDeclaration") {
      node.init.declarations.forEach(escape_decl)
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

  // function ID (ID1,ID2) {} >>> var #ID = aran.traps.wrap(function (#ID1, #ID2) {})
  // etc...
  stmts.FunctionDeclaration = function (node) {
    node.params.forEach(escape_id)
    Util.inject(Ptah.declaration(escape(node.id.name), ptrap.wrap(extract(node))), node)
  }

  // var ID1=EXPR1, ID2=EXPR2 >>> var #ID1=EXPR1, #ID2=EXPR2
  // etc...
  stmts.VariableDeclaration = function (node) {
    node.declarations.forEach(escape_decl)
  }

  //////////////////////////
  // Expression Compilers //
  //////////////////////////

  var exprs = {}

  // this >>> this===aran.global ? aran.sandbox : this
  exprs.ThisExpression = function (node) {
    return Ptah.conditional(Ptah.binary("===", node, pshadow("global")), pshadow("sandbox"), node)
  }

  // [EXPR1,,EXPR2] >>> aran.traps.wrap([EXPR1,,EXPR2])
  // etc...
  exprs.ArrayExpression = ptrap.wrap

  // {x:EXPR} >>> aran.traps.wrap({x:EXPR})
  // etc...
  exprs.ObjectExpression = ptrap.wrap

  // function (ID) {} >>> aran.traps.wrap(function (#ID) {})
  exprs.FunctionExpression = function (node) {
    node.params.forEach(escape_id)
    return ptrap.wrap(node)
  }

  exprs.sequence = Util.identity
  
  // void EXPR           >>> aran.traps.unary("void", EXPR)
  // delete EXPR1[EXPR2] >>> aran.traps.delete(EXPR1, EXPR2)
  // etc...
  exprs.UnaryExpression = function (node) {
    if (node.operator === "delete" && node.argument.type === "MemberExpression") {
      compute_member(node.argument)
      return ptrap.delete(node.argument.object, node.argument.property)
    }
    return ptrap.unary(node.operator, node.argument)
    // TODO typeof ID && delete ID
  }

  // EXPR1 OP EXPR2 >>> aran.traps.binary("OP", EXPR1, EXPR2)
  exprs.BinaryExpression = function (node) {
    return ptrap.binary(node.operator, node.left, node.right)
  }

  // ID = <EXPR>                >>> #ID = <EXPR>
  // ID OP= <EXPR>              >>> #ID = aran.traps.binary("OP", #ID, <EXPR>)
  // <EXPR1>[<EXPR2>] = <EXPR3> >>> aran.traps.set(<EXPR1>, <EXPR2>, <EXPR3>)
  // <EXPR1>[<EXPR2>] OP= <EXPR3> >>> aran.traps.set(aran.push1(EXPR1), aran.push2(EXPR2), aran.traps.binary("OP", aran.trap.get(aran.pop1(), aran.pop2()), EXPR3))
  exprs.AssignmentExpression = function (node) {
    if (node.left.type === "Identifier") {
      escape_id(node.left)
      if (node.operator === "=") { return node }
    } else if (node.left.type === "MemberExpression") {
      compute_member(node.left)
      if (node.operator === "=") { return ptrap.set(node.left.object, node.left.property, node.right) }
    } else { throw new Error(node) }
    var op = node.operator.replace("=", "")
    if (node.left.type === "Identifier") {
      node.operator = "="
      node.right = ptrap.binary(op, Ptah.identifier(node.left.name), node.right)
      return node
    }
    return ptraps.set(Pstack.push1(node.left.object), Pstack.push2(node.left.property), ptrap.binary(op, ptrap.get(Pstack.pop1(), Pstack.pop2()), node.right))
  }

  // ++ID           >>> $ID=aran.traps.binary("+", #ID, aran.traps.wrap(1))
  // ID++           >>> (#ID = arent.traps.binary("+", aran.push(#ID), aran.traps.wrap(1), aran.pop())
  // ++EXPR1[EXPR2] >>> aran.traps.set(
  //   aran.push1(EXPR1),
  //   aran.push2(EXPR2),
  //   aran.traps.binary("+", aran.traps.get(aran.pop1(), aran.pop2()), aran.traps.wrap(1)))
  // EXPR1[EXPR2]++ >>> (
  //   aran.traps.set(
  //     aran.push1(EXPR1),
  //     aran.push2(EXPR2),
  //     aran.push3(aran.traps.binary("+", aran.push3(aran.traps.get(aran.pop1(), aran.pop2())), aran.traps.wrap(1))),
  //   aran.pop3()
  // )
  // etc...
  exprs.UpdateExpression = function (node) {
    var op = node.operator
    if (node.argument.type === "Identifier") {
      function id () { return Ptah.identifier(escape(node.argument.name)) }
      if (node.prefix) { return Ptah.assignment(id(), ptrap.binary(op, id(), ptrap.wrap(Ptah.literal(1)))) }
      return Ptah.sequence([Ptah.assignment(id(), ptrap.binary(op, Pstack.push(id()), ptrap.wrap(Ptah.literal(1)))), Pstack.pop()])
    }
    if (!node.argument.type === "MemberExpression") { throw new Error (node) }
    compute_member(node.argument)
    var val = ptrap.binary(op, ptrap.get(Pstack.pop1(), Pstack.pop2()), ptrap.wrap(Ptah.literal(1)))
    if (node.prefix) { return ptrap.set(Pstack.push1(node.argument.object), Pstack.push2(node.argument.property), val) }
    return Ptah.sequence([ptrap.set(Pstack.push1(node.argument.object), Pstack.push2(node.argument.property), Pstack.push3(val)), Pstack.pop3()])
  }

  // EXPR1 || EXPR2 >>> (aran.traps.booleanize(aran.push(EXPR1)) ? aran.pop() : (aran.pop(),EXPR2))
  // EXPR1 && EXPR2 >>> (aran.traps.booleanize(aran.push(EXPR1)) ? (aran.pop(),EXPR2) : aran.pop())
  exprs.LogicalExpression = function (node) {
    var test = ptrap.booleanize(Pstack.push(node.left))
    var seq = Ptah.sequence([Pstack.pop(), node.right])
    if (node.operator === "||") { return Ptah.conditional(test, Pstack.pop(), seq) }
    if (node.operator === "&&") { return Ptah.conditional(test, seq, Pstack.pop()) }
    throw new Error(node)
  }

  // EXPR1 ? EXPR2 : EXPR3 >>> aran.traps.booleanize(EXPR1) ? EXPR2 : EXPR3
  exprs.ConditionalExpression = function (node) {
    node.test = ptrap.booleanize(node.test)
    return node
  }

  // new EXPR(EXPR1, EXPR2) >>> aran.traps.new(EXPR, [EXPR1, EXPR2])
  // etc...
  exprs.NewExpression = function (node) {
    return ptrap.new(node.callee, node.arguments)
  }

  // EXPR(EXPR1, EXPR2) >>> aran.traps.apply(EXPR, aran.undefined, [EXPR1, EXPR2])
  // EXPR1[EXPR2](EXPR3, EXPR4) >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), aran.pop(), [EXPR1, EXPR2])
  // eval(EXPR1, EXPR2) >>> (aran.push([EXPR1, EXPR2]), (eval===aran.seval) ? eval(aran.compile(aran.unwrap(aran.pop()[0]))) : aran.traps.call($eval, aran.pop()))
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
    if (node.callee.type !== "MemberExpression") { return ptrap.apply(node.callee, pshadow("undefined"), node.arguments) }
    compute_member(node.callee)
    return ptrap.apply(ptrap.get(Pstack.push(node.callee.object), node.callee.property), Pstack.pop(), node.arguments)
  }

  // EXPR.ID      >>> aran.traps.get(EXPR, "ID")
  // EXPR1[EXPR2] >>> aran.traps.get(EXPR1, EXPR2)
  exprs.MemberExpression = function (node) {
    compute_member
    return ptrap.get(node.object, node.property)
  }

  // ID >>> $ID
  exprs.Identifier = function (node) {
    node.name = escape(node.name)
    return node
  }

  // LIT >>> aran.traps.wrap(LIT)
  exprs.Literal = function (node) {
    return ptrap.wrap(node)
  }

}
