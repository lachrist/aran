
const ArrayLite = require("array-lite");
const Fork = require("./fork");
const TrapNames = require("./trap-names.js");

const Boolean = global.Boolean
const isArray = Array.isArray;
const apply = Reflect.apply;

module.exports = (pointcut) => {
  const make = (
    isArray(pointcut) ?
    (key) => Fork[Boolean(ArrayLite.includes(pointcut, key))][key] :
    (
      typeof pointcut === "function" ?
      (key) => function () { return apply(
        Fork[Boolean(pointcut(key, arguments[arguments.length-1]))][key],
        null,
        arguments) } :
      (
        typeof pointcut === "object" && pointcut !== null ?
        (key) => (
          typeof pointcut[key] === "function" ? 
          function () { return apply(
            Fork[Boolean(pointcut[key](arguments[arguments.length-1]))][key],
            null,
            arguments) } :
          Fork[Boolean(pointcut[key])][key]) :
        (key) => Fork[Boolean(pointcut)][key])));
  const cut = {};
  ArrayLite.forEach(
    TrapNames,
    (name) => cut[name] = make(name));
  return cut;
};
