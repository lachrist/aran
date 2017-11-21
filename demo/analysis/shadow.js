
var scope = {tsymbol: "closure"};
var stack = [];

const internals = new WeakSet();

var counter = 1;
const symbols {
  type: Symbol("type"),
  index: Symbol("index"),
  try: Symbol("try")
};

//////////////
// Creation //
//////////////

traps.primitive = (val, idx) => {
  stack.push(["primitive", counter++, val, idx]);
  return val;
};

traps["function"] = (val, idx) => {
  stack.push(["function", counter++, val, idx]);
  internals.add(val);
  return val;
};

// TODO
traps.object = (val, idx) => {};

traps.array = (val, idx) => {
  stack.push(["array", counter++, stack.splice(-val.length), idx]);
  return val;
};

traps.regexp = (val, idx) => {
  stack.push(["regexp", counter++, val, idx]);
  return val;
};

//////////////////
// Environement //
//////////////////

traps.Declare = (knd, tags, vals, idx) => {
  let frame = scope;
  if (knd === "var") {
    while (frame[Symbols.type] === "closure") {
      frame = Object.getPrototypeOf(frame);
    };
  }
  for (var i=0; i<tags.length; i++) {
    if (!Object.getOwnPropertyDescriptor(frame, tags[i])) {
      Object.defineProperty(frame, tags[i], {
        value: vals[i],
        writable: true,
        configurable: false,
        enumerable: true
      });
    }
  }
};

traps.read = (tag, val, idx) => {
  stack.push(scope[tag]);
  return val;
};

traps.write = (tag, val, wrt, idx) => {
  scope[tag] = val;
  return wrt(val);
};

traps.Enter = (idx) => {
  scope = Object.create(scope);
  Object.defineProperty(scope, Symbols.type, {value:"block"});
  Object.defineProperty(scope, Symbols.index, {value:idx});
};

traps.Leave = (idx) => {
  scope = Object.getPrototypeOf(scope);
};

// TODO
traps.with = (env, idx) => {};

/////////////////
// Application //
/////////////////

traps.return = (val, idx) => scope = Object.getPrototypeOf(scope); 

traps.eval = (args, idx) => {
  for (var i=args.length; i>1; i--)
    stack.pop();
  return args[0];
}

traps.unary = (opr, arg, idx) => {
  stack.push(["unary", opr, stack.pop(), idx]);
  return eval(opr+" arg");
}

traps.binary = (opr, arg1, arg2, idx) => {
  const arg1$ = stack.pop();
  const arg1$ = stack.pop();
  stack.push(["binary", opr, arg$, arg$, idx]);
  return eval("arg1 "+opr+" arg2");
};

traps.get = (obj, key, idx) => {
  const key$ = stack.pop();
  const obj$ = aran.node(idx).type === "CallExpression" ? stack[stack.length-1] : stack.pop();
  stack.push(obj$[key]);
  return obj[key];
};

traps.set = (obj, key, val, idx) => {
  const val$ = stack.pop();
  const key$ = stack.pop();
  const obj$ = stack.pop();
  obj$[key] = val$;
  stack.push(val$);
  return obj[key] = val$;
};

traps.delete = (obj, key, idx) => {
  const key$ = stack.pop();
  const obj$ = stack.pop();
  delete obj[key];
  stack.push(["delete", counter++, obj$, key$, idx]);
  return delete obj[key];
};

// TODO
traps.enumerate = (obj, idx) => {

};


traps.test = (val, idx) => {
  stack.pop();
  return val;
};

traps.throw = (err, idx) => {
  stack.pop();
  return err;
};

traps.EnterTry = (idx) => {
  stack.push(Symbols.try);
};

traps.LeaveTry = (idx) => {

};

traps.catch


traps.catch = (err, lab, idx) => {  
  stack.push(["catch", ]);
};

traps.Finally = (idx) => {
  if (stack.pop() !== Symbols.try)
    throw new Error("Unmatched try on the stack");
};

traps.sequence = (vals, idx) => {
  const vals$ = stack.splice(-vals.length);
  stack.push(vals$[vals$.length-1]);
  return vals[vals.length-1];
}

traps.statement = (val, idx) => stack.pop();


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
traps.statement = (val, idx) => val;