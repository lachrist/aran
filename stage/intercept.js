
/*
 * Intercept the evaluation of some expressions/statements.
 */

var Esvisit = require("esvisit")
var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")

/////////////
// Exports //
/////////////

module.exports = function (visit, mark, traps, save) {

  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  var depth = 0
  function out () { depth-- }

  /////////////
  // Helpers //
  /////////////

  function trap (name, args, ancestor) {
    if (save) { args.push(Shadow("fetch", [Ptah.Literal(save(ancestor.$locus))])) }
    return Shadow("traps", name, args)
  }

  function test (test, ancestor) {
    if (!traps.test) { return test }
    return trap("test", [test], ancestor)
  }

  function undef(name, ancestor) {
    if (!traps.undefined) { return Shadow("global", "undefined") }
    return trap("undefined", [Ptah.Literal(name)], ancestor)
  }

  function property (member) { return member.computed ? member.property : Ptah.Literal(member.property.name) }

  function forin (type, node) {
    if (!traps.enumerate) { return }
    var pushes = [Nasus.push(Ptah.Literal(0))]
    var pops = [Nasus.pop()]
    if (type === "MemberForIn") {
      pushes.push(Nasus.push1(node.left.object))
      pushes.push(Nasus.push2(property(node.left)))
      pops.push(Nasus.pop1())
      pops.push(Nasus.pop2())
    }
    pushes.push(Nasus.push3(trap("enumerate", [node.right], node)))
    pops.push(Nasus.pop3())
    var right = Ptah.Member(Nasus.get3(), Nasus.get())
    var ass
    if (type === "IdentifierForIn") { ass = Ptah.IdentifierAssignment(node.left.name, right) }
    if (type === "MemberForIn") {
      if (traps.set) { ass = trap("set", [Nasus.get1(), Nasus.get2(), right], node) }
      else { ass = Ptah.MemberAssignment(Nasus.get1(), Nasus.get2(), right) }
    }
    var trystmts = [Ptah.For(
      null,
      Ptah.Binary("<", Nasus.get(), Ptah.Member(Nasus.get3(), "length")),
      Nasus.push(Ptah.Binary("+", Nasus.pop(), Ptah.Literal(1))),
      Ptah.Block([Ptah.Expression(ass), node.body])
    )]
    var stmts = pushes.map(Ptah.Expression)
    stmts.push(Ptah.Try(trystmts, null, null, pops.map(Ptah.Expression)))
    return Ptah.Block(stmts)
  }

  ///////////////
  // Statement //
  ///////////////

  var onstatements = {}

  onstatements.If = function (node) { node.test = test(node.test, node) }

  onstatements.Return = function (node) { if (!node.argument) { node.argument = undef(null, node) } }
 
  onstatements.Throw = function (node) { if (traps.throw) { node.argument = trap("throw", [node.argument], node) } }

  onstatements.Try = function (node) {
    if (traps.try)
      node.block.body.unshift(Ptah.Expression(trap("try", [], node)));
    if (node.handlers[0] && traps.catch) {
      node.handlers[0].body.body.unshift(Ptah.Expression(Ptah.IdentifierAssignment(
        node.handlers[0].param.name,
        trap("catch", [Ptah.Identifier(node.handlers[0].param.name)], node)
      )))
    }
  }

  onstatements.While = function (node) { node.test = test(node.test, node) }

  onstatements.DoWhile = function (node) { node.test = test(node.test, node) }

  onstatements.For = function (node) { if (node.test) { node.test = test(node.test, node) } }

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

  onexpressions.Array = function (node) { if (traps.array) { return trap("array", [Ptah.Array(node.elements)], node) } }

  onexpressions.Object = function (node) {
    if (traps.object) {
      var os = [];
      var dico = Object.create(null); // to avoid access Object.prototype
      node.properties.forEach(function (p) {
        var k = (p.key.type === "Identifier") ? p.key.name : p.key.value
        var o = dico[k]
        if (!o) {
          o = Ptah.Object([Ptah.InitProperty("key", Ptah.Literal(k))])
          dico[k] = o
          os.push(o)
        }
        var kind = (p.kind === "init") ? "value" : p.kind
        o.properties.push(Ptah.InitProperty(kind, p.value))
      })
      return trap("object", [Ptah.Array(os)], node)
    }
  }

  // onexpressions.DataObject = function (node) { if (traps.object) { return trap("object", [Ptah.DataObject(node.properties)], node) } }

  onexpressions.HoistedFunction = function (node) {
    (depth++, mark(out))
    if (traps.arguments) {
      var check = true
      node.params.forEach(function (id) { if (id.name === "arguments") { check = false } })
      if (check) {
        node.body.body.splice(1, 0, Ptah.Expression(Ptah.IdentifierAssignment(
          "arguments",
          trap("arguments", [Ptah.Identifier("arguments")], node))))
      }
    }
    if (traps.undefined) {
      if (node.params.length) {
        node.body.body.splice(1, 0, Ptah.Block(node.params.map(function (id) {
          return Ptah.If(
            Ptah.Binary(
              "===",
              Ptah.Identifier(id.name),
              Shadow("global", "undefined")),
            Ptah.Expression(Ptah.IdentifierAssignment(id.name, undef(id.name, node))))
        })))
      }
      if (node.body.body[0].declarations) {
        var assignments = node.body.body[0].declarations.map(function (dec) { return Ptah.IdentifierAssignment(dec.id.name, undef(dec.id.name, node)) })
        if (assignments.length === 1) { node.body.body.splice(1, 0, Ptah.Expression(assignments[0])) }
        else if (assignments.length) { node.body.body.splice(1, 0, Ptah.Expression(Ptah.Sequence(assignments))) }
      }
      node.body.body.push(Ptah.Return(undef(null, node)))
    }
    if (traps.function) { return trap("function", [Util.copy(node)], node) }
  }

  onexpressions.MemberAssignment = function (node) { if (traps.set) { return trap("set", [node.left.object, property(node.left), node.right], node) } }

  // delete ID >>> (aran.push(delete ID), aran.isobjectdelete() ? (aran.pop(), aran.deleteresult()) : primitive(aran.pop()))
  onexpressions.IdentifierDelete = function (node) {
    if (traps.delete) {
      return Ptah.Sequence([
        Nasus.push(Util.copy(node)),
        Ptah.Conditional(
          Shadow("isobjectdelete", []),
          Ptah.Sequence([Nasus.pop(), Shadow("deleteresult", [])]),
          traps.erase ? Shadow("traps", "primitive", [Nasus.pop(), node]) : Nasus.pop())])
    }
  }

  onexpressions.Unary = function (node) { if (traps.unary) { return trap("unary", [Ptah.Literal(node.operator), node.argument], node) } }

  onexpressions.MemberDelete = function (node) { if (traps.delete) { return trap("delete", [node.argument.object, property(node.argument)], node) } }

  onexpressions.Binary = function (node) { if (traps.binary) { return trap("binary", [Ptah.Literal(node.operator), node.left, node.right], node) } }

  onexpressions.Conditional = function (node) { node.test = test(node.test, node) }

  // eval(ARGS) >>> (aran.push(eval)===aran.eval) ? (aran.pop(), eval(aran.compiled(LOCAL, ARGS)) : aran.pop()(ARGS)
  // sandbox contains the original eval function <=> possibly local eval
  // the alternative eval call is known to be standard eval call
  onexpressions.EvalCall = function (node) {
    var args = node.arguments.slice()
    if (traps.eval) { args[0] = trap("eval", [args[0]], node) }
    args[0] = Shadow("compile", [
      Ptah.Literal(depth===0),
      save
        ? Shadow("fetch", [Ptah.Literal(save(node.$locus))])
        : Ptah.Literal(null),
      args[0]])
    return Ptah.Conditional(
      Ptah.Binary("===", Nasus.push(Ptah.Identifier("eval")), Shadow("global", "eval")),
      Ptah.Sequence([Nasus.pop(), Ptah.EvalCall(args)]),
      traps.apply
        ? trap("apply", [Nasus.pop(), Shadow("global"), Ptah.Array(node.arguments)], node)
        : Ptah.Call(Nasus.pop(), node.arguments))
  }

  // EXPR1.EXPR2(ARGS)
  //   traps.apply && traps.get >>> aran.traps.apply(aran.traps.get(aran.push(EXPR1), EXPR2), Nasus.pop(), [ARGS])
  //                  traps.get >>> aran.apply(aran.traps.get(aran.push(EXPR1), EXPR2), Nasus.pop(), [ARGS])
  //   traps.apply              >>> aran.global.Funtion.prototype.apply.bind(Nasus.push(EXPR1).EXPR2)(Nasus.pop(), [ARGS])
  //                            >>> EXPR1.EXPR2(ARGS)
  onexpressions.MemberCall = function (node) {
    if (!traps.get && !traps.apply) { return }
    var fct = traps.get
      ? Shadow("traps", "get", [Nasus.push(node.callee.object), property(node.callee)], node)
      : Ptah.Member(Nasus.push(node.callee.object), property(node.callee))
    var obj = Nasus.pop()
    var args = Ptah.Array(node.arguments)
    if (traps.apply) { return trap("apply", [fct, obj, args], node) }
    return Ptah.call(Shadow("global", "Function", "prototype", "apply", "bind", [fct]), [obj, args])
  }

  onexpressions.Call = function (node) { if (traps.apply) { return trap("apply", [node.callee, Shadow("global"), Ptah.Array(node.arguments)], node) } }

  onexpressions.New = function (node) { if (traps.construct) { return trap("construct", [node.callee, Ptah.Array(node.arguments)], node) } }

  onexpressions.Member = function (node) { if (traps.get) { return trap("get", [node.object, property(node)], node) } }

  onexpressions.Literal = function (node) {
    if (node.regex) { if (traps.regexp) { return trap("regexp", [Ptah.Literal(node.regex.pattern), Ptah.Literal(node.regex.flags)], node) } }
    else if (traps.primitive) { return trap("primitive", [Ptah.Literal(node.value, node)], node) }
  }

  // undefined >>> (undefined === aran.undefined) ? aran.traps.undefined(null, aran.nodes[NID]) : undefined
  onexpressions.Identifier = function (node) {
    if (traps.undefined && (node.name === "undefined")) {
      return Ptah.Conditional(
        Ptah.Binary("===", Nasus.push(Ptah.Identifier("undefined")), Shadow("global", "undefined")),
        Ptah.Sequence([Nasus.pop(), undef(null, node)]),
        Nasus.pop())
    }
    if (traps.primitive && (node.name === "NaN")) {
      return Ptah.Conditional(
        Ptah.Binary("!==", Ptah.Identifier("NaN"), Ptah.Identifier("NaN")),
        trap("primitive", [Ptah.Identifier("NaN")], node),
        Ptah.Identifier("NaN"))
    }
  }

  ////////////
  // Return //
  ////////////

  // if (x === aran.undefined) x = aran.traps.undefined("x")
  return function (isglobal, ast, topvars) {
    depth = isglobal ? 0 : 1
    visit(ast, onstatement, onexpression)
    if (traps && traps.undefined) {
      topvars.forEach(function (name) {
        ast.body.unshift(Ptah.If(
          Ptah.Binary("===", Ptah.Identifier(name), Shadow("global", "undefined")),
          Ptah.Expression(Ptah.IdentifierAssignment(name, undef(name, ast)))))
      })
    }
  }

}
