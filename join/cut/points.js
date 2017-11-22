
const Protect = require("../protect.js");
const stringify = JSON.stringify;
const identity = (x) => x;
const empty = () => [];

module.exports = {};

/////////////
// Helpers //
/////////////

const trap = (nme, args, idx) => {
  args.push(Build.primitive(idx));
  return Build.call(
    Build.member(
      Build.identifier(ARAN_NAMESPACE),
      name),
    args);
};

const make = (trp, fwd, cut) => ({trap:trp, forward:fwd, cut:cut});

//////////////
// Creation //
//////////////

module.exports.primitive = make(
  "primitive",
  Build.primitive,
  (prm, idx) => trap(
    "primitive",
    [Build.primitive(prm)],
    idx));

module.exports.function = make(
  "function",
  Build.function,
  (nme, prms, stms, idx) => trap(
    "function",
    [Build.function(nme, prms, stms)],
    idx));

module.exports.arrow = make(
  "arrow",
  Build.arrow,
  (prms, stms, idx) => trap(
    "arrow",
    [Build.arrow(prms, stms)],
    idx));

// TODO
names.object = "object";
module.exports1.object = (prps, idx) => trap("object", [Build.array(prps)]ARAN_NAMESPACE+".object("+prps+","+idx+")";
module.exports2.object = (prps)      => {
  if (prps.every(prp) => prp.kind === "init")
    return "{" + ast.properties.map((prp) => "["+prp.key+"]:"+prp.value).join(",") + "}";
  return ast.properties.reduce((prp, str) => Protect.load("defineProperty") + "(" + str + "," + prp.key + ", {configurable:true,enumerable:true,writable:true,"+prp.kind+":"+prp.value+"})"
  }, "{}");
};

module.exports.array = make(
  "array",
  Build.array,
  (elms, idx) => trap(
    "array", 
    Build.array(elms)],
    idx));

module.exports.regexp = make(
  "regexp",
  Build.regexp,
  (ptn, flg, idx) => trap(
    "regexp",
    [Build.regexp(ptn, flg)],
    idx));

/////////////////
// Environment //
/////////////////

module.exports.global = make(
  "global",
  () => Build.identifier(Protect.load("global")),
  (idx) => trap("global", [], idx));

module.exports.Declare = make(
  "declare";
  (knd, tag, val) => [Build.Declare(knd, tag, val)],
  (knd, tag, val, idx) => [Build.Declare(
    knd,
    tag,
    trap(
      "declare",
      [
        Build.primitive(knd),
        Build.primitive(tag),
        val],
      idx))];

module.exports.read = make(
  "read",
  Build.identifier,
  (tag, idx) => trap(
    "read",
    [
      Build.primitive(tag),
      Build.this()],
    idx));

module.exports.readT = make(
  "read",
  Build.this,
  (idx) => trap(
    "read",
    [
      Build.primitive("this"),
      Build.this()],
    idx));

module.exports.write = make(
  "write",
  Build.write,
  (tag, val, idx) => Build.write(
    tag,
    trap(
      "write",
      [
        Build.primitive(tag),
        val],
      idx)));

// TODO
names.discard = "discard";
module.exports1.discard = (tag, idx) => trap("discard", []) ARAN_NAMESPACE+".discard("+stringify(tag)+",()=>delete "+tag+","+idx+")";
module.exports2.discard = (tag)      => Build.unary("delete", Build.identifier(tag));

module.exports.Enter = make(
  "Enter",
  empty,
  (knd, idx) => [Build.Statement(trap(
    "Enter",
    [Build.primitive(knd)],
    idx))]);

module.exports.Leave = make(
  "Leave",
  empty,
  (knd, idx) => [Build.Statement(trap(
    "Leave",
    [Build.primitive(knd)],
    idx))]);

module.exports.With = make(
  "with",
  (env, bdy) => [Build.With(env, bdy)],
  (env, bdy, idx) => [Build.With(
    trap("with", [env], idx),
    bdy)]);

///////////
// Apply //
///////////

module.exports.apply = make(
  "apply",
  Build.apply,
  (fct, ths, args, idx) => trap(
    "apply",
    [
      fct,
      ths
      Build.array(args)],
    idx));

module.exports.construct = make(
  "construct",
  Build.construct,
  (cst, args, idx) => trap(
    "construct",
    [
      cst,
      Build.array(args)],
    idx));

module.exports.Program = make(
  "Program",
  empty,
  (stc, idx) => [Build.Statement(trap(
    "Program",
    [Build.primitive(stc)],
    idx))]);

module.exports.Closure = make(
  "Closure",
  empty,
  (stc, arw, tag, idx) => [Build.Statement(trap(
    "Closure",
    [
      Build.primitive(stc),
      arw?
        Build.primitive(null):
        Build.this(),
      Build.identifier(tag)],
    idx))]);

module.exports.Return = make(
  "return",
  (res) => [Build.Return(res)],
  (res, idx) => [Build.Return(trap("return", [res], idx))]);

module.exports.eval = make(
  "eval",
  Build.eval,
  (arg, idx) => Build.eval(trap("eval", [arg], idx));

module.exports.unary = make(
  "unary",
  Build.unary,
  (opr, arg, idx) => trap(
    "unary",
    [
      Build.primitive(opr),
      arg],
    idx));

module.exports.binary = make(
  "binary",
  Build.binary,
  (opr, arg1, arg2, idx) => trap(
    "binary",
    [
      Build.primitive(opr),
      arg1,
      arg2],
    idx));

////////////
// Object //
////////////

module.exports.get = make(
  "get",
  Build.get,
  (obj, key, idx) => trap(
    "get",
    [obj, key],
    idx));

module.exports.set = make(
  "set",
  Build.set,
  (obj, key, val, idx) => trap(
    "set",
    [obj, key, val],
    idx));

module.exports.delete = make(
  "delete",
  Build.delete,
  (obj, key, idx) => trap(
    "delete",
    [obj, key],
    idx));

module.exports.enumerate = make(
  "enumerate",
  (obj) => Build.apply(
    Protect.load("enumerate"),
    [obj]),
  (obj, idx) => trap(
    "enumerate",
    [obj],
    idx));

/////////////
// Control //
/////////////

module.exports.test = make(
  "test",
  identity,
  (val, idx) => trap("test", [val], idx));

module.exports.Label = make(
  "label",
  (lab, bdy) => [Build.Label(lab, bdy)],
  (lab, bdy, idx) => [Build.Statement(trap("Label", ))]
  module.exports)

names.Label = "Label";
module.exports1.Label = (lab, idx) => [Build.Statement(trap("Label", [Build.primitive(lab)], idx))];
module.exports2.Label = empty;

names.Continue = "Continue";
module.exports1.Continue = (lab, idx) => [Build.Statement(trap("Continue", [Build.primitive(lab)], idx))];
module.exports2.Continue = empty;

names.Break = "Break";
module.exports1.Break = (lab, idx) => [Build.Statement(trap("Continue", [Build.primitive(lab)], idx))];
module.exports2.Break = empty;

names.Throw = "throw";
module.exports1.Throw = (err, idx) => [Build.Throw(trap("throw", [err], idx))];
module.exports2.Throw = Build.Throw;

names.Catch = "catch";
module.exports1.Catch = (tag, idx) => [Build.Statement(
  Build.assignment(
    tag,
    trap(
      "catch",
      [Build.identifier(tag)],
      idx)))];
module.exports2.Catch = empty;

///////////
// Stack //
///////////

names.copyA = "copy";
module.exports1.copyA = (val, idx) => Build.get(
  Build.array([
    val,
    trap("copy", [], idx)]),
  Build.primitive(0));
module.exports1.copyA = identity;

names.copyB = "copy";
module.exports1.copyB = (val, idx) => Build.sequence([
  trap("copy", [], idx),
  val]);
module.exports1.copyB = identity;

names.Copy = "copy";
module.exports1.Copy = (idx) => [Build.Statement(
  trap("copy", [], idx))];
module.exports2.Copy = empty;

names.dropA = "drop";
module.exports1.dropA = (val, idx) => Build.get(
  Build.array([
    val,
    trap("drop", [], idx)]),
  Build.primitive(0));
module.exports1.dropA = identity;

names.dropB = "drop";
module.exports1.dropB = (val, idx) => Build.sequence([
  trap("drop", [], idx),
  val]);
module.exports1.dropB = identity;

names.Drop = "drop";
module.exports1.Drop = (idx) => [Build.Statement(
  trap("drop", [], idx))];
module.exports2.Drop = empty;



names.swapA = "swap";
module.exports1.swapA = (val, pos1, pos2, idx) => Build.get(
  Build.array([
    val,
    trap("swap", [pos1, pos2], idx)]),
  Build.primitive(0));
module.exports1.swapA = identity;

names.swapB = "swap";
module.exports1.swapB = (val, pos1, pos2, idx) => Build.sequence([
  trap("swap", [pos1, pos2], idx),
  val]);
module.exports1.swapB = identity;

names.Swap = "swap";
module.exports1.Swap = (idx) => [Build.Statement(
  trap("swap", [], idx))];
module.exports2.Swap = empty;
