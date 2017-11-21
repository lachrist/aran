
const bindings = {
  apply: "Reflect.apply",
  iterator: "Symbol.iterator",
  defineProperty: "Object.defineProperty",
  eval: "eval",
  global: "typeof window!=='undefined'?window:(typeof global!=='undefined'?global:(function(){return this}()));"
};

const save = (name) => "if (typeof "+NAMESPACE+"_"+name+" === 'undefined') var "+NAMESPACE+"_"+name+" = "+bindings[name]+";";

exports.save = () => Object.keys(bindings).map(save).join("")

exports.load = (name) => NAMESPACE+"_"+name;
