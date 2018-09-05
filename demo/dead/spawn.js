const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
module.exports = (pointcut, advice) => {
  const aran = Aran({
    namespace: "META",
    pointcut: eval(pointcut)
  });
  return (path, script, argv) => {
    const estree = Acorn.parse(script);
    return new Worker(URL.createObjectURL(new Blob([
      "var META = "+advice+";\n",
      Astring.generate(aran.setup())+"\n",
      Astring.generate(aran.weave(estree))
    ])));
  };
};