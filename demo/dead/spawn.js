const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
module.exports = (pointcut, advice) => {
  const aran = Aran({
    namespace: "META",
    pointcut: JSON.parse(pointcut)
  });
  return (path, script, argv) => {
    const estree = Acorn.parse(script);
    return new Worker(URL.createObjectURL(new Blob([
      "console.log = function () { \n",
      "  postMessage(Array.from(arguments).map(String).join(' ')+'\\n');\n",
      "};\n",
      "var META = "+advice+";\n",
      "{\n"+Astring.generate(aran.setup(pointcut))+"\n}\n",
      "{\n"+Astring.generate(aran.weave(estree))+"\n}"
    ])));
  };
};