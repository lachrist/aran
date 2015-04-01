
var Esvisit = require("esvisit")
var BE = Esvisit.BuildExpression
var BS = Esvisit.BuildStatement

function finalize (node, ancestor) {
  if (!ancestor) { return Esvisit.Ignore(node) }
  if (ancestor.$locus) { node.$locus = ancestor.$locus }
  return node
}

////////////////
// Statements //
////////////////

exports.Return = function (argument, ancestor) {
  return finalize(BS.Return(argument), ancestor)
}

exports.Try = function (trybody, catchparam, catchbody, finallybody, ancestor) {
  return finalize(BS.Try(trybody, catchparam, catchbody, finallybody), ancestor)
}

exports.Block = function (body, ancestor) {
  return finalize(BS.Block(body), ancestor)
}

exports.If = function (test, consequent, alternate, ancestor) {
  return finalize(BS.If(test, consequent, alternate), ancestor)
}

exports.IdentifierForIn = function (leftname, right, body, ancestor) {
  return finalize(BS.IdentifierForIn(leftname, right, body), ancestor)
}

exports.Label = function (labelname, statement, ancestor) {
  return finalize(BS.Label(labelname, statement), ancestor)
}

exports.Break = function (labelname, ancestor) {
   return finalize(BS.Break(labelname), ancestor)
}

exports.Empty = function (ancestor) {
  return finalize(BS.Empty(), ancestor)
}

exports.With = function (object, body, ancestor) {
  return finalize(BS.With(object, body), ancestor)
}

exports.Expression = function (expression, ancestor) {
  return finalize(BS.Expression(expression), ancestor)
}

exports.For = function (init, test, update, body, ancestor) {
  return finalize(BS.For(init, test, update, body), ancestor)
}

exports.Declaration = function (declarators, ancestor) {
  return finalize(BS.Declaration(declarators), ancestor)
}

/////////////////
// Expressions //
/////////////////

exports.This = function (ancestor) {
  return finalize(BE.This(), ancestor)
}

exports.Sequence = function (expressions, ancestor) {
  return finalize(BE.Sequence(expressions), ancestor)
}

exports.Conditional = function (test, consequent, alternate, ancestor) {
  return finalize(BE.Conditional(test, consequent, alternate), ancestor)
}

exports.IdentifierAssignment = function (leftname, right, ancestor) {
  return finalize(BE.IdentifierAssignment(leftname, right), ancestor)
}

exports.Array = function (elements, ancestor) {
  return finalize(BE.Array(elements), ancestor)
}

exports.Set = function (hash, ancestor) {
  return finalize(BE.DataObject(Object.keys(hash).map(function (k) { return Esvisit.BuildInitProperty(k, hash[k]) })), ancestor)
}

exports.DataObject = function (initproperties, ancestor) {
  return finalize(BE.DataObject(initproperties), ancestor)
}

exports.MemberAssignment = function (leftobject, leftproperty, right, ancestor) {
  return finalize(BE.MemberAssignment(leftobject, leftproperty, right), ancestor)
}

exports.Unary = function (operator, argument, ancestor) {
  return finalize(BE.Unary(operator, argument), ancestor)
}

exports.Binary = function (operator, left, right, ancestor) {
  return finalize(BE.Binary(operator, left, right), ancestor)
}

exports.EvalCall = function (arguments, ancestor) {
  return finalize(BE.EvalCall(arguments), ancestor)
}

exports.MemberCall = function (calleeobject, calleeproperty, arguments, ancestor) {
  return finalize(BE.MemberCall(calleeobject, calleeproperty, arguments), ancestor)
}

exports.Call = function (callee, arguments, ancestor) {
  return finalize(BE.Call(callee, arguments), ancestor)
}

exports.Function = function (idname, paramnames, body, ancestor) {
  return finalize(BE.Function(idname, paramnames, body), ancestor)
}

exports.HoistedFunction = function (idname, paramnames, variables, body, ancestor) {
  return finalize(BE.HoistedFunction(idname, paramnames, variables, body), ancestor)
}

exports.Member = function (object, property, ancestor) {
  return finalize(BE.Member(object, property), ancestor)
}

exports.Identifier = function (name, ancestor) {
  return finalize(BE.Identifier(name), ancestor)
}

exports.IdentifierDelete = function (idname, ancestor) {
  return finalize(BE.IdentifierDelete(idname), ancestor)
}

exports.Literal = function (value, ancestor) {
  return finalize(BE.Literal(value), ancestor)
}

///////////
// Other //
///////////

exports.Declarator = function (name, init, ancestor) {
  return finalize(Esvisit.BuildDeclarator(name, init), ancestor)
}
