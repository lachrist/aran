
var counter = 0
var labels = [null]

var masks = ["FunctionExpression", "FunctionDeclaration", "ForStatement", "ForInStatement", "WhileStatement", "DoWhileStatement"]

exports.escape = function (id) {
  if (id.name.indexOf("switch") === 0) { id.name = "$"+id.name}
}

exports.push = function (type) {
  if (masks.indexOf(type) !== -1) {
    labels.push(null)
    return true
  }
  if (type === "SwitchStatement") {
    labels.push("switch"+(++counter))
    return true
  }
  return false
}

exports.get = function () {
  if (labels[labels.length-1]) { return {type:"Identifier", name:labels[labels.length-1]} }
  return null
}

exports.pop = function () { labels.pop() }
