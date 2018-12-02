
const Aran = require("./main.js");
const Acorn = require("acorn");
const Astring = require("astring");
const Esvalid = require("esvalid");

global.FOO_BAR = {};
const aran = Aran({namespace:"FOO_BAR"});
global.eval(Astring.generate(aran.setup()));

const code1 = `eval(1,2,3)`; 
const estree1 = Acorn.parse(code1);
const estree2 = aran.weave(estree1, [], null);
console.log("ERRORS", Esvalid.errors(estree2));
console.log(JSON.stringify(estree2, null, 2));
const code2 = Astring.generate(estree2);
console.log("BEGIN CODE\n"+code2+"\nEND CODE");
console.log(global.eval(code2));
