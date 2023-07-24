const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const format = "estree";
const aran = Aran({format});
const generate = format === "estree" ? (estree) => Astring.generate(estree) : (script) => script;
const advice = {__proto__:null};
const script1 = `(function() {
  if (true) {
  } else {
    var xyz = 123;
  }
});`;
const estree1 = Acorn.parse(script1); 
const estree2 = aran.weave(estree1, Object.keys(advice));
const script2 = generate(estree2);
console.log(script2);
global[aran.namespace] = advice;
global.eval(generate(aran.setup()));
global.eval(script2);