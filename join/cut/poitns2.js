
const Protect = require("../protect.js");
const stringify = JSON.stringify;
const identity = (x) => x;
const empty = () => [];

module.exports = {};

/////////////
// Helpers //
/////////////

const transformers = {};

const trap = (key, args) => {
  args.push(Build.primitive(ARAN_CURRENT));
  return Build.call(
    Build.member(
      Build.identifier(ARAN_NAMESPACE),
      name),
    args.map((arg, idx) => transformers[key+idx] ?
      transformers[key+idx](arg) :
      arg));
};

const produce = (key) => ({
  trap: key
  cut: (arg0, arg1, arg2) => trap(
    key,
    [Build[key](arg0, arg1, arg2)]) });

// const consume = (key) => ({
//   forward: identity,
//   cut: (arg) => trap(key, [arg]) });

const operate = (key) => ({
  forward: Build[key],
  cut: (...args) => trap(key, args) });

const inform = (key) => ({
  forward: empty,
  cut: (...args) => [Build.Statement(trap(key, args))] });

const after = (key) => ({
  forward: identity,
  cut: (val, ...args) => Build.get(
    Build.array([
      val,
      trap(key, args)]),
    Build.primitive(0))
});

const before = (key) => ({
  forward: identity,
  cut: (val, ...args) => Build.sequence([
    val,
    trap(key, args)]) });

//////////////
// Creation //
//////////////

module.exports.primitive = produce("primitive");

module.exports.function = produce("function");

module.exports.arrow = {
  forward: (prms, stms) => Build.function(null, prms, stms),
  cut: (prms, stms) => trap(
    "arrow",
    [Build.function(null, prms, stms)])
};

// TODO figure out the object trap once and for all
module.exports.object = {
  forward: Build.object,
  cut: (prps) => trap(
    "object",
    Build.array(prps.map((prp) => Build.array([
      Build.primitive(prp[0]),
      prp[1],
      prp[2]]))))
}

module.exports.array = produce("array");

module.exports.regexp = produce("regexp");

/////////////////
// Environment //
/////////////////

module.exports.global = produce("global");

transformers.declare0 = Build.primitive;
transformers.declare1 = Build.primitive;
module.exports.declare = consume("declare");

transformers.write0 = Build.primitive;
transformers.write1 = Build.primitive;
module.exports.write = consume("write");

transformers.read0 = Build.primitive;
transformers.read1 = Build.read;
module.exports.read = operate("read");


module.exports.write = {
  trap: "write",
  forward: Build.write,
  cut: (tag, val) => Build.write(
    tag,
    trap(
      "write",
      [
        Build.primitive(tag),
        val],
      idx))
};

// TODO
names.discard = "discard";
module.exports1.discard = (tag, idx) => trap("discard", []) ARAN_NAMESPACE+".discard("+stringify(tag)+",()=>delete "+tag+","+idx+")";
module.exports2.discard = (tag)      => Build.unary("delete", Build.identifier(tag));

transformers.Enter0 = Build.primitive;
module.exports.Enter = information("Enter");

transformers.Leave0 = Build.primitive;
module.exports.Leave = information("Leave");

module.exports.with = consume("with");

///////////
// Apply //
///////////

transformers.push("apply2", Build.array);
module.exports.apply = operate("apply");

transformers.push("construct1", Build.array);
module.exports.construct = operate("construct");

transformers.push("Closure0", Build.primitive);
module.exports.Closure = information("Strict");

transformers.push("Program0", Build.primitive);
module.exports.Program = information()

module.exports.this = produce("this");

module.exports.arguments = produce("arguments");

module.exports.return = consume("return");

module.exports.eval = consume("eval");

transformers.unary0 = Build.primitive;
module.exports.unary = operate("unary");

transformers.binary0 = Build.primitive;
module.exports.binary = operate("binary");

////////////
// Object //
////////////

module.exports.get = operate("get");

module.exports.set = operate("set");

module.exports.delete = operate("delete");

module.exports.enumerate = operate("enumerate");

/////////////
// Control //
/////////////

module.exports.test = consume("test");

transformers.Label0 = Build.primitive;
module.exports.Label = information("Label");

transformers.Continue0 = Build.primitive;
module.exports.Continue = information("Continue");

transformers.Break0 = Build.primitive;
module.exports.Break = information("Break");

module.exports.throw = consume("throw");

module.exports.catch = produce("catch");

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
