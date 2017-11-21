
const Protect = require("../protect.js");
const Hide = require("../hide.js");
const stringify = JSON.stringify;

module.exports = (iscut, name) => (iscut ? points1 : points2)[name];

const points1 = {};
const points2 = {};

const identity = (x) => x; 

const empty = () => [];

const trap = (nme, args, idx) => {
  args.push(Build.primitive(idx));
  return Build.call(
    Build.member(
      Build.identifier(ARAN_NAMESPACE),
      name),
    args);
};

//////////////
// Creation //
//////////////

points1.primitive = (prm, idx) => trap("primitive", [Build.primitive(prm)], idx);
points2.primitive = Build.primitive;

points1["function"] = (nme, prms, rst, stms, idx) => trap("primitive", [Build.function(nme, prms, rst, stms)], idx);
points2["function"] = Build.function;

points1.arrow = (prms, rst, stms, idx) => trap("arrow", [Build.arrow(prms, rst, stms)], idx);
points2.arrow = Build.arrow;

// TODO
points1.object = (prps, idx) => trap("object", [Build.array(prps)]ARAN_NAMESPACE+".object("+prps+","+idx+")";
points2.object = (prps)      => {
  if (prps.every(prp) => prp.kind === "init")
    return "{" + ast.properties.map((prp) => "["+prp.key+"]:"+prp.value).join(",") + "}";
  return ast.properties.reduce((prp, str) => Protect.load("defineProperty") + "(" + str + "," + prp.key + ", {configurable:true,enumerable:true,writable:true,"+prp.kind+":"+prp.value+"})"
  }, "{}");
};

points1.array = (elms, idx) => trap("array", [Build.array(elms)], idx);
points2.array = Build.array;

points1.regexp = (ptn, flg, idx) => trap("regexp", [Build.regexp(ptn, flg)], idx);
points2.regexp = Build.regexp;

/////////////////
// Environment //
/////////////////

points1.global = (idx) => trap("global", [], idx);
points2.global = () => Build.identifier(Protect.load("global"));

points1.Declare = (knd, tag, val, idx) => Build.declaration(knd, tag, trap("declare", [Build.primitive(knd), Build.primitive(tag), val], idx);
points2.Declare = Build.declaration;

points1.read = (tag, idx) => trap("read", [Build.primitive(tag), Build.this()], idx);
points2.read = (tag)      => Build.identifier(tag);

points1.readT = (idx) => trap("read", [Build.primitive("this"), Build.this()], idx);
points2.readT = () => Build.this();

points1.write = (tag, val, idx) => Build.assignment(tag, trap("write", [Build.primitive(tag), val], idx);
points2.write = Build.assignment;

// TODO
points1.discard = (tag, idx) => trap("discard", []) ARAN_NAMESPACE+".discard("+stringify(tag)+",()=>delete "+tag+","+idx+")";
points2.discard = (tag)      => Build.unary("delete", Build.identifier(tag));

points1.Enter = (idx) => [Build.Statement(trap("Enter", [], idx))];
points2.Enter = empty;

points1.Leave = (idx) => [Build.Statement(trap("Leave", [], idx))];
points2.Leave = empty;

points1.with = (env, idx) => trap("with", [env], idx);
points2.with = (env)      => env;

///////////
// Apply //
///////////

points1.apply = (fct, ths, args, idx) => ARAN_NAMESPACE+".apply("+fct+","+ths+",["+args.join(",")+"],"+idx+")";
points2.apply = (fct, ths, args)      => Protect.load("apply")+"("+fct+","+ths+",["+args.join(",")+"])";

points1.construct = (cst, args, idx) => ARAN_NAMESPACE+".construct("+cst+",["+args.join(",")+"],"+idx+")";
points2.construct = (cst, args)      => "new "+cst+"("+args.join(",")+")";

points1.Program = (idx, stc) => ARAN_NAMESPACE+".Program("+stc+","+idx+");"
points2.Program = () => "";

points1.Closure = (stc, arw, idx) => ARAN_NAMESPACE+".Closure("+stc+","+(arw?"null":"this")+",arguments,"+idx+")";
points2.Closure = (stc, arw, idx) => "";

points1.return = (res, idx) => ARAN_NAMESPACE+".return("+res+","+idx+")";
points2.return = (res)      => res;

points1.eval = (arg, idx) => "eval("+ARAN_NAMESPACE+".eval("+arg+","+idx+"))";
points2.eval = (arg)      => "eval("+arg+")";

points1.unary = (opr, arg, idx) => ARAN_NAMESPACE+".unary("+stringify(opr)+","+arg+","+idx+")";
points2.unary = (opr, arg)      => "("+opr+" "+arg+")";

points1.binary = (opr, arg1, arg2, idx) => ARAN_NAMESPACE+".binary("+stringify(opr)+","+arg1+","+arg2+","+idx+")";
points2.binary = (opr, arg1, arg2)      => "("+arg1+" "+opr+" "+arg2+")";

////////////
// Object //
////////////

points1.get = (obj, key, idx) => ARAN_NAMESPACE+".get("+obj+","+key+","+idx+")";
points2.get = (obj, key)      => obj+"["+key+"]";

points1.set = (obj, key, val, idx) => ARAN_NAMESPACE+".set("+obj+","+key+","+val+","+idx+")";
points2.set = (obj, key, val)      => "("+obj+"["+key+"]"+"="+val+")";

points1.delete = (obj, key, idx) => ARAN_NAMESPACE+".delete("+obj+","+key+","+idx+")";
points2.delete = (obj, key)      => "delete "+obj+"["+key+"]";

points1.enumerate = (obj, idx) => ARAN_NAMESPACE+".enumerate("+obj+","+idx+")";
points2.enumerate = (obj)      => "(function(o){var ks=[];for(var k in o) ks[ks.length]=k;return ks;}("+obj+"))";

/////////////
// Control //
/////////////

points1.test = (val, idx) => ARAN_NAMESPACE+".test("+val+","+idx+")";
points2.test = (val)      => val;

points1.Label = (lab, idx) => ARAN_NAMESPACE+".Label("+stringify(lab)+","+idx+");";
points2.Label = ()         => "";

points1.Continue = (lab, idx) => ARAN_NAMESPACE+".Continue("+stringify(lab)+","+idx+");";
points2.Continue = ()         => "";

points1.Break = (lab, idx) => ARAN_NAMESPACE+".Break("+stringify(lab)+","+idx+");";
points2.Break = ()         => "";

points1.throw = (err, idx) => ARAN_NAMESPACE+".throw("+err+","+idx+")";
points2.throw = (err)      => err;

points1.Try = (idx) => ARAN_NAMESPACE+".Try("+idx+");";
points2.Try = ()    => "";

points1.catch = (tag, idx) => ARAN_NAMESPACE+".catch("+tag+","+idx+");";
points2.catch = (tag)      => tag;

points1.Finally = (idx) => ARAN_NAMESPACE+".Finally("+idx+");";
points2.Finally = ()    => "";

///////////
// Stack //
///////////

const make = (name) => {
  points1[name+"A"] = (val, ...args) => "(["+val+","+ARAN_NAMESPACE+"."+name+"("+args.join(",")+")][0])"; 
  points2[name+"A"] = (val) => val;
  points1[name+"B"] = (val, ...args) => "("+ARAN_NAMESPACE+"."+name+"("+args.join(",")+"),"+val+")"; 
  points2[name+"B"] = (val) => val;
  points1[name[0].toUpperCase+name.substring(1)] = (...args) => ARAN_NAMESPACE+"."+name+"("+args.join(",")+");";
  points1[name[0].toUpperCase+name.substring(1)] = () => "";
};

make("copy");
make("drop");
make("swap");
