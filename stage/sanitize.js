
/*
 * Sanitize JavaScript to simplify trap insertion:
 *   + Preserve aran stack
 *   + Get rid of simple syntactic sugar:
 *     - logical expression
 *     - assignment operation
 *     - update expression
 *   + Ignore use strict statement
 *   + Get rid of inline object accessor (getter - setter)
 *   + Get rid of switches
 */

// N.B. I made explicit module patterns, since 
// anonymous module pattern (i.e. '(function () {} ())')
// calls statements.Try (and throws a: stmt not defined).
// I have really no idea why it does that...

var Esvisit = require("esvisit")
var Shadow = require("../syntax/shadow.js")
var Nasus = require("../syntax/nasus.js")
var Util = require("../util.js")

module.exports = function (visit, mark) {

  var onexpressions = {}
  var onstatements = {}

  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  ////////////////////////
  // Stack Preservation //
  ////////////////////////

  onstatements.Try = function (stmt) {
    stmt.block.body.unshift(Esvisit.BS.Expression(Nasus.mark()))
    if (!stmt.finalizer) { stmt.finalizer = {type:"Block", body:[]} }
    stmt.finalizer.body.unshift(Esvisit.BS.Expression(Nasus.unmark()))
  }

  /////////////
  // Logical //
  ///////////// 

  onexpressions.Logical = function (expr) {
    return Esvisit.BE.Conditional(
      Nasus.push(expr.left),
      (expr.operator === "||") ? Nasus.pop() : Esvisit.BE.Sequence([Nasus.pop(), expr.right]),
      (expr.operator === "||") ? Esvisit.BE.Sequence([Nasus.pop(), expr.right]) : Nasus.pop()
    )
  }

  ////////////
  // Typeof //
  ////////////

  // typeof ID >>> (typeof function () {
  //   aran.mark ()
  //   try {return ID} catch (_) {}
  // } ())
  onexpressions.IdentifierTypeof = function (expr) {
    return Esvisit.BE.Unary(
      "typeof",
      Esvisit.BE.Call(
        Esvisit.BE.Function(
          null,
          [],
          [Esvisit.BS.Expression(Nasus.mark()), Esvisit.BS.Try(
            [Esvisit.BS.Return(Esvisit.BE.Identifier(expr.argument.name))],
            "_",
            [Esvisit.BS.Expression(Nasus.unmark())],
            null)]),
        []))
  }

  //////////////////
  // Assignments //
  /////////////////

  var assignmentmodule = function () {

    function pushobject (member) { return Nasus.push1(member.object) }
    function pushproperty (member) { return member.computed ? Nasus.push2(member.property) : member.property.name }
    function popmember (member) { return Esvisit.BE.Member(Nasus.pop1(), member.computed ? Nasus.pop2() : member.property.name) }

    onexpressions.IdentifierAssignment = function (expr) {
      if (expr.operator === "=") { return }
      return Esvisit.BE.IdentifierAssignment(
        "=",
        expr.left.name,
        Esvisit.BE.Binary(
          expr.operator.replace("=", ""),
          Esvisit.BE.Identifier(expr.left.name),
          expr.right
        )
      )
    }

    onexpressions.MemberAssignment = function (expr) {
      if (expr.operator === "=") { return }
      return Esvisit.BE.MemberAssignment(
        "=",
        pushobject(expr.left),
        pushproperty(expr.left),
        Esvisit.BE.Binary(
          expr.operator.replace("=", ""),
          popmember(expr.left),
          expr.right
        )
      )
    }

    onexpressions.IdentifierUpdate = function (expr) {
      var ass = Esvisit.BE.IdentifierAssignment(
        "=",
        expr.argument.name,
        Esvisit.BE.Binary(
          expr.operator[0],
          (expr.prefix?Util.identity:Nasus.push)(Esvisit.BE.Identifier(expr.argument.name)),
          Esvisit.BE.Literal(1)
        )
      )
      if (expr.prefix) { return ass }
      return Esvisit.BE.Sequence([ass, Nasus.pop()])
    }

    onexpressions.MemberUpdate = function (expr) {
      var ass = Esvisit.BE.MemberAssignment(
        "=",
        pushobject(expr.argument),
        pushproperty(expr.argument),
        Esvisit.BE.Binary(
          expr.operator[0],
          (expr.prefix?Util.identity:Nasus.push3)(popmember(expr.argument)),
          Esvisit.BE.Literal(1)
        )
      )
      if (expr.prefix) { return ass }
      return Esvisit.BE.Sequence([ass, Nasus.pop3()])
    }

  }

  assignmentmodule()

  ////////////
  // Strict //
  ////////////

  onstatements.Strict = function (stmt) { return Esvisit.BS.Empty() }

  //////////////////////
  // Inline Accessors //
  //////////////////////

  onexpressions.Object = function (expr) {
    var hasaccessor = false
    var accessors = {}
    var datadescriptors = []
    var accessordescriptors = []
    expr.properties.forEach(function (p) {
      var key = p.key.name || p.key.value
      if (p.kind === "init") { datadescriptors.push(Esvisit.BuildInitProperty(key, p.value)) }
      else {
        hasaccessor = true
        if (!accessors[key]) { accessors[key] = {} }
        accessors[key][p.kind] = Esvisit.BE.Function(null, (p.kind==="get")?[]:[p.value.params[0].name], p.value.body.body)
      }
    })
    if (!hasaccessor) { return }
    for (var key in accessors) {
      var descriptors = [
        Esvisit.BuildInitProperty("configurable", Esvisit.BE.Literal(true)),
        Esvisit.BuildInitProperty("enumerable", Esvisit.BE.Literal(true)),
      ]
      if (accessors[key].get) { descriptors.push(Esvisit.BuildInitProperty("get", accessors[key].get)) }
      if (accessors[key].set) { descriptors.push(Esvisit.BuildInitProperty("set", accessors[key].set)) }
      accessordescriptors.push(Esvisit.BuildInitProperty(key, Esvisit.BE.Object(descriptors)))
    }
    return Esvisit.BE.Call(Shadow("defineproperties"), [Esvisit.BE.Object(datadescriptors), Esvisit.BE.Object(accessordescriptors)])
  }

  ////////////
  // Switch //
  ////////////

  var switchmodule = function () {

    function escape (id) { if (/^\$*switch/.test(id.name)) { id.name="$"+id.name } }

    var counter = 0
    var stack = [null]
    function mask (stmt) { (stack.push(null), mark(pop)) }
    function pop () { stack.pop() }
    function get () { return Util.last(stack) ? ("switch"+Util.last(stack)) : null }

    onstatements.Switch = function (stmt) {
      stack.push(++counter)
      mark(pop)
      var stmts = [Esvisit.BS.Expression(Nasus.push(stmt.discriminant))]
      stmt.cases.forEach(function (c) {
        if (!c.test) { for (var i=0; i<c.consequent.length; i++) { stmts.push(c.consequent[i]) } }
        else { stmts.push(Esvisit.BS.If(Esvisit.BE.Binary("===", Nasus.get(), c.test), Esvisit.BS.Block(c.consequent))) }
      })
      return Esvisit.BS.Label(get(), Esvisit.BS.Try(stmts, null, null, [Esvisit.Halt(Esvisit.BS.Expression(Nasus.pop()))]))
    }

    onstatements.Label = function (stmt) { escape(stmt.label) }
    onstatements.Continue = function (stmt) { if (stmt.label) { escape(stmt.label) } }
    onstatements.Break = function (stmt) {
      if (stmt.label) { escape(stmt.label) }
      else if (get()) { return Esvisit.BS.Break(get()) }
    }

    onstatements.While = mask
    onstatements.DoWhile = mask
    onstatements.For = mask
    onstatements.IdentifierForIn = mask
    onstatements.MemberForIn = mask

  }

  switchmodule()

  ////////////
  // Return //
  ////////////

  return function (ast) { visit(ast, onstatement, onexpression) }

}
