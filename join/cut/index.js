
const Points = require("./points.js");
const isArray = Array.isArray;

module.exports = (pointcut) => {
  const make = isArray(pointcut) ?
    ((p) => pointcut.includes(p.trap) ?
      p.cut :
      p.forward) :
    (typeof pointcut === "function" ?
      ((p) =>
        (...xs) => pointcut(p.trap, xs[xs.length-1]) ? p.cut(...xs) : p.forward(...xs)) :
      ((typeof pointcut === "object" && pointcut !== null) ?
        ((p) => typeof pointcut[p.trap] === "function" ? 
          (...xs) => pointcut[p.trap](xs.length-1) ? p.cut(...xs) : p.forward(...xs) :
          (pointcut[p.trap] ? p.cut : p.forward))
        ((p) => p.forward)
  const cut = {};
  for (var k in Points)
    cut[k] = make(Points[k]);
  return cut;
};
