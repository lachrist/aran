
const Points = require("./points.js");
const Names = require("./names.js");
const isArray = Array.isArray;

module.exports = (pointcut) => {
  if (isArray(pointcut)) {
    var make = (k) => Point(pointcut.includes(name), k);
  } else if (typeof pointcut === "function") {
    var make = (k) => (...xs) => Point(pointcut(k, xs[xs.length-1]), k)(...xs);
  } else if (typeof pointcut === "object" && pointcut !== null) {
    var make = (k) => typeof pointcut[k] === "function"
      ? (...xs) => Point(pointcut[k](xs.length-1), k)(...xs)
      : Point(pointcut[k], k);
  } else {
    var make = (k) => Point(false, k);
  }
  const cut = {};
  for (var i=0; i<Names.length; i++)
    cut[Names[i]] = make(Names[i]);
  return cut;
};
