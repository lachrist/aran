const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
global.META = {
  apply: (closure, strict, values, serial) => {
    console.log(closure.name+"@"+serial);
    const context = strict ? undefined : global
    return Reflect.apply(closure, context, values);
  }
};
const aran = Aran({namespace:"META", output:"EstreeValid"});
Astring.generate(aran.setup());
eval(Astring.generate(aran.join(Acorn.parse([
  "function HelloWorld () {}",
  "HelloWorld();"
].join("\n")), ["apply"])));