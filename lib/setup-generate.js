
const Acorn = require("acorn");
const Fs = require("fs");

const estree = Acorn.parse(Fs.readFileSync(__dirname+"/setup-pattern.js", "utf8"));

const loop = (node) => {
  if (node && typeof node === "object") {
    for (let key in node) {
      if (key === "start" || key === "end") {
        delete node[key];
      } else {
        loop(node[key]);
      }
    }
  }
}

loop(estree);

Fs.writeFileSync(__dirname+"/setup-estree.js", "module.exports = " +JSON.stringify(estree, null, 2), "utf8");
