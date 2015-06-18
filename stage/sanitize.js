
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

var Ptah = require("../syntax/ptah.js")
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

  // Try ::= Try
  onstatements.Try = function (stmt) {
    var unmark = Ptah.Expression(Nasus.unmark())
    return Ptah.Try(
      (stmt.block.body.unshift(Ptah.Expression(Nasus.mark())), stmt.block.body),
      stmt.handlers.length ? stmt.handlers[0].param.name : null,
      stmt.handlers.length ? stmt.handlers[0].body.body : null,
      stmt.finalizer ? (stmt.finalizer.body.unshift(unmark), stmt.finalizer.body) : [unmark],
      stmt
    )
  }

  /////////////
  // Logical //
  ///////////// 

  // Logical ::= Conditional
  onexpressions.Logical = function (expr) {
    var cond = Ptah.Conditional(
      Nasus.push(expr.left),
      Nasus.pop(),
      Ptah.Sequence([Nasus.pop(), expr.right]),
      expr)
    if (expr.operator === "&&") {
      cond.consequent = cond.alternate
      cond.alternate = Nasus.pop()
    }
    return cond
  }

  ////////////
  // Typeof //
  ////////////

  // typeof ID >>> (typeof function () { try {return ID} catch (_) {} } ())
  // IdentifierTypeof ::= Unary + Identifier
  onexpressions.IdentifierTypeof = function (expr) {
    return Ptah.Unary(
      "typeof",
      Ptah.Call(
        Ptah.Function(
          null,
          [],
          [Ptah.Try(
            [Ptah.Return(Ptah.Identifier(expr.argument.name, expr))],
            "_",
            [],
            null)]),
        []),
      expr)
  }

  //////////////////
  // Assignments //
  /////////////////

  var assignmentmodule = function () {

    function pushobject (member) { return Nasus.push1(member.object) }
    function pushproperty (member) { return member.computed ? Nasus.push2(member.property) : member.property.name }
    function popmember (member, ancestor) { return Ptah.Member(Nasus.pop1(), member.computed ? Nasus.pop2() : member.property.name, ancestor) }

    // IdentifierBinaryAssignment ::= IdentifierAssignment + Binary + Identifier
    onexpressions.IdentifierBinaryAssignment = function (expr) {
      return Ptah.IdentifierAssignment(
        expr.left.name,
        Ptah.Binary(
          expr.operator.replace("=", ""),
          Ptah.Identifier(expr.left.name, expr),
          expr.right,
          expr),
        expr)
    }

    // MemberBinaryAssignment ::= MemberAssignment + Binary + Member
    onexpressions.MemberBinaryAssignment = function (expr) {
      return Ptah.MemberAssignment(
        pushobject(expr.left),
        pushproperty(expr.left),
        Ptah.Binary(
          expr.operator.replace("=", ""),
          popmember(expr.left, expr),
          expr.right,
          expr),
        expr)
    }

    // IdentifierUpdate ::= IdentifierAssignment + Binary + Identifier + Literal
    onexpressions.IdentifierUpdate = function (expr) {
      var ass = Ptah.IdentifierAssignment(
        expr.argument.name,
        Ptah.Binary(
          expr.operator[0],
          (expr.prefix?Util.identity:Nasus.push)(Ptah.Identifier(expr.argument.name, expr)),
          Ptah.Literal(1, expr),
        expr))
      if (expr.prefix) { return ass }
      return Ptah.Sequence([ass, Nasus.pop()])
    }

    // MemberUpdate ::= MemberAssignment + Binary + Member + Literal
    onexpressions.MemberUpdate = function (expr) {
      var ass = Ptah.MemberAssignment(
        pushobject(expr.argument),
        pushproperty(expr.argument),
        Ptah.Binary(
          expr.operator[0],
          (expr.prefix?Util.identity:Nasus.push3)(popmember(expr.argument, expr)),
          Ptah.Literal(1, expr),
          expr),
        expr)
      if (expr.prefix) { return ass }
      return Ptah.Sequence([ass, Nasus.pop3()])
    }

  }

  assignmentmodule()

  ////////////
  // Strict //
  ////////////

  // Strict ::=
  onstatements.Strict = function (stmt) { return Ptah.Empty() }

  //////////////////////
  // Inline Accessors //
  //////////////////////

  // AccessorObject ::= MemberCall + DataObject + DataObject + N*DataObject + 2*N*Literal + Max(2*N*Function)
  // Semantic not preserved:
  // var Object = null
  // var o = { a:1, get b () {} } // OK
  // // NOT OK //
  // var o = Object.defineProperties({a:1}, {
  //   b: {
  //     configurable: true,
  //     enumerable: true,
  //     get: function () {}
  //   }
  // })
  // onexpressions.AccessorObject = function (expr) {
  //   var accessors = {}
  //   var properties = expr.properties.filter(function (p) {
  //     if (p.kind === "init") { return true }
  //     var k = p.key.name || p.key.value
  //     if (!accessors[k]) {
  //       accessors[k] = {
  //         configurable: Ptah.Literal(true, p),
  //         enumerable: Ptah.Literal(true, p)
  //       }
  //     }
  //     accessors[k][p.kind] = Ptah.Function(
  //       null,
  //       p.value.params.map(function (id) { return id.name }),
  //       p.value.body.body,
  //       p
  //     )
  //     return false
  //   })
  //   Object.keys(accessors).map(function (k) { accessors[k] = Ptah.Set(accessors[k], expr) })
  //   return Ptah.MemberCall(Ptah.Identifier("Object"), "defineProperties", [Ptah.DataObject(properties, expr), Ptah.Set(accessors, expr)])
  // }

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

    // Switch ::= Max(N*(If + Binary))
    onstatements.Switch = function (stmt) {
      stack.push(++counter)
      mark(pop)
      var stmts = [Ptah.Expression(Nasus.push(stmt.discriminant))]
      stmt.cases.forEach(function (c) {
        if (!c.test) { for (var i=0; i<c.consequent.length; i++) { stmts.push(c.consequent[i]) } }
        else {
          stmts.push(Ptah.If(
            Ptah.Binary("===", Nasus.get(), c.test, c),
            Ptah.Block(c.consequent),
            null,
            c))
        }
      })
      return Ptah.Label(
        get(),
        Ptah.Try(stmts, null, null, [Ptah.Expression(Nasus.pop())]))
    }

    // Label ::= Label
    onstatements.Label = function (stmt) { escape(stmt.label) }

    // Continue ::= Continue
    onstatements.Continue = function (stmt) { if (stmt.label) { escape(stmt.label) } }

    // Break ::= Break
    onstatements.Break = function (stmt) {
      if (stmt.label) { escape(stmt.label) }
      else if (get()) { return Ptah.Break(get(), stmt) }
    }

    // While ::= While
    onstatements.While = mask

    // DoWhile ::= DoWhile
    onstatements.DoWhile = mask

    // DeclarationFor ::= DeclarationFor
    onstatements.DeclarationFor = mask

    // For ::= For
    onstatements.For = mask

    // DeclarationForIn ::= DeclarationForIn
    onstatements.DeclarationForIn = mask

    // IdentifierForIn ::= IdentifierForIn
    onstatements.IdentifierForIn = mask

    // MemberForIn ::= MemberForIn
    onstatements.MemberForIn = mask

  }

  switchmodule()

  ////////////
  // Return //
  ////////////

  return function (ast) { visit(ast, onstatement, onexpression) }

}
