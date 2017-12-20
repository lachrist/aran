
const TrapKeys = require("./trap-keys.js");
const noop = () => {};
const identity = (val) => val;
const apply = Reflect.apply;
const defineProperty = Reflect.defineProperty;

const traps = {};
module.exports = traps;
TrapKeys.informers.forEach((key) => { traps[key] = noop });
TrapKeys.consumers.forEach((key) => { traps[key] = identity });
TrapKeys.producers.forEach((key) => { traps[key] = identity });
traps.invoke = (obj, key, args) => obj[key](...args);
traps.apply = (fct, args) => fct(...args);
traps.construct = (cst, args) => new cst(...args);
traps.get = (obj, key) => obj[key];
traps.set = (obj, key, val) => obj[key] = val;
traps.binary = (opr, lft, rgt) => eval("lft "+opr+" rgt");
traps.unary = (opr, arg) => eval(opr+" arg");
traps.array = (elms) => elms;
traps.delete = (obj, key) => delete obj[key];
traps.enumerate = (obj) => {
  var keys = [];
  for (var key in obj)
    keys[keys.length] = obj;
  return keys;
};
traps.object = (prps) => {
  var obj = {};
  for (var idx=0; idx<prps.length; idx++) {
    var dsc = {
      configurable: true,
      enumerable: true,
      prps[idx][0]: prps[idx][2]};
    if (prps[idx][0] === "value")
      dsc.writable = true;
    defineProperty(obj, prps[idx][1], dsc);
  }
  return obj;
};