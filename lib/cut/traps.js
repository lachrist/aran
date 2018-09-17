
const ArrayLite = require("array-lite");

const modifiers = [
  // Producers //
  "catch",
  "closure",
  "discard",
  "builtin",
  "primitive",
  "read",
  "regexp",
  // Consumers //
  "completion",
  "declare",
  "eval",
  "failure",
  "return",  
  "success",
  "test",
  "throw",
  "with",
  "write",
  // Combiners //
  "array",
  "object",
  // Slacker //
  "begin"
];

const computers = [
  // Combiners //
  "apply",
  "binary",
  "construct",
  "delete",
  "get",
  "invoke",
  "set",
  "unary"
];

const informers = [
  // Producers //
  "arrival",
  "copy",
  // Swappers //
  "swap",
  // Slacker //
  "block",
  "break",
  "drop",
  "end",
  "finally",
  "label",
  "leave",
  "try"
];

const trigger = (name, args) => {
  // TODO how can we get rid of this?
  // We could change unary and binary builder
  // to take an expression as operator rather
  // than a string, but I don't wanna do that. 
  if (name === "binary" || name === "unary")
    args[0] = ARAN.build.primitive(args[0]);
  args[args.length] = ARAN.build.primitive(ARAN.node.AranSerial);
  return ARAN.build.invoke(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive(name),
    ArrayLite.map(
      args,
      (arg) => ));
};

module.exports = (pointcut) => {
  const traps = {};
  ArrayLite.forEach(
    modifiers,
    (name) => {
      traps[name] = (...args) => (
        pointcut(name, ARAN.node) ?
        trigger(name, args) :
        args[args.length-1]);
    });
  ArrayLite.forEach(
    informers,
    (name) => {
      traps[name] = (...args) => (
        pointcut(name, ARAN.node) ?
        trigger(name, args) :
        ARAN.build.primitive(null));
    });
  ArrayLite.forEach(
    computers,
    (name) => {
      traps[name] = (...args) => (
        pointcut(name, ARAN.node) ?
        trigger(name, args) :
        ARAN.build[name](...args));
    });
  // we could modify build to regularize set
  // ARAN.build.set(strict, object, key, value)
  traps.strict_set = (...args) => (
    pointcut("set", ARAN.node) ?
    trigger("set", args) :
    ARAN.build.apply(
      Static.load("Reflect.set"),
      [
        args]));
  const non_strict_set = traps.set;
  return traps;
};
