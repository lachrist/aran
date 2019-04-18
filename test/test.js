const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const aran = Aran({format:"estree"});

const advice = {
  __proto__: null,
  debugger: (serial) => {
    console.log("DEGU", serial);
  },
  failure: (error, serial) => {
    console.log("failure", error, serial);
    throw error;
  }
};
const script1 = `debugger;`;
const estree1 = Acorn.parse(script1); 
const estree2 = aran.weave(estree1, Object.keys(advice));
const script2 = Astring.generate(estree2);
console.log(script2);
global[aran.namespace] = advice;
global.eval(Astring.generate(aran.setup()));
global.eval(script2);