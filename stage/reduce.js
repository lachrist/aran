
/*
 * Get rid of simpliest JavaScript syntactic sugar
 * i.e.: LogicalExpression, UpdateExpression and AssignmentExpression
 */

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")
var Util =require("../util.js")

function pushm (member) { return Ptah.member(Nasus.push1(member.object), member.computed?Nasus.push2(member.property):member.property.name) }
function popm (member) { return Ptah.member(Nasus.pop1(), member.computed?Nasus.pop2():member.property.name) }

module.exports = function (next) {

  function expr (type, expr) {
    if (exprs[type]) { return exprs[type](expr) }
    return next.expr(type, expr)
  }

  var exprs = {}

  exprs.Logical = function (expr) {
    expr.type = "ConditionalExpression"
    expr.test = Nasus.push(expr.left)
    var seq = Ptah.sequence([Nasus.pop(), expr.right])
    if (expr.operator === "||") { (expr.consequent = Nasus.pop(), expr.alternate = seq) }
    else if (expr.operator === "&&") { (expr.consequent = seq, expr.alternate = Nasus.pop()) }
    else { Error("Invalid logical operator", expr) }
    return next.expr("Conditional", expr)
  }

  exprs.IdentifierAssignment = function (expr) {
    if (expr.operator !== "=") {
      var op = expr.operator.replace("=", "")
      expr.operator = "="
      expr.right = next.expr("Binary", Ptah.binary(op, next.expr("Identifier", Ptah.identifier(expr.left.name)), expr.right))
    }
    return next.expr("IdentifierAssignment", expr)
  }

  exprs.MemberAssignment = function (expr) {
    if (expr.operator !== "=") {
      var op = expr.operator.replace("=", "")
      expr.operator = "="
      expr.right = next.expr("Binary", Ptah.binary(op, next.expr("Member", popm(expr.left)), expr.right))
      expr.left = pushm(expr.left)
    }
    return next.expr("MemberAssignment", expr)
  }

  exprs.IdentifierUpdate = function (expr) {
    var op = expr.operator[0]
    var prefix = expr.prefix
    expr.type = "AssignmentExpression"
    expr.operator = "="
    expr.left = expr.argument
    var get = (prefix?Util.identity:Nasus.push)(next.expr("Identifier", Ptah.identifier(expr.left.name)))
    expr.right = next.expr("Binary", Ptah.binary(op, get, next.expr("Literal", Ptah.literal(1))))
    next.expr("IdentifierAssignment", expr)
    if (!prefix) { Util.inject(Ptah.sequence([Util.extract(expr), Nasus.pop()]), expr) }
    return expr
  }

  exprs.MemberUpdate = function (expr) {
    var op = expr.operator[0]
    var prefix = expr.prefix
    expr.type = "AssignmentExpression"
    expr.operator = "="
    expr.left = pushm(expr.argument)
    var get = (prefix?Util.identity:Nasus.push)(next.expr("Member", popm(expr.argument)))
    expr.right = next.expr("Binary", Ptah.binary(op, get, next.expr("Literal", Ptah.literal(1))))
    next.expr("MemberAssignment", expr)
    if (!prefix) { Util.inject(Ptah.sequence([Util.extract(expr), Nasus.pop()]), expr) }
    return expr
  }

  return {prgm:next.prgm, stmt:next.stmt, expr:expr}

}
