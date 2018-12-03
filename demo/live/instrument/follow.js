
const Acorn = require("acorn");
const Aran = require("aran.js");
const Astring = require("astring");

const advice = {};

[
  "primitive",
  "builtin",
  "read",
  "drop",
  "write",
  "test",
  "throw",
  "closure",
  "return",
  "error",
  "failure",
  "success"
].forEach((name) => {
  advice[name] = (value) => value;
});

[
  "enter",
  "leave",
  "continue",
  "break"
].forEach((name) => {
  advice[name] = () => {};
});

advice.construct = (value, values, serial) => Reflect.construct(value, values);

advice.apply = (value1, value2, values, serial) => Reflect.apply(value1, value2, values);

advice.eval = (value, serial) => {
  const estree1 = Acorn.parse(value, {locations:true});
  const estree2 = aran.weave(estree1, pointcut, serial);
  return Astring.generate(estree2);
};

advice.arrival = (value1, value2, value3, value4, serial) => [value1, value2, value3, value4];

////////////
// Logger //
////////////

const print = (value) => {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "function")
    return "[function "+value.name+"]";
  if (Array.isArray(value))
    return "["+value.map(print)+"]";
  if (value && typeof value === "object")
    return "[object]";
  return String(value);
};

Object.keys(advice).forEach((key) => {
  const original = advice[key];
  if (key === "apply") {
    advice.apply = (value1, value2, values, serial) => {
      console.log(">> apply("+print(value1)+", "+print(value2)+", ["+values.map(print).join(", ")+"])");
      const result = original(value1, value2, values, serial);
      console.log("<< "+print(result));
      return result;
    };
  } else if (key === "construct") {
    advice.construct = (value, values, serial) => {
      console.log(">> apply("+print(value)+", ["+values.map(print).join(", ")+"])");
      const result = original(value, values, serial);
      console.log("<< "+print(result));
      return result;
    };
  } else {
    advice[key] = function () {
      const result = original(...arguments);
      console.log(key+"("+Array.from(arguments).map(print).join(", ")+") = "+print(result));
      return result;
    };
  }
});

////////////
// Return //
////////////

const pointcut = (name, node) => true;

const aran = Aran();
global[aran.namespace] = advice;
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, pointcut, null);
  return Astring.generate(estree2);
};
