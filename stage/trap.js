
/*
 * Intercept the evaluation of some expressions/statements.
 */

var Util = require("../util.js")
var Esvisit = require("esvisit")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")

/////////////
// Exports //
/////////////

module.exports = function (visit, mark, traps) {

  function statement (type, stmt) { if (statements[type]) { return statements[type](stmt) } }
  function expression (type, expr) { if (expressions[type]) { return expressions[type](expr) } }

  /////////////
  // Helpers //
  /////////////

  function booleanize (test, place) {
    if (!traps.booleanize) { return test }
    return Shadow("traps", "booleanize", [test, Esvisit.BE.literal(place)])
  }

  function undef(place) { return Shadow("traps", "undefined", [Esvisit.BE.Literal(place)]) }

  function property (member) { return member.computed ? member.property : Esvisit.BE.Literal(member.property.name) }

  function forin (type, node) {
    if (!traps.enumerate) { return }
    var pushes = [Nasus.push(Esvisit.BE.Literal(0))]
    var pops = [Nasus.pop()]
    if (type === "MemberForIn") {
      pushes.push(Nasus.push1(node.left.object))
      pushes.push(Nasus.push2(property(node.left.property)))
      pops.push(Nasus.pop1())
      pops.push(Nasus.pop2())
    }
    pushes.push(Nasus.push3(Shadow("traps", "enumerate", [node.right])))
    pops.push(Nasus.pop3())
    var right = Esvisit.BE.Member(Nasus.get3(), Nasus.get())
    var ass
    if (type === "IdentifierForIn") { ass = Esvisit.BE.IdentifierAssignment(node.left.name, right) }
    if (type === "MemberForIn") {
      if (traps.set) { ass = Shadow("traps", "set", [Nasus.get1(), Nasus.get2(), right]) }
      else { ass = Esvisit.BE.MemberAssignment(Nasus.get1(), Nasus.get2(), right) }
    }
    var trystmts = [Esvisit.BE.For(
      null,
      Esvisit.BE.binary("<", Nasus.get(), Esvisit.BE.Member(Nasus.get3(), "length")),
      Nasus.push(Esvisit.BE.Binary("+", Nasus.pop(), Esvisit.BE.Literal(1))),
      Esvisit.BS.Block([Esvisit.BS.Expression(ass), node.body])
    )]
    var stmts = pushes.map(Esvisit.BS.Expression)
    stmts.push(Esvisit.BE.Try(trystmts, null, null, pops.map(Esvisit.BS.Expression)))
    return Esvisit.BE.Block(stmts)
  }

  ///////////////
  // Statement //
  ///////////////

  var stmts = {}

  stmts.If = function (node) { node.test = booleanize(node.test, node.alternate?"if-else":"if") }

  statements.Return = function (node) { if (traps.undefined && !node.argument) { node.argument = undef("empty-return") } }

  statements.Throw = function (node) { if (traps.throw) { node.argument = Shadow("traps", "throw", [node.argument]) } }

  statements.Try = function (node) {
    if (node.handlers[0] && traps.catch) {
      node.handlers[0].body.body.unshift(bs.Expression(be.IdentifierAssignment(
        "=",
        node.handlers[0].param.name,
        Shadow("traps", "catch", [be.Identifier(node.handlers[0].param.name)]))
      ))
    }
  }

  statements.While = function (node) { node.test = booleanize(node.test, "while") }

  statements.DoWhile = function (node) { node.test = booleanize(node.test, "do-while") }

  statements.For = function (node) { if (node.test) { node.test = booleanize(node.test, "for") } }

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
  statements.IdentifierForIn = function (node) { return forin("IdentifierForIn", node) }

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
  statements.MemberForIn = function (node) { return forin("MemberForIn", node) }

  ////////////////
  // Expression //
  ////////////////

  var expressions = {}

  expressions.Array = function (node) { if (traps.array) { return Shadow("traps", "array", [Esvisit.BE.Array(node.elements)]) } }

  expressions.Object = function (node) { if (traps.object) { return Shadow("traps", "object", [Esvisit.BE.Object(node.properties)]) } }

  expressions.Function = function (node) {
    if (traps.arguments) {
      var check = true
      node.params.forEach(function (id) { if (id.name === "arguments") { check = false } })
      if (check) { node.body.body.unshift(Esvisit.BS.Expression(Esvisit.BE.IdentifierAssignment("arguments", Shadow("traps", "arguments", [Esvisit.BE.Identifier("arguments")])))) }
    }
    if (traps.undefined) {
      node.body.body.unshift(Esvisit.BS.Block(node.params.map(function (id) {
        return Esvisit.BS.If(
          Esvisit.BE.Binary(
            "===",
            Esvisit.BE.Identifier(id.name),
            Shadow("undefined")),
          Esvisit.BS.Expression(
            Esvisit.BE.IdentifierAssignment(
              "=",
              Esvisit.BE.Identifier(id.name),
              undef("argument"))))
      })))
      node.body.body.push(Esvisit.BS.Return(undef("return")))
    }
    if (traps.function) { return Shadow("traps", "function", [Esvisit.BE.Function(node.params, node.body.body)]) }
  }

  expressions.MemberAssignment = function (node) { if (traps.set) { return Shadow("traps", "set", [node.left.object, property(node.left), node.right]) } }

  expressions.IdentifierDelete = function (node) { if (traps.unary) { return Shadow("traps", "erase", [Esvisit.BE.Literal(node.argument.name), Util.copy(node)]) } }

  expressions.MemberDelete = function (node) { if (traps.delete) { return Shadow("traps", "delete", [node.argument.object, property(node.argument)]) } }

  expressions.Unary = function (node) { if (traps.unary) { return Shadow("traps", "unary", [Esvisit.BE.Literal(node.operator), node.argument]) } }

  expressions.Binary = function (node) { return Shadow("traps", "binary", [Esvisit.BE.Literal(node.operator), node.left, node.right]) }

  expressions.Conditional = function (node) { node.test = booleanize(node.test, "?:") }

  // eval(EXPR1, EXPR2) >>> (eval===aran.eval)
  //   ? eval(aran.compile(aran.stringify(EXPR1, EXPR2)))
  //   : aran.traps.apply(eval, aran.undefined, [EXPR1, EXPR2])
  // WARNING arguments duplication in eval case (should be the only place where aliazing occurs)
  expressions.EvalCall = function (node) {
    var args = [Esvisit.BE.Identifier("eval"), traps.undefined?undef("context"):Shadow("undefined"), node.arguments]
    return Esvisit.BE.Conditional(
      Esvisit.BE.Binary(
        "===",
        Esvisit.BE.Identifier(node.callee.name),
        Shadow("eval")),
      Esvisit.BE.EvalCall(
        Shadow("compile"),
        [traps.stringify ? Shadow("traps", "stringify", node.arguments) : node.arguments]),
      traps.apply
        ? Shadow("traps", "apply", args)
        : (traps.undefined
           ? Shadow("apply", args)
           : Esvisit.BE.EvalCall(node.arguments)))
  }

  // EXPR1.EXPR2(ARGS)
  //   traps.apply && traps.get >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), Nasus.pop(), [ARGS])
  //                  traps.get >>> aran.apply(aran.aran.traps.get(aran.push(EXPR1), EXPR2), Nasus.pop(), [ARGS])
  //   traps.apply              >>> aran.traps.apply(Nasus.push(EXPR1).EXPR2, Nasus.pop(), [ARGS]) 
  //                            >>> EXPR1.EXPR2(ARGS)
  expressions.MemberCall = function (node) {
    var get = traps.get
      ? Shadow("traps", "get", [Nasus.push(node.callee.object), property(node.callee)])
      : Esvisit.BE.Member(Nasus.push(node.callee.object), property(node.callee))
    if (traps.apply) { return Shadow("traps", "apply", [get, Nasus.pop(), Esvisit.BE.Array(node.arguments)]) }
    if (traps.get) { return Shadow("apply", [get, Nasus.pop(), Esvisit.BE.Array(node.arguments)]) }
  }

  expressions.Call =  function (node) {
    var args = [node.callee, traps.undefined?undef("context"):Shadow("undefined"), Esvisit.BE.Array(node.arguments)]
    if (traps.apply) { return Shadow("traps", "apply", args) }
    if (traps.undefined) { return Shadow("apply", args) }
  }

  expressions.New = function (node) { if (traps.new) { return Shadow("traps", "new", [node.callee, Esvisit.BE.Array(node.arguments)]) } }

  expressions.Member = function (node) { if (traps.get) { return Shadow("traps", "get", [node.object, property(node)]) } }

  expressions.Literal = function (node) {
    if (node.regex) { if (traps.regexp) { return Shadow("traps", "regexp", [Esvisit.BE.Literal(node.regex.pattern), Esvisit.BE.Literal(node.regex.flags)]) } }
    else if (traps.primitive) { return Shadow("traps", "primitive", [Esvisit.BE.Literal(node.value)]) }
  }

  ////////////
  // Return //
  ////////////

  return function (ast) { visit(ast, expression, statement) }

}
