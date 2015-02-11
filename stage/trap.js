
/*
 * Intercept the evaluation of some expressions/statements.
 */

var Util = require("../util.js")

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")

/////////////
// Exports //
/////////////

module.exports = function (traps) {

  if (!traps) { return { prgm:Util.identity, stmt:Util.second, expr:Util.second } }

  function stmt (type, stmt) {
    if (stmts[type]) { stmts[type](stmt) }
    return stmt
  }

  function expr (type, expr) {
    if (exprs[type]) {
      var res = exprs[type](expr)
      if (res) { Util.inject(res, expr) }
    }
    return expr
  }

  /////////////
  // Helpers //
  /////////////


  var booleanize = traps.booleanize ? function (test, place) { return Shadow("traps", "booleanize", [test, Ptah.literal(place)]) } : Util.identity

  function property (member) { return member.computed?member.property:Ptah.literal(member.property.name) }

  function forin (type, node) {
    if (!traps.enumerate) { return }
    var pushes = [Nasus.push(Ptah.literal(0))]
    var pops = [Nasus.pop()]
    if (type === "MemberForIn") {
      pushes.push(Nasus.push1(node.left.object))
      pushes.push(Nasus.push2(property(node.left.property)))
      pops.push(Nasus.pop1())
      pops.push(Nasus.pop2())
    }
    pushes.push(Nasus.push3(Shadow("traps", "enumerate", [node.right])))
    pops.push(Nasus.pop3())
    var right = Ptah.member(Nasus.get3(), Nasus.get())
    var ass
    if (type === "DeclarationForIn") { ass = Ptah.assignment(node.left.declarations[0].id.name, right) }
    if (type === "IdentifierForIn") { ass = Ptah.assignment(node.left.name, right) }
    if (type === "MemberForIn") {
      if (traps.set) { ass = Shadow("traps", "set", [Nasus.get1(), Nasus.get2(), right]) }
      else { ass = Ptah.assignment(Ptah.member(Nasus.get1(), Nasus.get2()), right) }
    }
    var trystmts = [Ptah.for(
      null,
      Ptah.binary("<", Nasus.get(), Ptah.member(Nasus.get3(), "length")),
      Nasus.push(Ptah.binary("+", Nasus.pop(), Ptah.literal(1))),
      Ptah.block([Ptah.exprstmt(ass), node.body])
    )]
    if (type === "DeclarationForIn") { trystmts.unshift(node.left) }
    var stmts = pushes.map(Ptah.exprstmt)
    stmts.push(Ptah.try(trystmts, null, null, pops.map(Ptah.exprstmt)))
    Util.inject(Ptah.block(stmts), node)
  }

  ///////////////
  // Statement //
  ///////////////

  var stmts = {}

  stmts.If = function (node) { node.test = booleanize(node.test, node.alternate?"if-else":"if") }

  stmts.Throw = function (node) { if (traps.throw) { node.argument = Shadow("traps", "throw", [node.argument]) } }

  stmts.Try = function (node) { if (node.handler && traps.catch) { node.handler.body.body.unshift(Ptah.exprstmt(Ptah.assignment(node.handler.param.name, Shadow("traps", "catch", [Ptah.identifier(node.handler.param.name)])))) } }

  stmts.While = function (node) { node.test = booleanize(node.test, "while") }

  stmts.DoWhile = function (node) { node.test = booleanize(node.test, "do-while") }

  stmts.DeclarationFor = function (node) { if (node.test) { node.test = booleanize(node.test, "for") } }

  stmts.For = function (node) { if (node.test) { node.test = booleanize(node.test, "for") } }

  // for (var ID=EXPR1 in EXPR2) STMT >>> {
  //   try {
  //     var #ID=EXPR1;
  //     aran.push3(aran.traps.enumerate(EXPR2));
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.pop()+1)) {
  //       #ID = aran.get3()[aran.get()];
  //       STMT
  //     }
  //   } finally {
  //     aran.pop();
  //     aran.pop3();
  //   }
  // }
  stmts.DeclarationForIn = function (node) { forin("DeclarationForIn", node) }

  // for (ID in EXPR2) STMT >>> { 
  //   try {
  //     aran.push3(aran.traps.enumerate(EXPR2));
  //     for (aran.push(0); aran.get()<aran.get3().length; aran.push(aran.pop()+1)) {
  //       #ID = aran.get3()[aran.get()];
  //       STMT
  //     }
  //   } finally {
  //     aran.pop();
  //     aran.pop3();
  //   }
  // }
  stmts.IdentifierForIn = function (node) { forin("IdentifierForIn", node) }

  // for (EXPR1[EXPR2] in EXPR3) STMT >>> {
  //   try {
  //     aran.push1(EXPR1);
  //     aran.push2(EXPR2);
  //     aran.push3(aran.traps.enumerate(EXPR3));
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
  stmts.MemberForIn = function (node) { forin("MemberForIn", node) }

  ////////////////
  // Expression //
  ////////////////

  var exprs = {}

  exprs.Array = function (node) { if (traps.array) { return Shadow("traps", "array", [Util.extract(node)]) } }

  exprs.Object = function (node) { if (traps.object) { return Shadow("traps", "object", [Util.extract(node)]) } }

  exprs.Function = function (node) {
    if (traps.arguments) {
      var check = true
      node.params.forEach(function (id) { if (id.name === "arguments") { check = false } })
      if (check) { node.body.body.unshift(Ptah.exprstmt(Ptah.assignment("arguments", Shadow("traps", "arguments", [Ptah.identifier("arguments")])))) }
    }
    if (traps.function) { return Shadow("traps", "function", [Util.extract(node)]) }
  }

  exprs.MemberAssignment = function (node) { if (traps.set) { return Shadow("traps", "set", [node.left.object, property(node.left), node.right]) } }

  exprs.IdentifierDelete = function (node) { if (traps.unary) { return Shadow("traps", "delete", [Ptah.literal(node.argument.name), Util.extract(node)]) } }

  exprs.MemberDelete = function (node) { if (traps.delete) { return Shadow("traps", "delete", [node.argument.object, property(node.argument)]) } }

  exprs.Unary = function (node) { if (traps.unary) { return Shadow("traps", "unary", [Ptah.literal(node.operator), node.argument]) } }

  exprs.Binary = function (node) { return Shadow("traps", "binary", [Ptah.literal(node.operator), node.left, node.right]) }

  exprs.Conditional = function (node) { node.test = booleanize(node.test, "?:") }

  // eval(EXPR1, EXPR2) >>> (aran.push(eval)===aran.eval)
  //   ? (aran.pop(), eval(aran.compile(aran.stringify(EXPR1, EXPR2))))
  //   : aran.traps.apply(aran.pop(), aran.undefined, [EXPR1, EXPR2])
  // WARNING arguments duplication in eval case (should be the only place where aliazing occurs)
  exprs.EvalCall = function (node) {
    var test = Ptah.binary("===", Ptah.push(node.callee.name), Shadow("eval"))
    var cons = Ptah.sequence([
      Nasus.pop(),
      Ptah.call(Ptah.identifier("eval"), [Ptah.call(Shadow("compile"), [Shadow("traps", "stringify", [node.arguments])])])
    ])
    var alt = traps.apply ? Shadow("traps", "apply", [Nasus.pop(), Shadow("undefined"), Ptah.array(node.arguments)]) : Ptah.call(Nasus.pop(), node.arguments)
    return Ptah.conditional(test, cons, alt)
  }

  exprs.MemberCall = function (node) {
    var get = traps.get
      ? Shadow("traps", "get", [Nasus.push(node.callee.object), property(node.callee)])
      : Ptah.member(Nasus.push(node.callee.object), property(node.callee))
    return Shadow("traps", "apply", [get, Nasus.pop(), Ptah.array(node.arguments)])
  }

  exprs.Call = function (node) { if (traps.apply) { return Shadow("traps", "apply", [node.callee, Shadow("undefined"), Ptah.array(node.arguments)]) } }

  exprs.New = function (node) { if (traps.new) { return Shadow("traps", "new", [node.callee, Ptah.array(node.arguments)]) } }

  exprs.Member = function (node) { if (traps.get) { Shadow("traps", "get", [node.object, property(node)]) } }

  exprs.Literal = function (node) {
    if (node.regex) { if (traps.regexp) { return Shadow("traps", "regexp", [Util.extract(node)]) } }
    else if (traps.primitive) { return Shadow("traps", "primitive", [Util.extract(node)]) }
  }

  ////////////
  // Return //
  ////////////

  return {prgm:Util.identity, stmt:stmt, expr:expr}

}
