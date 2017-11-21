var traps = {};
module.exports = traps;
// General //
traps.Program = (idx) => { };
traps.Strict = (idx) => { };
// Creation //
traps.primitive = (val, idx) => val;
traps["function"] = (val, idx) => val;
traps.object = (val, idx) => val;
traps.array = (val, idx) => val;
traps.regexp = (val, idx) => val;
// Environment //
traps.Declare = (knd, tags, idx) => { };
traps.read = (tag, val, idx) => val;
traps.write = (tag, old, val, wrt, idx) => wrt(val);
traps.Enter = (idx) => { };
traps.Leave = (idx) => { };
traps.with = (env, idx) => env;
// Apply //
traps.apply = (fct, ths, args, idx) => Reflect.apply(fct, ths, args);
traps.construct = (cst, args, idx) => Reflect.construct(cst, args);
traps.Arguments = (args, idx) => { };
traps.return = (res, idx) => res;
traps.eval = (args, idx) => args[0];
traps.unary = (opr, arg, idx) => eval(opr+" arg");
traps.binary = (opr, arg1, arg2, idx) => eval("arg1 "+opr+" arg2");
// Object //
traps.get = (obj, key, idx) => obj[key];
traps.set = (obj, key, val, idx) => obj[key] = val;
traps.delete = (obj, key, idx) => delete obj[key];
traps.enumerate = (obj, idx) => {
  var keys = [];
  for (var key in obj)
    keys.push(key);
  return keys;
};
// Control //
traps.test = (val, idx) => val;
traps.Label = (lab, idx) => { };
traps.Break = (lab, idx) => { };
traps.throw = (err, idx) => err;
traps.Try = (idx) => { };
traps.catch = (err, idx) => err;
traps.Finally = (idx) => { };
traps.sequence = (vals, idx) => vals[vals.length-1];
traps.expression = (val, idx) => val;