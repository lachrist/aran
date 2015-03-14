
var Aran = require("../..")
var Expressions = require("../expressions.js")
var Statements = require("../Statements.js")

var hooks = require("../../analyses/DemoHooks").hooks

var aran = Aran(null, hooks, null)

var type
var container = {}

var nodes = {}
for (type in Expressions) { nodes[type] = Expressions[type] }
for (type in Statements) { nodes[type] = Statements[type] }

for (type in nodes) {
  console.log(">>>>>>>>>>>> "+type+": "+nodes[type])
  container.code = nodes[type] 
  try { aran(container) } finally { console.log(container.compiled) }
}
