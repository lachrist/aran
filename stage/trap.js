
/*
 * Intercept the evaluation of some expressions/statements.
 */

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")

/////////////
// Helpers //
/////////////

function property (member) { member.computed?member.property:Ptah.literal(member.property.name) }

/////////////
// Exports //
/////////////

module.exports = function (traps) {

  var booleanize = traps.booleanize ? function (test, place) { return Shadow("traps", "booleanize", [test, place]) } : Util.identity

  function stmt (stmt) { if (stmts[stmt.type]) { stmts[stmt.type](stmt) } }

  function expr (expr) {
    if (exprs[expr.type]) {
      var res = exprs[expr.type](expr)
      if (res) { Util.inject(res, expr) }
    }
  }

  ///////////////
  // Statement //
  ///////////////

  var stmts = {}

  stmts.IfStatement = function (node) { node.test = booleanize(node.test, node.alternate?"if-else":"if") }

  stmts.ThrowStatement = function (node) { if (traps.throw) { node.argument = Shadow("traps", "throw", [node.argument]) } }

  stmts.TryStatement = function (node) {
    if (node.handler && traps.catch) {
      var name = node.handler.param.name
      node.handler.body.body.unshift(Ptah.exprstmt(Ptah.assignment(name, Shadow("traps", "catch", [Ptah.identifier(name)]))))
    }
  }

  stmts.WhileStatement = function (node) { node.test = booleanize(node.test, "while") }

  stmts.DoWhileStatement = function (node) { node.test = booleanize(node.test, "do-while") }

  stmts.ForStatement = function (node) { if (node.test) { node.test = booleanize(node.test, "for") } }

  // for (var ID=EXPR1 in EXPR2) STMT >>> {
  //   var #ID=EXPR1;
  //   aran.push3(aran.traps.enumerate(EXPR2));
  //   try {
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.pop()+1)) {
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
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.pop()+1)) {
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
  stmts.ForInStatement = function (node) {
    if (!traps.enumerate) { return }
    var stmts = []
    if (node.left.type === "VariableDeclaration") { stmts.push(node.left) }
    if (node.left.type === "MemberExpression") {
      stmts.push1(Ptah.exprstmt(Nasus.push(node.left.object)))
      stmts.push2(Ptah.exprstmt(Nasus.push(property(node.left.property))))
    }
    stmts.push(Ptah.exprstmt(Nasus.push3(Shadow("traps", "enumerate", [node.right]))))
    var right = Ptah.member(Nasus.get3(), Nasus.get())
    var ass
    if (node.left.type === "Identifier") { ass = Ptah.assignment(node.left.name, right) }
    if (node.left.type === "VariableDeclaration") { ass = Ptah.assignment(node.left.declarations[0].id.name, right) }
    if (node.left.type === "MemberExpression") {
      if (traps.set) { ass = Shadow("traps", "set", [Nasus.get1(), Nasus.get2(), right]) }
      else { ass = Ptah.assignment(node.left, right) }
    }
    var pops = [Nasus.pop(), Nasus.pop3()]
    if (node.left.type === "MemberExpression") { (pops.push(Nasus.pop1()), pops.push(Nasus.pop2())) }
    var init = Nasus.push(Ptah.literal(0))
    var test = Ptah.binary("<", Nasus.get(), Ptah.member(Nasus.get3(), "length"))
    var incr = Nasus.push(Ptah.binary("+", Nasus.pop(), Ptah.literal(1)))
    var loop = Ptah.for(init, test, incr, Ptah.block([Ptah.exprstmt(ass), node.body]))
    stmts.push(Ptah.try([loop]), null, null, pops.map(Ptah.exprstmt))
    Util.inject(Ptah.block([stmts]), node)
  }

  ////////////////
  // Expression //
  ////////////////

  var exprs = {}

  exprs.ArrayExpression = function (node) { if (traps.array) { return Shadow("traps", "array", [node]) } }

  exprs.ObjectExpression = function (node) { if (traps.object) { return Shadow("traps", "object", [node]) } }

  exprs.FunctionExpression = function (node) {
    if (traps.arguments) {
      var check = true
      node.params.forEach(function (id) { if (id.name === "arguments") { check = false } })
      if (check) { node.body.body.unshift(Ptah.exprstmt(Ptah.assignment("arguments", Shadow("traps", "arguments", [])))) }
    }
    if (traps.function) { return Shadow("traps", "function", [node]) }
  }

  exprs.AssignmentExpression = function (node) {
    if (node.left.type === "MemberExpression" && aran.traps.set) {
      return Shadow("traps", "set", [node.left.object, property(node.left)])
    }
  }

  // delete EXPR1[EXPR2] >>> aran.traps.delete(EXPR1, EXPR2)
  // delete ID           >>> aran.traps.erase("ID", delete ID)
  // delete EXPR         >>> aran.traps.unary("delete", EXPR)
  // typeof ID           >>> aran.traps.unary("typeof", (function () { try { return #ID } catch (error) { return aran.undefined } } ())
  // typeof EXPR         >>> aran.traps.unary("typeof", EXPR)
  // void EXPR           >>> aran.traps.unary("void", EXPR)
  // etc...
  exprs.UnaryExpression = function (node) {
    if (node.operator === "delete" && node.arguments.type === "Identifier") { return Shadow("traps", "erase", [Ptah.literal(node.argument.name), node]) }
    if (node.operator === "delete" && node.arguments.type === "MemberExpression") { return Shadow("traps", "delete", [node.object, property(node)]) }
    if (node.operator === "typeof" && node.argument.type === "Identifier") { return Shadow("traps", "unary", [Ptah.literal("typeof"), Ptah.call(Ptah.function([], [Ptah.try([Ptah.return(node.argument)], "error", [Ptah.return(Shadow("undefined"))])]), [])]) }
    return Shadow("traps", "unary", [Ptah.literal(node.operator), node.argument])
  }

  exprs.BinaryExpression = function (node) { return Shadow("traps", "binary", [Ptah.literal(node.operator), node.left, node.right]) }

  exprs.ConditionalExpression = function (node) {
    node.test = booleanize(node.test, "?:")
    return node
  }

  // EXPR(EXPR1, EXPR2) >>> aran.traps.apply(EXPR, aran.undefined, [EXPR1, EXPR2])
  // EXPR1[EXPR2](EXPR3, EXPR4) >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), aran.pop(), [EXPR1, EXPR2])
  // eval(EXPR1, EXPR2) >>> (aran.push(eval)===aran.eval)
  //   ? (aran.pop(), eval(aran.compile(aran.stringify(EXPR1, EXPR2))))
  //   : aran.traps.apply(aran.pop(), aran.undefined, [EXPR1, EXPR2])
  // etc...
  // WARNING arguments duplication in eval case (should be the only place where aliazing occurs)
  exprs.CallExpression = function (node) {
    if (node.callee.type === "Identifier" && node.callee.name === "eval") {
      var test = Ptah.binary("===", Ptah.push(node.callee.name), Shadow("eval"))
      var cons = Ptah.sequence([
        Nasus.pop(),
        Ptah.call(Ptah.identifier("eval"), [Ptah.call(Shadow("compile"), [Shadow("traps", "stringify", [node.arguments])])])
      ])
      var alt = traps.apply ? Shadow("traps", "apply", [Nasus.pop(), Shadow("undefined"), Ptah.array(node.arguments)]) : Ptah.call(Nasus.pop(), node.arguments)
      return Ptah.conditional(test, cons, alt)
    }
    if (!traps.apply) { return node }
    if (node.callee.type !== "MemberExpression") { return Shadow("traps", "apply", [node.callee, Shadow("undefined"), Ptah.array(node.arguments)]) }
    var get = aran.traps.get ? Shadow("traps", "get", [Nasus.push(node.callee.object), property(node.callee)]) : Ptah.member(Nasus.push(node.callee.object), property(node.callee))
    return Shadow("traps", "apply", [get, Nasus.pop(), Ptah.array(node.arguments)])
  }

  exprs.NewExpression = function (node) {
    if (traps.new) { return Shadow("traps", "new", [node.callee, Ptah.array(node.arguments)]) }
    return node
  }

  exprs.MemberExpression = function (node) {
    if (traps.get) { trap("get", [node.object, property(node)]) }
    return node
  }

  exprs.Literal = function (node) {
    if (node.regex) { if (traps.regex) { return trap("regexp", [node]) }
    if (traps.primitive) { return trap("primitive", [node]) }
    return node
  }

  ////////////
  // Return //
  ////////////

  return {stmt:stmt, expr:expr}

}
