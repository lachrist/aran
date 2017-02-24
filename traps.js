
function empty () { return "" }

function make (test, name, namespace) {
  return test
    ? traps[name].bind(null, namespace)
    : (name[0] === name[0].toUpperCase()
      ? empty
      : forwards[name]).bind(null, namespace);
}

module.exports = function (namespace, predicates) {
  return Object.keys(traps).reduce(function (o, k) {
    var x = typeof predicates === "function"
      ? predicates
      : (Array.isArray(predicates)
        ? predicates.indexOf(k) !== -1
        : predicates[k]); 
    o[k] = (typeof x === "function")
      ? function () { return make(x(arguments[arguments.length - 1]), k, namespace).apply(null, arguments) }
      : make(x, k, namespace)
    return o;
  }, {});
}

var traps = {};

var forwards = {};

/////////////
// General //
/////////////

traps.Program = function (namespace, index) { return namespace+".Program("+index+");" };

traps.Strict = function (namespace, index) { return namespace+".Strict("+index+");" };

//////////////
// Creation //
//////////////

traps.primitive = function (namespace, value, index) { return namespace+".primitive("+value+","+index+")" };
forwards.primitive = function (_, value, _) { return value };

traps.closure = function (namespace, closure, index) { return namespace+".closure("+closure+","+index+")" };
forwards.closure = function (_, closure, index) { return closure };

function property (prp) { return "{key:"+prp.key+",configurable:true,enumerable:true,"+(prp.kind === "init" ? "writable:true,value" : prp.kind)+":"+prp.value+"}" }
traps.object = function (namespace, properties, index) { return namespace+".object(["+properties.map(property).join(",")+"],"+index+")"};
forwards.object = function (namespace, properties, index) {
  var arr = [];
  properties.forEach(function (p) { (p.kind === "init") && arr.push(p.key + ":" + p.value) });
  var str = "{"+arr.join(",")+"}";
  properties.forEach(function (p) {
    (p.kind !== "init") && (str = namespace+".__defineProperty__("+str+","+p.key+",{configurable:true,enumerable:true,"+p.kind+":"+p.value+"})");
  });
  return str;
};

traps.array = function (namespace, elements, index) { return namespace+".array(["+elements.join(",")+"],"+index+")" };
forwards.array = function (_, elements, _) { return "["+elements.join(",")+"]" };

traps.regexp = function (namespace, pattern, flags, index) { return namespace+".regexp("+JSON.stringify(pattern)+","+JSON.stringify(flags)+","+index+")" };
forwards.regexp = function (_, pattern, flags, index) { return "/"+pattern+"/"+flags+" " };

/////////////////
// Environment //
/////////////////

traps.Declare = function (namespace, kind, variables, index) { return namespace+".Declare("+JSON.stringify(kind)+","+JSON.stringify(variables)+","+index+");" }

traps.read = function (namespace, variable, index) { return namespace+".read("+JSON.stringify(variable)+",()=>"+variable+","+index+")" };
forwards.read = function (_, variable, _) { return variable };

traps.write = function (namespace, variable, value, index) { return namespace+".write("+JSON.stringify(variable)+","+value+",("+namespace+")=>"+variable+"="+namespace+","+index+")" };
forwards.write = function (_, variable, value, _) { return "("+variable+"="+value+")" };

traps.Enter = function (namespace, index) { return namespace+".Enter("+index+");" };

traps.Leave = function (namespace, index) { return namespace+".Leave("+index+");" };

traps.with = function (namespace, environment, index) { return namespace+".with("+environment+","+index+")" };
forwards.with = function (_, environment, _) { return environment };

///////////
// Apply //
///////////

traps.apply = function (namespace, fct, ths, args, idx) { return namespace+".apply("+fct+","+ths+",["+args.join(",")+"],"+idx+")" };
forwards.apply = function (namespace, fct, ths, args, _) {
  return (ths === "null" || ths === "void 0")
    ? "("+fct+"("+args.join(",")+"))"
    : namespace+".__apply__("+fct+","+ths+",["+args.join(",")+"])"
};

traps.construct = function (namespace, constructor, arguments, index) { return namespace+".construct("+constructor+",["+arguments.join(",")+"],"+index+")" };
forwards.construct = function (_, constructor, arguments, _) { return  "new "+constructor+"("+arguments.join(",")+")" };

traps.Arguments = function (namespace, index) { return namespace+".Arguments(arguments,"+index+");" };

traps.return = function (namespace, value, index) { return namespace+".return("+value+","+index+")" };
forwards.return = function (_, value, _) { return value };

traps.eval = function (namespace, arguments, index) { return "eval("+namespace+".eval(["+arguments.join(",")+"],"+index+"))" };
forwards.eval = function (_, arguments, _) { return "eval("+arguments.join(",")+")" };

traps.unary = function (namespace, operator, value, index) { return namespace+".unary("+JSON.stringify(operator)+","+value+","+index+")" };
forwards.unary = function (_, operator, value, _) { return operator+"("+value+")" };

traps.binary = function (namespace, operator, left, right, index) { return namespace+".binary("+JSON.stringify(operator)+","+left+","+right+","+index+")" };
forwards.binary = function (_, operator, left, right, _) { return "("+left+" "+operator+" "+right+")" };

////////////
// Object //
////////////

traps.get = function (namespace, object, key, index) { return namespace+".get("+object+","+key+","+index+")" };
forwards.get = function (_, object, key, _) { return object+"["+key+"]" };

traps.set = function (namespace, object, key, value, index) { return namespace+".set("+object+","+key+","+value+","+index+")" };
forwards.set = function (_, object, key, value, _) { return "("+object+"["+key+"]"+"="+value+")" };

traps.delete = function (namespace, object, key, index) { return namespace+".delete("+object+","+key+","+index+")" };
forwards.delete = function (_, object, key, _) { return "delete "+object+"["+key+"]" };

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

traps.catch = function (namespace, variable, index) { return namespace+".catch("+variable+","+index+");" };
forwards.catch = function (_, variable, _) { return variable };

traps.Finally = function (namespace, index) { return namespace+".Finally("+index+");" };

traps.sequence = function (namespace, expressions, index) { return namespace+".sequence(["+expressions.join(",")+"],"+index+")" };
forwards.sequence = function (_, expressions, _) { return "("+expressions.join(",")+")" }

traps.expression = function (namespace, value, index) { return namespace+".expression("+value+","+index+")"}
forwards.expression = function (_, value, index) { return value }
