
// Log all the executed statements/expressions. For more information
// about the types listed below, see: https://github.com/lachrist/esvisit.

var types = [
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

exports.hooks = {}
exports.hooks.MinRange = true
exports.hooks.MaxRange = true
types.forEach(function (type) {
  exports.hooks[type] = function (min, max) {
    var infos = []
    for (var i=2; i<arguments.length; i++) { infos.push(arguments[i]) }
    console.log(type+": begin at "+min+"; end at "+max+"; infos "+JSON.stringify(infos))
  }
})
