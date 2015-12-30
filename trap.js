
// Traps expect only primitives and return strings.
//   - Lowercase traps returns an string which is a valid expression.
//   - Uppercase traps returns a string which is a sequence of statements.

var traps = {};

function empty () { return "" }

module.exports = function (xs) {
  var o = {};
  for (var k in traps)
    o[k] = traps[k][(xs.indexOf(k.toLowerCase()) === -1) ? "off" : "on"];
  return o;
}

////////////
// Others //
////////////

traps.Ast = {};
traps.Ast.on = function (ast, index) { return "aran.traps.ast("+ast+","+index+");" }
traps.Ast.off = empty

traps.Strict = {};
traps.Strict.on = function (index) { return "aran.traps.strict("+index+");" }
traps.Strict.off = empty

traps.literal = {};
traps.literal.on  = function (value, index) { return "aran.traps.literal("+value+","+index+")" };
traps.literal.off = function (value) { return value };

traps.test = {};
traps.test.on  = function (value, index) { return "aran.traps.test("+value+","+index+")" };
traps.test.off = function (value) { return value };

/////////////////
// Environment //
/////////////////

traps.Declare = {};
traps.Declare.on  = function (kind, variables, index) { return "aran.traps.declare("+JSON.stringify(kind)+","+JSON.stringify(variables)+","+index+");" }
traps.Declare.off = empty;

traps.Undeclare = {};
traps.Undeclare.on = function (kind, variables, index) { return "aran.traps.undeclare("+JSON.stringify(kind)+","+JSON.stringify(variables)+","+index+");" }
traps.Undeclare.off = empty;

traps.read = {};
traps.read.on  = function (variable, index) { return "aran.traps.read("+JSON.stringify(variable)+","+variable+","+index+")" };
traps.read.off = function (variable) { return variable };

traps.write = {};
traps.write.on  = function (variable, value, index) { return "aran.traps.write("+JSON.stringify(variable)+","+variable+","+value+","+index+")" };
traps.write.off = function (variable, value) { return value };

////////////
// Object //
////////////

traps.get = {};
traps.get.on  = function (computed, object, property, index) { return "aran.traps.get("+object+","+(computed ? property : JSON.stringify(property))+","+index+")" };
traps.get.off = function (computed, object, property) { return object+(computed ? "["+property+"]" : "."+property) };

traps.set = {};
traps.set.on  = function (computed, object, property, value, index) { return "aran.traps.set("+object+","+(computed ? property : JSON.stringify(property))+","+value+","+index+")" };
traps.set.off = function (computed, object, property, value) { return "("+object+(computed ? "["+property+"]" : "."+property)+"="+value+")" };

traps.delete = {};
traps.delete.on  = function (computed, object, property, index) { return "aran.traps.delete("+object+","+(computed ? property : JSON.stringify(property))+","+index+")" };
traps.delete.off = function (computed, object, property) { return "delete "+object+(computed ? "["+property+"]" : "."+property) };

traps.enumerate = {};
traps.enumerate.on  = function (object, index) { return "aran.traps.enumerate("+object+","+index+")" };
traps.enumerate.off = function (object) { return "aran.enumerate("+object+")" };

///////////
// Apply //
///////////

traps.construct = {};
traps.construct.on  = function (constructor, arguments, index) { return "aran.traps.construct("+constructor+",["+arguments.join(",")+"],"+index+")" };
traps.construct.off = function (constructor, arguments) { return  "new "+constructor+"("+arguments.join(",")+")" };

traps.eval = {};
traps.eval.on = function (arguments, index) {
  var r = "eval(aran.traps.eval("+arguments[0]+","+index+")";
  for (var i=1; i<arguments.length; i++)
    r+=","+arguments[i];
  return r+")";
}
traps.eval.off = function (arguments) { return "eval("+arguments.join(",")+")" };

traps.unary = {};
traps.unary.on  = function (operator, value, index) { return "aran.traps.unary("+JSON.stringify(operator)+","+value+","+index+")" };
traps.unary.off = function (operator, value) { return operator+"("+value+")" };

traps.binary = {};
traps.binary.on  = function (operator, left, right, index) { return "aran.traps.binary("+JSON.stringify(operator)+","+left+","+right+","+index+")" };
traps.binary.off = function (operator, left, right) { return "("+left+" "+operator+" "+right+")" };

traps.apply = {};
traps.apply.on  = function (function_, this_, arguments, index) { return "aran.traps.apply("+function_+","+(this_||"void null")+",["+arguments.join(",")+"],"+index+")" };
traps.apply.off = function (function_, this_, arguments) {
  return this_
    ? "aran.apply("+function_+","+this_+",["+arguments.join(",")+"])"
    : "("+function_+"("+arguments.join(",")+"))";
}

/////////////
// Control //
/////////////

traps.Try = {};
traps.Try.on  = function (index) { return "aran.traps.try("+index+");" };
traps.Try.off = empty;

traps.Catch = {};
traps.Catch.on  = function (variable, index) { return variable+" = aran.traps.catch("+variable+","+index+");" };
traps.Catch.off = empty;

traps.Finally = {};
traps.Finally.on  = function (index) { return "aran.traps.finally("+index+");" };
traps.Finally.off = empty;

traps.Break = {};
traps.Break.on  = function (label, index) { return "aran.traps.break("+JSON.stringify(label)+","+index+");" };
traps.Break.off = empty;

traps.Label = {};
traps.Label.on  = function (label, index) { return "aran.traps.label("+JSON.stringify(label)+","+index+");" };
traps.Label.off = empty;

traps.throw = {};
traps.throw.on  = function (value, index) { return "aran.traps.throw("+value+","+index+")" };
traps.throw.off = function (value) { return value };

traps.return = {};
traps.return.on  = function (value, index) { return "aran.traps.return("+value+","+index+")" };
traps.return.off = function (value) { return value };
