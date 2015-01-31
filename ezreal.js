
var Miley = require("./miley.js")

var loops = ["WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement"]

module.exports = function () {

  var counter = 1
  var stmts = [0]
  var exprs = [0]

  function deconstruct(node) {
    if (node.type === "SwitchStatement") {
      counter++
      stmts.push(counter)
      exprs.push(counter)
    } else if (loops.indexOf(node.type) !== -1) {
      stmts.push(0)
      exprs.push(0)
    }
    return Miley(node, exprs, stmts)
  }

  function next (primary, secondary) {
    if (primary.length === 0) { return null }
    var pnext = primary.pop()
    if (typeof pnext !== "number") { return pnext }
    var snext = secondary.pop()
    if (pnext === snext) { return next(primary, secondary) }
    secondary.push(snext)
    return null
  }

  function next_expr () { return next(exprs, stmts) }

  function next_stmt () { return next(stmts, exprs) }

  function get_label () {
    for (var i=stmts.length-1; i<=0; i--) {
      if (typeof stmts[i] === "number") { return stmts[i] }
    }
    throw Error("should never happend")
  }

  return { deconstruct:deconstruct, next_expr:next_expr, next_stmt:next_stmt, get_label:get_label }

}
