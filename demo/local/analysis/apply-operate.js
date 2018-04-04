const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
global.META = {};
const print = (value) => {
  if (Array.isArray(value))
    return "#array";
  if (value && typeof value === "object")
    return "#object";
  if (typeof value === "function")
    return "#function";
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};
const location = (serial) => {
  const loc = aran.node(serial).loc;
  return "@"+loc.start.line + ":"+loc.start.column;
};
META.apply = (callee, value, values, serial) => {
  console.log(callee.name+"("+values.map(print).join(", ")+") "+location(serial));
  const result = Reflect.apply(callee, value, values);
  console.log(print(result)+" = "+callee.name+"("+values.map(print).join(", ")+") "+location(serial));
  return result;
};
META.binary = (operator, value1, value2, serial) => {
  const result = eval("value1 "+operator+" value2");
  console.log(print(result)+" = "+print(value1)+" "+operator+" "+print(value2)+" "+location(serial));
  return result;
};
META.unary = (operator, value, serial) => {
  const result = eval(operator+" "+print(value));
  console.log(print(result)+" = "+operator+print(value)+" "+location(serial));
  return result;
};
const aran = Aran({namespace:"META"});
const pointcut = ["apply", "binary", "unary"];
global.eval(Astring.generate(aran.setup(pointcut)));
module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, pointcut);
  global.eval(Astring.generate(estree2));
};