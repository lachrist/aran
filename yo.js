var Esvisit = require('esvisit');
var Esprima = require('esprima');

function indent () { return (new Array(depth+1)).join("  ") }
function visitStatement (type, stmt) { visit('Statement', type, stmt) }
function visitExpression (type, expr) { visit('Expression', type, expr) }
function visit (kind, type, node) {
  var id = ++counter;
  console.log(indent()+'Begin'+kind+id+': '+type+'('+Esvisit.ExtractInformation(type, node).join(", ")+')')
  depth++
  push(function () {
    depth--
    console.log(indent()+'End'+id)
  })
}

var code = 'o.a = eval("2*"+x);' // Your JS code here...
var ast = Esprima.parse(code)
var counter = 0;
var depth = 0;
var push = Esvisit.PrepareVisit(visitStatement, visitExpression)

push(ast)