
// Log all the executed statements/expressions. For more information about
// the node types listed below, see: https://github.com/lachrist/esvisit.

exports.hooks = {}
exports.hooks.StartRange = true
exports.hooks.EndRange = true
exports.hooks.StartLoc = true
exports.hooks.EndLoc = true
types().forEach(function (type) {
  exports.hooks[type] = function (startrange, endrange, startloc, endloc) {
    var infos = []
    for (var i=4; i<arguments.length; i++) { infos.push(arguments[i]) }
    var msg = type+":"
    msg += " range "+startrange+"->"+endrange+";"
    msg += " loc "+startloc+"->"+endloc+";"
    msg += " infos "+JSON.stringify(infos)
    console.log(msg)
  }
})

function types () {
  return [
    // Statement Types //
    "Empty",
    "Strict",
    "Block",
    "Expression",
    "If",
    "Label",
    "Break",
    "Continue",
    "With",
    "Switch",
    "Return",
    "Throw",
    "Try",
    "While",
    "DoWhile",
    "DeclarationFor",
    "For",
    "IdentifierForIn",
    "MemberForIn",
    "DeclarationForIn",
    "Definition",
    "Declaration",
    // Expression Types //
    "This",
    "Array",
    "Object",
    "Function",
    "Sequence",
    "IdentifierTypeof",
    "IdentifierDelete",
    "MemberDelete",
    "Unary",
    "Binary",
    "IdentifierAssignment",
    "MemberAssignment",
    "IdentiferUpdate",
    "MemberUpdate",
    "Logical",
    "Conditional",
    "New",
    "MemberCall",
    "EvalCall",
    "Call",
    "Member",
    "Identifier",
    "Literal"
  ]
}
