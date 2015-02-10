
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
    if (expr.operator) { var op = expr.operator[1] }
    // LogicalExpression //
    if (type === "Logical") {
      expr.type = "ConditionalExpression"
      expr.test = Nasus.push(expr.left)
      var seq = Ptah.sequence([Nasus.pop(), expr.right])
      if (expr.operator === "||") { (expr.consequent = Nasus.pop(), expr.alternate = seq) }
      else if (expr.operator === "&&") { (expr.consequent = seq, expr.alternate = Nasus.pop()) }
      else { Error("Invalid logical operator", expr) }
    }
    // IdentifierAssignment //
    if (type === "IdentifierAssignment" && expr.operator !== "=") {
      expr.operator = "="
      expr.right = Ptah.binary(op, Ptah.identifier(expr.left.name), expr.right)
      next.expr("Identifier", expr.right.left)
      next.expr("Binary", expr.right)
    }
    // MemberAssignment //
    if (type === "MemberAssignment" && expr.operator !== "=") {
      expr.operator = "="
      expr.right = Ptah.binary(op, popm(expr.left), expr.right)
      expr.left = pushm(expr.left)
      next.expr("Member", expr.right.left)
      next.expr("Binary", expr.right)
    }
    // IdentifierUpdate //
    if (type === "IdentifierUpdate") {
      var type = "IdentifierAssignment"
      expr.type = "AssignmentExpression"
      expr.operator = "="
      expr.left = expr.argument
      var identifier = Ptah.identifier(expr.left.name)
      expr.right = Ptah.binary(op, (expr.prefix?Util.identity:Nasus.push)(identifier), Ptah.literal(1))
      next.expr("Literal", expr.right.right)
      next.expr("Identifier", identifier)
      next.expr("Binary", expr.right)
      if (!expr.prefix) {
        var copy = Util.extract(expr)
        Util.inject(Ptah.sequence([copy, Nasus.pop()]), expr)
        expr = copy
      }
    }
    // MemberUpdate //
    if (type === "MemberUpdate") {
      var type = "MemberAssignment"
      expr.type = "AssignmentExpression"
      expr.operator = "="
      expr.left = pushm(expr.argument)
      var member = popm(expr.argument)
      expr.right = Ptah.binary(op, (expr.prefix?Util.identity:Nasus.push)(member), Ptah.literal(1))
      next.expr("Literal", expr.right.right)
      next.expr("Member", member)
      next.expr("Binary", expr.right)
      if (!expr.prefix) {
        var copy = Util.extract(expr)
        Util.inject(Ptah.sequence([copy, Nasus.pop()]), expr)
        expr = copy
      }
    }
    // Remaing //
    next.expr(type, expr)
  }

  return {prgm:next.prgm, stmt:next.stmt, expr:expr}

}
