
const Acorn = require("acorn");
const Aran = require("aran");

const aran = Aran({format:"script"});
const advice = {};
const pointcut = (name, node) => true;
const print = (value) => {
  if (typeof value === "function")
    return "[function]";
  if (typeof value === "object" && value !== null)
    return Object.prototype.toString.call(value);
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};
const before = (name, strings, serial) => {
  const line = aran.nodes[serial].loc.start.line;
  console.log(name+"("+strings.join(", ")+") @"+line);
};
const after = (name, value, serial) => {
  const line = aran.nodes[serial].loc.start.line;
  console.log(name+" << "+print(value)+" @"+line);
  return value
};

global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script) => {
  const estree = Acorn.parse(script, {locations:true});
  return aran.weave(estree, pointcut, null);
};

// Informers //
["program", "leave", "continue", "break", "debugger"].forEach((key) => {
  advice[key] = (...array) => {
    const serial = array.pop();
    before(key, array.map(print), serial);
  };
});
advice.enter = (tag, labels, identifiers, serial) => {
  before("enter", [
    print(tag),
    "["+labels.map(print)+"]",
    "["+identifiers.map(print)+"]"
  ], serial);
};
advice.arrival = (value1, value2, value3, value4, serial) => {
  before("arrival", [
    print(value1),
    print(value2),
    print(value3),
    value4 ? "["+Array.from(value4).map(print)+"]" : print(value4)
  ], serial);
};

// Transformers //
[ "error",
  "abrupt",
  "throw",
  "return",
  "closure",
  "primordial",
  "primitive",
  "read",
  "argument",
  "drop",
  "test",
  "write",
  "success",
  "failure"
].forEach((key) => {
  advice[key] = (...array) => {
    const serial = array.pop();
    before(key, [array.map(print)], serial);
    return array[0];
  };
});
advice.eval = (value, serial) => {
  before("eval", [print(value)], serial);
  const estree = Acorn.parse(value, {locations:true});
  return aran.weave(estree, pointcut, serial);
};

// Combiners //
["unary", "binary"].forEach((key) => {
  advice[key] = (...array) => {
    const serial = array.pop();
    before(key, array.map(print), serial);
    return after(key, aran[key](...array), serial);
  };
});
advice.apply = (value1, value2, values, serial) => {
  before("apply", [
    print(value1),
    print(value2),
    "["+values.map(print)+"]"
  ], serial);
  return after("apply", Reflect.apply(value1, value2, values), serial);
};
advice.construct = (value, values, serial) => {
  before("construct", [
    print(value),
    "["+values.map(print)+"]"
  ], serial);
  return after("construct", Reflect.construct(value, values), serial);
};
