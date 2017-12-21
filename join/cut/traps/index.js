
const Fork = require("./fork.js");

const isArray = Array.isArray;
const apply = Reflect.apply;

module.exports = (pointcut) => {
  const make = (
    isArray(key) ?
    (key) => Fork(ArrayLite.elem(pointcut, key), key) :
    (
      typeof pointcut === "function" ?
      (key) => function () { return apply(Fork(pointcut(key, ArrayLite.last(arguments)), key), null, arguments) } :
      (
        typeof pointcut === "object" && pointcut !== null ?
        (key) => (
          typeof pointcut[key] === "function" ? 
          function () { return apply(Fork(pointcut[key](ArrayLite.last(arguments)), key), null, arguments) } :
          Fork(pointcut[key], key)) :
        (key) => Fork(false, key))));
  const cut = {};
  for (var key in Points)
    cut[key] = make(key);
  return cut;
};
