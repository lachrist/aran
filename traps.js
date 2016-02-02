
function empty () { return "" }

module.exports = function (namespace, names) {
  var obj = {};
  for (var k in traps)
    obj[k] = (names.indexOf(k) !== -1
      ? traps[k]
      : (k[0] === k[0].toUpperCase() ? empty : forwards[k]))
    .bind(null, namespace);
  return obj;
}

var traps = {};

var forwards = {};

////////////
// Others //
////////////

traps.Ast = function (namespace, ast, url) { return namespace+".Ast("+ast+","+url+");" }

traps.Strict = function (namespace, index) { return namespace+".Strict("+index+");" }

traps.literal = function (namespace, value, index) { return namespace+".literal("+value+","+index+")" };
forwards.literal = function (_, value, _) { return value };

traps.unary = function (namespace, operator, value, index) { return namespace+".unary("+JSON.stringify(operator)+","+value+","+index+")" };
forwards.unary = function (_, operator, value, _) { return operator+"("+value+")" };

traps.binary = function (namespace, operator, left, right, index) { return namespace+".binary("+JSON.stringify(operator)+","+left+","+right+","+index+")" };
forwards.binary = function (_, operator, left, right, _) { return "("+left+" "+operator+" "+right+")" };

/////////////////
// Environment //
/////////////////

traps.Declare = function (namespace, kind, variables, index) { return namespace+".Declare("+JSON.stringify(kind)+","+JSON.stringify(variables)+","+index+");" }

traps.read = function (namespace, variable, index) { return namespace+".read("+JSON.stringify(variable)+","+variable+","+index+")" };
forwards.read = function (_, variable, _) { return variable };

traps.write = function (namespace, variable, value, index) { return "("+variable +"="+namespace+".write("+JSON.stringify(variable)+","+variable+","+value+","+index+"))" };
forwards.write = function (_, variable, value, _) { return "("+variable+"="+value+")" };

traps.Enter = function (namespace, index) { return namespace+".Enter("+index+");" };

traps.Leave = function (namespace, index) { return namespace+".Leave("+index+");" };

///////////
// Apply //
///////////

traps.apply = function (namespace, fct, ths, args, idx) { return namespace+".apply("+fct+","+(ths||"void 0")+",["+args.join(",")+"],"+idx+")" };
forwards.apply = function (namespace, fct, ths, args, _) {
  return ths
    ? namespace+".__apply__("+fct+","+ths+",["+args.join(",")+"])"
    : "("+fct+"("+args.join(",")+"))";
};

traps.construct = function (namespace, constructor, arguments, index) { return namespace+".construct("+constructor+",["+arguments.join(",")+"],"+index+")" };
forwards.construct = function (_, constructor, arguments, _) { return  "new "+constructor+"("+arguments.join(",")+")" };

traps.Arguments = function (namespace, index) { return namespace+".Arguments(arguments,"+index+");" };

traps.return = function (namespace, value, index) { return namespace+".return("+value+","+index+")" };
forwards.return = function (_, value, _) { return value };

traps.eval = function (namespace, arguments, index) { return "eval("+namespace+".eval(["+arguments.join(",")+"][0],"+index+"))" };
forwards.eval = function (_, arguments, _) { return "eval("+arguments.join(",")+")" };

////////////
// Object //
////////////

traps.get = function (namespace, computed, object, property, index) { return namespace+".get("+object+","+(computed ? property : JSON.stringify(property))+","+index+")" };
forwards.get = function (_, computed, object, property, _) { return object+(computed ? "["+property+"]" : "."+property) };

traps.set = function (namespace, computed, object, property, value, index) { return namespace+".set("+object+","+(computed ? property : JSON.stringify(property))+","+value+","+index+")" };
forwards.set = function (_, computed, object, property, value, _) { return "("+object+(computed ? "["+property+"]" : "."+property)+"="+value+")" };

traps.delete = function (namespace, computed, object, property, index) { return namespace+".delete("+object+","+(computed ? property : JSON.stringify(property))+","+index+")" };
forwards.delete = function (_, computed, object, property, _) { return "delete "+object+(computed ? "["+property+"]" : "."+property) };

traps.enumerate = function (namespace, object, index) { return namespace+".enumerate("+object+","+index+")" };
forwards.enumerate = function (_, object, _) { return "(function(o){var ks=[];for(var k in o) ks[ks.length]=k;return ks;}("+object+"))" };

/////////////
// Control //
/////////////

traps.test = function (namespace, value, index) { return namespace+".test("+value+","+index+")" };
forwards.test = function (_, value, _) { return value };

traps.Label = function (namespace, label, index) { return namespace+".Label("+JSON.stringify(label)+","+index+");" };

traps.Break = function (namespace, label, index) { return namespace+".Break("+JSON.stringify(label)+","+index+");" };

traps.throw = function (namespace, value, index) { return namespace+".throw("+value+","+index+")" };
forwards.throw = function (_, value, _) { return value };

traps.Try = function (namespace, index) { return namespace+".Try("+index+");" };

traps.catch = function (namespace, variable, index) { return namespace+".catch("+JSON.stringify(variable)+","+variable+","+index+");" };
forwards.catch = function (_, variable, _) { return variable };

traps.Finally = function (namespace, index) { return namespace+".Finally("+index+");" };
