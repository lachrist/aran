var Aran = require("aran");
var fs = require("fs");
var target = fs.readFileSync("../target/monolithic.js", "utf8");
var analysis = fs.readFileSync("./analysis.js", "utf8");
var aran = Aran({namespace:"__hidden__", traps:["apply"]});
fs.writeFileSync("./run.js", analysis + "\n" + aran.instrument(target));