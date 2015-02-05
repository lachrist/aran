
/*
 * Get rid of simpliest JavaScript syntactic sugar
 * i.e.: LogicalExpression, UpdateExpression and AssignmentExpression
 */

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")

function pushm (member) { return Ptah.member(Nasus.push1(member.object), member.computed?Nasus.push2(member.property):member.property.name) }

function popm (member) { return Ptah.member(Nasus.pop1(), member.computed?Nasus.pop2():member.property.name) }

module.exports = function (next) {

  function expr (expr) {
    // LogicalExpression //
    if (expr.type === "LogicalExpression") {
      expr.type = "ConditionalExpression"
      expr.test = Nasus.push(node.left)
      var seq = Ptah.sequence([Nasus.pop(), node.right])
      if (expr.operator === "||") { (expr.consequent = Nasus.pop(), expr.alternate = seq) }
      else if (expr.operator === "&&") { (expr.consequent = seq, expr.alternate = Nasus.pop()) }
      else { Error("Invalid logical operator", expr) }
      next.expr(expr)
      return
    }
    // AssignmentExpression //
    if (expr.type === "AsssignmentExpression" && expr.operator !== "=") {
      var op = expr.operator.replace("=", "")
      if (expr.left.type === "Identifier") {
        var get = Ptah.identifier(node.left.name)
      } else if (expr.left.type === "MemberExpression") {
        var get =  popm(expr.left)
        expr.left = pushm(member)
      } else {
        Error("Invalid left hand side", expr)
      }
      expr.right = Ptah.binary(op, get, expr.right)
      expr.operator = "="
      next.expr(expr)
      next.expr(expr.right)
      next.expr(expr.right.left)
      return
    }
    // UpdateExpression //
    if (expr.type === "UpdateExpression") {
      var op = expr.operator.substring(1)
      if (expr.argument.type === "Identifier") {
        var left = expr.argument
        var get = Ptah.identifier(expr.argument.name)
      } else if (expr.argument.type === "MemberExpression") {
        var left = pushm(expr.argument)
        var get = popm(expr.argument)
      } else {
        Error("Invalid left hand side", expr)
      }
      if (!expr.prefix) {
        get = Nasus.push3(get)
        expr.type = "SequenceExpression"
        expr.expressions = [{}, Nasus.pop3()]
        expr = expr.expressions[0]
      }
      expr.type = "AsssignmentExpression"
      expr.operator = "="
      expr.left = left
      expr.right = Ptah.binary(op, get, Ptah.literal(1))
      next.expr(expr)
      next.expr(expr.right)
      next.expr(expr.right.left)
      next.expr(expr.right.right)
      return
    }
    // Remaing //
    next.expr(expr)
  }

  return {stmt:next.stmt, expr:expr}

}
