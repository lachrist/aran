var Aran = require("../../main.js");
var fs = require("fs");
var target = fs.readFileSync(__dirname+"/../target/monolithic.js", "utf8");
var analysis = fs.readFileSync(__dirname+"/analysis.js", "utf8");
var aran = Aran("_meta_");
fs.writeFileSync("./run.js", analysis+"\n"+aran.instrument(target, ["apply"]));