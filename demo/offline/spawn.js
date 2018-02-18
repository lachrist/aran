const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
module.exports = (pointcut, advice) => {
  const aran = Aran({namespace: "META"});
  pointcut = eval(pointcut);
  return (path, script, argv) => {
    const ast1 = Acorn.parse(script);
    const ast2 = aran.join(ast1, pointcut);
    return new Worker(URL.createObjectURL(new Blob([
      "var META = "+advice+";\n"+Astring.generate(ast2)
    ])));
  };
};