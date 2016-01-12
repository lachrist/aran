
var traps = {};

function empty () { return "" }

module.exports = function (xs) {
  var o = {};
  for (var k in traps)
    o[k] = traps[k][xs.indexOf(k) === -1 ? "off" : "on"];
  return o;
}

////////////
// Others //
////////////

traps.Ast = {};
traps.Ast.on = function (ast, index) { return "aran.Ast("+ast+","+index+");" };
traps.Ast.off = empty;

traps.Strict = {};
traps.Strict.on = function (index) { return "aran.Strict("+index+");" };
traps.Strict.off = empty;

traps.literal = {};
traps.literal.on  = function (value, index) { return "aran.literal("+value+","+index+")" };
traps.literal.off = function (value) { return value };

traps.unary = {};
traps.unary.on  = function (operator, value, index) { return "aran.unary("+JSON.stringify(operator)+","+value+","+index+")" };
traps.unary.off = function (operator, value) { return operator+"("+value+")" };

traps.binary = {};
traps.binary.on  = function (operator, left, right, index) { return "aran.binary("+JSON.stringify(operator)+","+left+","+right+","+index+")" };
traps.binary.off = function (operator, left, right) { return "("+left+" "+operator+" "+right+")" };


/////////////////
// Environment //
/////////////////

traps.Declare = {};
traps.Declare.on  = function (kind, variables, index) { return "aran.Declare("+JSON.stringify(kind)+","+JSON.stringify(variables)+","+index+");" }
traps.Declare.off = empty;

traps.read = {};
traps.read.on  = function (variable, index) { return "aran.read("+JSON.stringify(variable)+","+variable+","+index+")" };
traps.read.off = function (variable) { return variable };

traps.write = {};
traps.write.on  = function (variable, value, index) { return "("+variable +"=aran.write("+JSON.stringify(variable)+","+variable+","+value+","+index+"))" };
traps.write.off = function (variable, value) { return "("+variable+"="+value+")" };

traps.Enter = {};
traps.Enter.on  = function (index) { return "aran.Enter("+index+");" };
traps.Enter.off = empty;

traps.Leave = {};
traps.Leave.on  = function (index) { return "aran.Leave("+index+");" };
traps.Leave.off = empty;

///////////
// Apply //
///////////

traps.apply = {};
traps.apply.on  = function (fct, ths, args, idx) { return "aran.apply("+fct+","+(ths||"void 0")+",["+args.join(",")+"],"+idx+")" };
traps.apply.off = function (fct, ths, args) {
  return ths
    ? "aran.__apply__("+fct+","+ths+",["+args.join(",")+"])"
    : "("+fct+"("+args.join(",")+"))";
};

traps.construct = {};
traps.construct.on  = function (constructor, arguments, index) { return "aran.construct("+constructor+",["+arguments.join(",")+"],"+index+")" };
traps.construct.off = function (constructor, arguments) { return  "new "+constructor+"("+arguments.join(",")+")" };

traps.Arguments = {};
traps.Arguments.on  = function (index) { return "aran.Arguments(arguments,"+index+");" };
traps.Arguments.off = empty;

traps.return = {};
traps.return.on  = function (value, index) { return "aran.return("+value+","+index+")" };
traps.return.off = function (value) { return value };

traps.eval = {};
traps.eval.on = function (arguments, index) { return "eval(aran.eval(["+arguments.join(",")+"][0],"+index+"))" };
traps.eval.off = function (arguments) { return "eval("+arguments.join(",")+")" };

////////////
// Object //
////////////

traps.get = {};
traps.get.on  = function (computed, object, property, index) { return "aran.get("+object+","+(computed ? property : JSON.stringify(property))+","+index+")" };
traps.get.off = function (computed, object, property) { return object+(computed ? "["+property+"]" : "."+property) };

traps.set = {};
traps.set.on  = function (computed, object, property, value, index) { return "aran.set("+object+","+(computed ? property : JSON.stringify(property))+","+value+","+index+")" };
traps.set.off = function (computed, object, property, value) { return "("+object+(computed ? "["+property+"]" : "."+property)+"="+value+")" };

traps.delete = {};
traps.delete.on  = function (computed, object, property, index) { return "aran.delete("+object+","+(computed ? property : JSON.stringify(property))+","+index+")" };
traps.delete.off = function (computed, object, property) { return "delete "+object+(computed ? "["+property+"]" : "."+property) };

traps.enumerate = {};
traps.enumerate.on  = function (object, index) { return "aran.enumerate("+object+","+index+")" };
traps.enumerate.off = function (object) { return "aran.__enumerate__("+object+")" };

/////////////
// Control //
/////////////

traps.test = {};
traps.test.on  = function (value, index) { return "aran.test("+value+","+index+")" };
traps.test.off = function (value) { return value };

traps.Label = {};
traps.Label.on  = function (label, index) { return "aran.Label("+JSON.stringify(label)+","+index+");" };
traps.Label.off = empty;

traps.Break = {};
traps.Break.on  = function (label, index) { return "aran.Break("+JSON.stringify(label)+","+index+");" };
traps.Break.off = empty;

traps.throw = {};
traps.throw.on  = function (value, index) { return "aran.throw("+value+","+index+")" };
traps.throw.off = function (value) { return value };

traps.Try = {};
traps.Try.on  = function (index) { return "aran.Try("+index+");" };
traps.Try.off = empty;

traps.catch = {};
traps.catch.on  = function (variable, index) { return "aran.catch("+JSON.stringify(variable)+","+variable+","+index+");" };
traps.catch.off = function (variable) { return variable };

traps.Finally = {};
traps.Finally.on  = function (index) { return "aran.Finally("+index+");" };
traps.Finally.off = empty;
