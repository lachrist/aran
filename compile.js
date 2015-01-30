
var Esprima = require("esprima")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("./util.js")
var Miley = require("./miley.js")
var Ptah = require("./ptah.js")
var Pstack = require("./pstack.js")
var Ptrap = require("./ptrap.js")
var Switch = require("./switch.js")

module.exports = function (aran) {

  var ptrap = Ptrap(aran)

  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    var hook = phook("Program", [Ptah.literal(ast.body.length)])
    Util.prepend(Util.flaten(ast.body.map(visit_stmt)), ast.body)
    if (aran.hooks.program) { ast.body.unshift(Ptah.exprstmt(hook)) }
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) {
      errors[0].message = "Aran internal compilation error "+errors[0].message
      console.dir(ast)
      throw errors[0]
    }
    return Escodegen.generate(ast)
  }

  /////////////
  // Helpers //
  /////////////

  function escape (s) {
    if (/^\$*aran$/.test(s)) { return "$"+s }
    return s
  }

  var esc_args = escape("arguments")

  function esc_decl (decl) {
    decl.id.name = escape(decl.id.name)
  }

  function compute_member (node) {
    if (!node.computed) {
      node.computed = true
      node.property = ptrap.primitive(Ptah.literal(node.property.name))
    }
  }

  function pshadow (name) {
    return Ptah.member(Ptah.identifier("aran"), name)
  }

  function phook (name, args) {
    return Ptah.call(Ptah.member(pshadow("hooks"), name), args)
  }

  function visit_fct (node) {
    var args = false
    node.params.forEach(function (id) {
      if (id.name === "arguments") { args = true }
      id.name = escape(id.name)
    })
    if (!args) {
      node.body.body.unshift(Path.assignment(Ptah.identifier(esc_args), ptrap.arguments(Ptah.identifier(esc_args))))
    }
    return ptrap.function(node)
  }

  //////////////
  // Visitors //
  //////////////

  function visit_expr (node) {
    var pushed = Switch.push(node.type)
    var parts = Miley[node.type](node)
    if (aran.hooks[node.type]) {
      var copy = Util.extract(node)
      node.type = "SequenceExpression"
      node.expressions = [phook(copy.type, parts.infos.map(Ptah.nodify)), copy]
      node = copy
    }
    var body = node.type === "FunctionDeclaration" ? node.body : null
    Util.inject(exprs[node.type](Util.extract(node)), node)
    parts.exprs.forEach(visit_expr)
    var decls = parts.stmts.forEach(visit_stmt)
    if (!body) { return decls }
    Util.prepend(decls, node.body)
    if (pushed) { Switch.pop() }
    return []
  }

  function visit_stmt (node) {
    var pushed = Switch.push(node.type)
    else if (lab) { labels.push(null) }
    var parts = Miley[node.type](node)
    if (aran.hooks[node.type]) {
      var copy = Util.extract(node)
      node.type = "BlockStatement"
      node.body = [Ptah.exprstmt(phook(copy.type, parts.infos.map(Ptah.nodify))), copy]
      node = copy
    }
    var body = node.type === "FunctionDeclaration" ? node.body : null
    stmts[node.type](node)
    parts.exprs.forEach(visit_expr)
    var decls = Util.flaten(parts.stmts.map(visit_stmt))
    if (!body) { return decls }
    Util.prepend(decls, node.body)
    copy = Util.extract(node)
    node.type = "EmptyStatement"
    if (pushed) { Switch.pop() }
    return [copy]
  }

  /////////////////////////
  // Statement Compilers //
  /////////////////////////

  var stmts = {}

  stmts.EmptyStatement = Util.nil

  stmts.BlockStatement = Util.nil

  stmts.ExpressionStatement = Util.nil

  // if (EXPR) STMT             >>> if (aran.traps.booleanize(EXPR, "if")) STMT
  // if (EXPR) STMT1 else STMT2 >>> if (aran.traps.booleanize(EXPR, "if-else")) STMT1 else STMT2
  stmts.IfStatement = function (node) {
    node.test = ptrap.booleanize(node.test, node.alternate?"if-else":"if")
  }

  stmts.LabeledStatement = function (node) {
    node.label.name = "$"+node.label.name
  }

  stmts.BreakStatement = function (node) {
    if (node.label) { return Switch.escape(node.label) }
    node.label = Switch.get()
  }

  stmts.ContinueStatement = function (node) {
    if (node.label) { return Switch.escape(node.label) }
  }

  // with (EXPR) STMT >>> with (aran.with(EXPR)) STMT
  stmts.WithStatement = function (node) {
    node.object = Ptah.call(pshadow("with"), [node.object])
  }

  // TODO
  // dificult to prevent label clash
  // has to perform upfront parsing to find break
  // switch (EXPR1) { case EXPR2: STMT1 break; default: STMT2 } >>> switchX: {
  //   aran.push(EXPR1);
  //   if (aran.traps.binary("===", aran.pop(), EXPR2) { STMT1 break switchX; }
  //   STMT2
  // }
  stmts.SwitchStatement = function (node) {

  }


  stmts.ReturnStatement = Util.nil

  // throw EXPR; >>> throw aran.traps.throw(EXPR);
  stmts.ThrowStatement = function (node) {
    node.argument = ptrap.throw(node.argument)
  }

  // try {} catch (ID) {} finally {} >>> try { aran.mark() } catch (#ID) { #ID = aran.traps.catch(#ID) } finally { aran.ummark() }
  // etc...
  stmts.TryStatement = function (node) {
    node.block.body.unshift(Ptah.exprstmt(Pstack.mark()))
    if (node.handler) {
      var name = escape(node.handler.param.name)
      node.handler.param.name = name
      node.handler.body.body.unshift(Ptah.exprstmt(Ptah.assignment(Ptah.identifier(name), ptrap.catch(Ptah.identifier(name)))))
    }
    if (!node.finalizer) { node.finalizer = Ptah.block([]) }
    node.finalizer.body.unshift(Ptah.exprstmt(Pstack.unmark()))
  }

  // while (EXPR) STMT >>> while (aran.traps.booleanize(EXPR, "while")) STMT
  stmts.WhileStatement = function (node) {
    node.test = ptrap.booleanize(node.test, "while")
  }

  // do STMT while (EXPR) >>> do STMT while (aran.traps.booleanize(EXPR, "do-while"))
  stmts.DoWhileStatement = function (node) {
    node.test = ptrap.booleanize(node.test, "do-while")
  }

  // for (EXPR1 ; EXPR2 ; EXPR3) STMT >>> for (EXPR1 ; aran.traps.booleanize(EXPR2, "for") ; EXPR3) STMT
  // for (var ID1,ID2; EXPR2; EXPR3) STMT >>> for (var #ID1,#ID2; EXPR2; EXPR3) STMT
  // etc...
  stmts.ForStatement = function (node) {
    if (node.test) { node.test = ptrap.booleanize(node.test, "for") }
    if (node.init && node.init.type === "VariableDeclaration") {
      node.init.declarations.forEach(esc_decl)
    }
  }

  // for (var ID=EXPR1 in EXPR2) STMT >>> {
  //   var #ID=EXPR1;
  //   aran.push3(aran.traps.enumerate(EXPR2));
  //   try {
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.get()+1)) {
  //       #ID = aran.get3()[aran.get()];
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
  stmts.ForInStatement = function (node) {
    if (!aran.traps.enumerate) { return node }
    function for_stmt (expr) {
      return Ptah.for(
        Pstack.push(Ptah.literal(0)),
        Ptah.binary("<", Pstack.get(), Ptah.member(Pstack.get3(), "length"))),
        Pstack.push(Pstack.binary("+", Pstack.get(), Pstack.literal(1))),
        Ptah.block([Ptah.exprstmt(expr), node.body])
    }
    if (node.left.type === "MemberExpression") {
      compute_member(node.left)
      var stmts = []
      stmts.push(Pstack.push1(node.left.object))
      stmts.push(Pstack.push2(node.left.property))
      stmts.push(Pstack.push3(ptrap.enumerate(node.right)))
      var set = ptrap.set(Pstack.get1(), Pstack.get2(), Ptah.member(Pstack.get3(), Pstack.get()))
      var finally_stmts = [Pstack.pop(), Pstack.pop1(), Pstack.pop2(), Pstack.pop3()]
      stmts.push(Ptah.try([for_stmt(set)], null, null, finally_stmts))
      return Ptah.block(stmts)
    }
    var stmts = []
    if (node.left.type === "VariableDeclaration") {
      if (node.left.declarations.length !== 1) { throw new Error(node) }
      var name = node.left.declarations[0].id.name
      stmts.push(node.left); 
    } else if (node.left.type === "Identifier") {
      var name = node.left.name
    } else (node.left !== "Identifier") {
      throw new Error(node)
    }
    stmts.push(Pstack.push3(ptrap.enumerate(node.right)))
    var ass = Ptah.assignment(Ptah.identifier(name), Ptah.member(Pstack.get3(), Pstack.get1()))
    var finally_stmts = [Pstack.pop(), Pstack.pop3()]
    stmts.push(Ptah.try([for_stmt(ass)], null, null, finally_stmts))
    return Ptah.block(stmts)
  }

  // function ID (ID1,ID2) {} >>> var #ID = aran.traps.function(function (#ID1, #ID2) {})
  // etc...
  stmts.FunctionDeclaration = function (node) {
    Util.inject(Ptah.declaration(escape(node.id.name), visit_fct(Util.extract(node))), node)
  }

  // var ID1=EXPR1, ID2=EXPR2 >>> var #ID1=EXPR1, #ID2=EXPR2
  // etc...
  stmts.VariableDeclaration = function (node) {
    node.declarations.forEach(esc_decl)
  }

  //////////////////////////
  // Expression Compilers //
  //////////////////////////

  var exprs = {}

  // this >>> this===aran.global ? aran.sandbox : this
  exprs.ThisExpression = function (node) {
    return Ptah.conditional(Ptah.binary("===", node, pshadow("global")), pshadow("sandbox"), node)
  }

  // [EXPR1,,EXPR2] >>> aran.traps.array([EXPR1,,EXPR2])
  // etc...
  exprs.ArrayExpression = ptrap.array

  // {x:EXPR} >>> aran.traps.object({x:EXPR})
  // etc...
  exprs.ObjectExpression = ptrap.object

  // function (ID) {} >>> aran.traps.function(function (#ID) { arguments=aran.traps.arguments(arguments) })
  exprs.FunctionExpression = visit_fct

  exprs.sequence = Util.identity
  
  // void EXPR           >>> aran.traps.unary("void", EXPR)
  // delete EXPR1[EXPR2] >>> aran.traps.delete(EXPR1, EXPR2)
  // delete ID           >>> aran.traps.erase("ID", delete ID)
  // typeof ID           >>> aran.traps.unary("typeof", (function () { try { return #ID } catch (e) { return undefined } } ())
  // typeof EXPR         >>> aran.traps.unary("typeof", EXPR)
  // etc...
  exprs.UnaryExpression = function (node) {
    if (node.operator === "delete" && node.argument.type === "MemberExpression") {
      compute_member(node.argument)
      return ptrap.delete(node.argument.object, node.argument.property)
    }
    if (node.operator === "delete" && node.arguments.type === "Identifier") {
      return ptrap.erase(node.argument.name, node)
    }
    if (node.operator === "typeof" && node.argument.type === "Identifier") {
      var stmts1 = [Ptah.return(Ptah.identifier(escape(node.argument.name)))]
      var stmts2 = [Ptah.return(pshadow("undefined"))]
      return ptrap.unary("typeof", Ptah.call(Ptah.function([], [Ptah.try(stmts1, "e", stmts2)]), []))
    }
    return ptrap.unary(node.operator, node.argument)
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
      node.left.name = escape(node.left.name)
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

  // ++ID           >>> $ID=aran.traps.binary("+", #ID, aran.traps.primitive(1))
  // ID++           >>> (#ID = arent.traps.binary("+", aran.push(#ID), aran.traps.primitive(1), aran.pop())
  // ++EXPR1[EXPR2] >>> aran.traps.set(
  //   aran.push1(EXPR1),
  //   aran.push2(EXPR2),
  //   aran.traps.binary("+", aran.traps.get(aran.pop1(), aran.pop2()), aran.traps.primitive(1)))
  // EXPR1[EXPR2]++ >>> (
  //   aran.traps.set(
  //     aran.push1(EXPR1),
  //     aran.push2(EXPR2),
  //     aran.traps.binary("+", aran.push3(aran.traps.get(aran.pop1(), aran.pop2())), aran.traps.primitive(1))),
  //   aran.pop3()
  // )
  // etc...
  exprs.UpdateExpression = function (node) {
    var op = node.operator.substring(1)
    function one () { return ptrap.primitive(Ptah.literal(1)) }
    if (node.argument.type === "Identifier") {
      function id () { return Ptah.identifier(escape(node.argument.name)) }
      if (node.prefix) { return Ptah.assignment(id(), ptrap.binary(op, id(), one())) }
      return Ptah.sequence([Ptah.assignment(id(), ptrap.binary(op, Pstack.push(id()), one())), Pstack.pop()])
    }
    if (!node.argument.type === "MemberExpression") { throw new Error (node) }
    compute_member(node.argument)
    if (node.prefix) {
      return ptrap.set(
        Pstack.push1(node.argument.object),
        Pstack.push2(node.argument.property),
        ptrap.binary(op, ptrap.get(Pstack.pop1(), Pstack.pop2()), one())
      )
    }
    return Ptah.sequence([
      ptrap.set(
        Pstack.push1(node.argument.object),
        Pstack.push2(node.argument.property),
        ptrap.binary(op, Pstack.push3(ptrap.get(Pstack.pop1(), Pstack.pop2())), one()),
      Pstack.pop3()
    ])
  }

  // EXPR1 || EXPR2 >>> (aran.traps.booleanize(aran.push(EXPR1)) ? aran.pop() : (aran.pop(),EXPR2))
  // EXPR1 && EXPR2 >>> (aran.traps.booleanize(aran.push(EXPR1)) ? (aran.pop(),EXPR2) : aran.pop())
  exprs.LogicalExpression = function (node) {
    var test = ptrap.booleanize(Pstack.push(node.left), node.operator)
    var seq = Ptah.sequence([Pstack.pop(), node.right])
    if (node.operator === "||") { return Ptah.conditional(test, Pstack.pop(), seq) }
    if (node.operator === "&&") { return Ptah.conditional(test, seq, Pstack.pop()) }
    throw new Error(node)
  }

  // EXPR1 ? EXPR2 : EXPR3 >>> aran.traps.booleanize(EXPR1) ? EXPR2 : EXPR3
  exprs.ConditionalExpression = function (node) {
    node.test = ptrap.booleanize(node.test, '?:')
    return node
  }

  // new EXPR(EXPR1, EXPR2) >>> aran.traps.new(EXPR, [EXPR1, EXPR2])
  // etc...
  exprs.NewExpression = function (node) {
    return ptrap.new(node.callee, node.arguments)
  }

  // EXPR(EXPR1, EXPR2) >>> aran.traps.apply(EXPR, aran.undefined, [EXPR1, EXPR2])
  // EXPR1[EXPR2](EXPR3, EXPR4) >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), aran.pop(), [EXPR1, EXPR2])
  // eval(EXPR1, EXPR2) >>> (aran.push(eval)===aran.eval)
  //   ? (aran.pop(), eval(aran.compile(aran.stringify(EXPR1, EXPR2))))
  //   : aran.traps.apply(aran.pop(), aran.undefined, [EXPR1, EXPR2])
  // etc...
  exprs.CallExpression = function (node) {
    if (node.callee.type === "Identifier" && node.callee.name === "eval") {
      var test = Ptah.binary("===", Ptah.push(Ptah.identifier(escape(node.callee.name))), pshadow("eval"))
      var cons = Ptah.sequence([
        Pstack.pop(),
        Ptah.call(
          Ptah.identifier("eval"),
          Ptah.call(pshadow("compile"), [ptrap.stringify(node.arguments)])
        )
      ])
      if (aran.traps.apply) { var alt = ptrap.apply(Pstack.pop(), pshadow("undefined"), node.arguments) }
      else { var alt = Ptah.call(Pstack.pop(), node.arguments) }
      return Ptah.conditional(test, cons, alt)
    }
    if (!aran.traps.apply) { return node }
    if (node.callee.type !== "MemberExpression") { return ptrap.apply(node.callee, pshadow("undefined"), node.arguments) }
    compute_member(node.callee)
    return ptrap.apply(ptrap.get(Pstack.push(node.callee.object), node.callee.property), Pstack.pop(), node.arguments)
  }

  // EXPR.ID      >>> aran.traps.get(EXPR, "ID")
  // EXPR1[EXPR2] >>> aran.traps.get(EXPR1, EXPR2)
  exprs.MemberExpression = function (node) {
    compute_member(node)
    return ptrap.get(node.object, node.property)
  }

  // ID >>> #ID
  exprs.Identifier = function (node) {
    node.name = escape(node.name)
    return node
  }

  // REGEXP >>> aran.traps.regexp(REGEXP)
  // LIT >>> aran.traps.primitive(LIT)
  exprs.Literal = function (node) {
    if (node.regex) { return ptrap.regexp(node) }
    return ptrap.primitive(node)
  }

}
