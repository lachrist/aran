const Acorn = require("acorn");
const Aran = require("./lib/main.js");
const Astring = require("astring");
let depth = "";
global.ADVICE = {
  apply: (f, t, xs, serial) => {
    console.log(depth + f.name + "(" + xs.join(", ") + ")");
    depth += ".";
    const x = Reflect.apply(f, t, xs);
    depth = depth.substring(1);
    console.log(depth + x);
    return x;
  }
};
const pointcut = (name, node) =>
  name === "apply" && node.type === "CallExpression";
const aran = Aran({namespace: "ADVICE"});
global.eval(Astring.generate(aran.setup()));
const estree1 = Acorn.parse(`
  const fac = (n) => n ? n * fac(n - 1) : 1;
  fac(6);
`);
const estree2 = aran.weave(estree1, pointcut);
global.eval(Astring.generate(estree2));