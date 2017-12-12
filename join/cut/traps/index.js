
const Intercepters = require("./intercepters.js");
const Combiners = require("./combiners.js");
const Informers = require("./informers.js");

const isArray = Array.isArray;

const points = Object.assign({}, Intercepters, Combiners, Informers);

const fork = (boolean, key) => boolean ?
  points[key].cut :
  points[key].forward;

module.exports = (pointcut) => {
  const make = isArray(key) ?
    (key) => fork(pointcut.includes(key), key) :
    (typeof pointcut === "function" ?
      (key) => (...rest) => fork(pointcut(key, rest[rest.length-1]), key)(...rest) :
      (typeof pointcut === "object" && pointcut !== null ?
        (key) => typeof pointcut[key] === "function" ? 
          (...rest) => fork(pointcut[key](rest.length-1), key)(...rest) :
          fork(pointcut[key], key) :
        (key) => fork(false, key)));
  const cut = {};
  for (var key in Points)
    cut[key] = make(key);
  return cut;
};
