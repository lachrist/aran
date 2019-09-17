const Acorn = require("acorn");
const Aran = require("aran");

const aran = Aran({format:"script"});
const advice = {};
const pointcut = ["closure", "eval"];
const counters = new Map();
global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script, path) => {
  const estree = Acorn.parse(script, {locations:true, sourceFile:path});
  const x = aran.weave(estree, pointcut);
  console.log("WESH", path, x);
  return x;
};

advice.closure = (inner, serial) => {
  const {loc:{source, start:{line,column}}, id} = aran.nodes[serial];
  const location = source + "@" + line + ":" + column;
  const key = location + "[" + (id ? id.name : "anonymous") + "]";
  return function callee () {
    "use strict";
    counters.set(key, (counters.get(key) || 0) + 1);
    if (new.target)
      return Reflect.construct(inner, arguments, new.target);
    return Reflect.apply(inner, this, arguments);
  };
};

advice.eval = (value, serial) => {
  const estree = Acorn.parse(value, {locations:true});
  return aran.weave(estree, pointcut, serial);
};

setTimeout(() => {
  let prefix = null;
  let keys = [];
  for (const key of counters.keys()) {
    keys.push(key);
    if (!prefix)
      prefix = key;
    let index = 0;
    while (index < prefix.length && prefix[index] === key[index])
      index++;
    prefix = prefix.substring(0, index);
  }
  keys = keys.sort((key1, key2) => {
    if (counters.get(key1) > counters.get(key2))
      return -1;
    if (counters.get(key1) < counters.get(key2))
      return 1;
    return 0;
  });
  for (let key of keys) {
    console.log(key.substring(prefix.length), "\t", counters.get(key));
  }
}, 1000);
