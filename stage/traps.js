
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

  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  /////////////
  // Helpers //
  /////////////

  function booleanize (test, cause) {
    if (!traps.booleanize) { return test }
    return Shadow("traps", "booleanize", [test, Esvisit.BE.Literal(cause)])
  }

  function undef(cause) {
    if (!traps.undefined) { return Shadow("undefined") }
    return Shadow("traps", "undefined", [Esvisit.BE.Literal(cause)])
  }

  function property (member) { return member.computed ? member.property : Esvisit.BE.Literal(member.property.name) }

  function forin (type, node) {
    if (!traps.enumerate) { return }
    var pushes = [Nasus.push(Esvisit.BE.Literal(0))]
    var pops = [Nasus.pop()]
    if (type === "MemberForIn") {
      pushes.push(Nasus.push1(node.left.object))
      pushes.push(Nasus.push2(property(node.left)))
      pops.push(Nasus.pop1())
      pops.push(Nasus.pop2())
    }
    pushes.push(Nasus.push3(Shadow("traps", "enumerate", [node.right])))
    pops.push(Nasus.pop3())
    var right = Esvisit.BE.Member(Nasus.get3(), Nasus.get())
    var ass
    if (type === "IdentifierForIn") { ass = Esvisit.BE.IdentifierAssignment("=", node.left.name, right) }
    if (type === "MemberForIn") {
      if (traps.set) { ass = Shadow("traps", "set", [Nasus.get1(), Nasus.get2(), right]) }
      else { ass = Esvisit.BE.MemberAssignment("=", Nasus.get1(), Nasus.get2(), right) }
    }
    var trystmts = [Esvisit.BS.For(
      null,
      Esvisit.BE.Binary("<", Nasus.get(), Esvisit.BE.Member(Nasus.get3(), "length")),
      Nasus.push(Esvisit.BE.Binary("+", Nasus.pop(), Esvisit.BE.Literal(1))),
      Esvisit.BS.Block([Esvisit.BS.Expression(ass), node.body])
    )]
    var stmts = pushes.map(Esvisit.BS.Expression)
    stmts.push(Esvisit.BS.Try(trystmts, null, null, pops.map(Esvisit.BS.Expression)))
    return Esvisit.BS.Block(stmts)
  }

  function call (node) { if (traps.apply) { return Shadow("traps", "apply", [node.callee, Shadow("global"), Esvisit.BE.Array(node.arguments)]) } }

  ///////////////
  // Statement //
  ///////////////

  var onstatements = {}

  onstatements.If = function (node) { node.test = booleanize(node.test, node.alternate?"if-else":"if") }

  onstatements.Return = function (node) { if (!node.argument) { node.argument = undef("empty-return") } }

  onstatements.Throw = function (node) { if (traps.throw) { node.argument = Shadow("traps", "throw", [node.argument]) } }

  onstatements.Try = function (node) {
    if (node.handlers[0] && traps.catch) {
      node.handlers[0].body.body.unshift(Esvisit.BS.Expression(Esvisit.BE.IdentifierAssignment(
        "=",
        node.handlers[0].param.name,
        Shadow("traps", "catch", [Esvisit.BE.Identifier(node.handlers[0].param.name)]))
      ))
    }
  }

  onstatements.While = function (node) { node.test = booleanize(node.test, "while") }

  onstatements.DoWhile = function (node) { node.test = booleanize(node.test, "do-while") }

  onstatements.For = function (node) { if (node.test) { node.test = booleanize(node.test, "for") } }

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
  onstatements.IdentifierForIn = function (node) { return forin("IdentifierForIn", node) }

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
  onstatements.MemberForIn = function (node) { return forin("MemberForIn", node) }

  ////////////////
  // Expression //
  ////////////////

  var onexpressions = {}

  onexpressions.Array = function (node) { if (traps.array) { return Shadow("traps", "array", [Esvisit.BE.Array(node.elements)]) } }

  onexpressions.Object = function (node) { if (traps.object) { return Shadow("traps", "object", [Esvisit.BE.Object(node.properties)]) } }

  onexpressions.HoistedFunction = function (node) {
    if (traps.arguments) {
      var check = true
      node.params.forEach(function (id) { if (id.name === "arguments") { check = false } })
      if (check) { node.body.body.splice(1, 0, Esvisit.BS.Expression(Esvisit.BE.IdentifierAssignment("=", "arguments", Shadow("traps", "arguments", [Esvisit.BE.Identifier("arguments")])))) }
    }
    if (traps.undefined) {
      if (node.params.length) {
        node.body.body.splice(1, 0, Esvisit.BS.Block(node.params.map(function (id) {
          return Esvisit.BS.If(
            Esvisit.BE.Binary(
              "===",
              Esvisit.BE.Identifier(id.name),
              Shadow("undefined")),
            Esvisit.BS.Expression(
              Esvisit.BE.IdentifierAssignment(
                "=",
                id.name,
                undef("argument-"+id.name))))
        })))
      }
      if (node.body.body[0].declarations) {
        var assignments = node.body.body[0].declarations.map(function (dec) { return Esvisit.BE.IdentifierAssignment("=", dec.id.name, undef("variable-"+dec.id.name)) })
        if (assignments.length === 1) { node.body.body.splice(1, 0, Esvisit.BS.Expression(assignments[0])) }
        else if (assignments.length) { node.body.body.splice(1, 0, Esvisit.BS.Expression(Esvisit.BE.Sequence(assignments))) }
      }
      node.body.body.push(Esvisit.BS.Return(undef("no-return")))
    }
    if (traps.function) { return Shadow("traps", "function", [Util.copy(node)]) }
  }

  onexpressions.MemberAssignment = function (node) { if (traps.set) { return Shadow("traps", "set", [node.left.object, property(node.left), node.right]) } }

  // delete ID >>> (aran.push(delete ID), aran.deleted() ? (aran.pop(), aran.deleteresult()) : erase("ID", aran.pop()))
  onexpressions.IdentifierDelete = function (node) {
    if (traps.delete) {
      return Esvisit.BE.Sequence([
        Nasus.push(Util.copy(node)),
        Esvisit.BE.Conditional(
          Shadow("deleted", []),
          Esvisit.BE.Sequence([Nasus.pop(), Shadow("deleteresult", [])]),
          traps.erase ? Shadow("traps", "erase", [Esvisit.BE.Literal(node.argument.name), Nasus.pop()]) : Nasus.pop())])
    }
    if (traps.erase) { return Shadow("traps", "erase", [Esvisit.BE.Literal(node.argument.name), Util.copy(node)]) }
  }

  onexpressions.Unary = function (node) { if (traps.unary) { return Shadow("traps", "unary", [Esvisit.BE.Literal(node.operator), node.argument]) } }

  onexpressions.MemberDelete = function (node) { if (traps.delete) { return Shadow("traps", "delete", [node.argument.object, property(node.argument)]) } }

  onexpressions.Binary = function (node) { if (traps.binary) { return Shadow("traps", "binary", [Esvisit.BE.Literal(node.operator), node.left, node.right]) } }

  onexpressions.Conditional = function (node) { node.test = booleanize(node.test, "?:") }

  // We handle direct eval call in stage/hoist.js
  onexpressions.EvalCall = call

  // EXPR1.EXPR2(ARGS)
  //   traps.apply && traps.get >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), Nasus.pop(), [ARGS])
  //                  traps.get >>> aran.apply(aran.aran.traps.get(aran.push(EXPR1), EXPR2), Nasus.pop(), [ARGS])
  //   traps.apply              >>> aran.traps.apply(Nasus.push(EXPR1).EXPR2, Nasus.pop(), [ARGS])
  //                            >>> EXPR1.EXPR2(ARGS)
  onexpressions.MemberCall = function (node) {
    var get = traps.get
      ? Shadow("traps", "get", [Nasus.push(node.callee.object), property(node.callee)])
      : Esvisit.BE.Member(Nasus.push(node.callee.object), property(node.callee))
    if (traps.apply) { return Shadow("traps", "apply", [get, Nasus.pop(), Esvisit.BE.Array(node.arguments)]) }
    if (traps.get) { return Shadow("apply", [get, Nasus.pop(), Esvisit.BE.Array(node.arguments)]) }
  }

  onexpressions.Call = call

  onexpressions.New = function (node) { if (traps.new) { return Shadow("traps", "new", [node.callee, Esvisit.BE.Array(node.arguments)]) } }

  onexpressions.Member = function (node) { if (traps.get) { return Shadow("traps", "get", [node.object, property(node)]) } }

  onexpressions.Literal = function (node) {
    if (node.regex) { if (traps.regexp) { return Shadow("traps", "regexp", [Esvisit.BE.Literal(node.regex.pattern), Esvisit.BE.Literal(node.regex.flags)]) } }
    else if (traps.primitive) { return Shadow("traps", "primitive", [Esvisit.BE.Literal(node.value)]) }
  }

  // undefined >>> (undefined === aran.undefined) ? aran.traps.undefined("identifier") : undefined
  onexpressions.Identifier = function (node) {
    if (traps.undefined && (node.name === "undefined")) {
      return Esvisit.BE.Conditional(
        Esvisit.BE.Binary(
          "===",
          Esvisit.BE.Identifier("undefined"),
          Shadow("undefined")),
        undef("explicit"),
        Esvisit.BE.Identifier("undefined"))
    }
  }

  ////////////
  // Return //
  ////////////

  // var x = x === aran.undefined ? aran.traps.undefined("variable-x") : x
  return function (ast, topvars) {
    visit(ast, onstatement, onexpression)
    var declarators = topvars.map(function (name) {
      return Esvisit.BuildDeclarator(name, (!traps.undefined) ? null : Esvisit.BE.Conditional(
        Esvisit.BE.Binary(
          "===",
          Esvisit.BE.Identifier(name),
          Shadow("undefined")),
        undef("variable-"+name),
        Esvisit.BE.Identifier(name)))
    })
    if (declarators.length) { ast.body.unshift(Esvisit.BS.Declaration(declarators)) }
    topvars.length = 0
  }

}
