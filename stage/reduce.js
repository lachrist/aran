
/*
 * Get rid of simpliest JavaScript syntactic sugar
 * i.e.: LogicalExpression, UpdateExpression and AssignmentExpression
 */

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")

function pushm (member) { return Ptah.member(Nasus.push1(member.object), member.computed?Nasus.push2(member.property):member.property.name) }
function popm (member) { return Ptah.member(Nasus.pop1(), member.computed?Nasus.pop2():member.property.name) }

module.exports = function (next) {

  function expr (type, expr) {
    if (expr.operator) { var op = expr.operator[1] }
    // LogicalExpression //
    if (type === "Logical") {
      expr.type = "ConditionalExpression"
      expr.test = Nasus.push(node.left)
      var seq = Ptah.sequence([Nasus.pop(), node.right])
      if (expr.operator === "||") { (expr.consequent = Nasus.pop(), expr.alternate = seq) }
      else if (expr.operator === "&&") { (expr.consequent = seq, expr.alternate = Nasus.pop()) }
      else { Error("Invalid logical operator", expr) }
    }
    // IdentifierAssignment //
    if (type === "IdentifierAssignment" && expr.operator !== "=") {
      expr.operator = "="
      expr.right = Ptah.binary(op, Ptah.identifier(expr.left.name), expr.right)
      next.expr("Binary", expr.right)
      next.expr("Identifier" expr.right.left)
    }
    // MemberAssignment //
    if (type === "MemberAssignment" && expr.operator !== "=") {
      expr.operator = "="
      expr.right = Ptah.binary(op, popm(expr.left), expr.right)
      expr.left = pushm(expr.left)
      next.expr("Binary", expr.right)
      next.expr("Member", expr.right.left)
    }
    // IdentifierUpdate //
    if (type === "IdentifierUpdate") {
      type = "IdentifierAssignment"
      expr.type = "AsssignmentExpression"
      expr.operator = "="
      expr.left = expr.argument
      expr.right = Ptah.binary(op, Ptah.identifier(expr.left.name), Ptah.literal(1))
      next.expr("Binary", expr.right)
      next.expr("Identifier", expr.right.left)
      nexr.expr("Literal", expr.right.right)
    }
    // MemberUpdate //
    if (type === "MemberUpdate") {
      type = "MemberAssignment"
      expr.type = "AsssignmentExpression"
      expr.operator = "="
      expr.left = pushm(expr.argument)
      expr.right = Ptah.binary(op, popm(expr.argument), Ptah.literal(1))
      next.expr("Binary", expr.right)
      next.expr("Identifier", expr.right.left)
      nexr.expr("Literal", expr.right.right)
    }
    // Remaing //
    next.expr(type, expr)
  }

  return {prgm:next.prgm, stmt:next.stmt, expr:expr}

}
