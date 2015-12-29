

var Fs = require("fs");
var Glitterdust = require("glitterdust");

//////////////////////
// Generate main.js //
//////////////////////

var s1 = Fs.readFileSync(__dirname+"/client/main.js", {encoding:"utf8"});
var s2 = Fs.readFileSync(__dirname+"/client/childs.js", {encoding:"utf8"});
var s3 = Fs.readFileSync(__dirname+"/client/fetch.js", {encoding:"utf8"});
var ss = [
  "exports.compile = require('./compile');",
  "exports.client = "+JSON.stringify(s1+s2+s3)+";"
];
Fs.writeFileSync(__dirname+"/main.js", ss.join("\n"), {encoding:"utf8"});

//////////////////////////
// Generate glitterdust //
//////////////////////////

Glitterdust({
  mode: "demo",
  out: __dirname+"/glitterdust/demo.html",
  instrument: __dirname+"/glitterdust/main.js",
  masters: __dirname+"/glitterdust/analyses",
  targets: __dirname+"/../benchmark/atom"
});

Glitterdust({
  mode: "batch",
  out: __dirname+"/glitterdust/batch-atom.html",
  instrument: __dirname+"/glitterdust/main.js",
  masters: __dirname+"/glitterdust/analyses",
  targets: __dirname+"/../benchmark/atom"
});
