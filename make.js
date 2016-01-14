
var Fs = require("fs");
var Glitterdust = require("glitterdust");
var Uglify = require("uglify-js");

//////////////////////
// Generate main.js //
//////////////////////

//var setup = Uglify.minify(__dirname+"/setup.js").code;
var setup = Fs.readFileSync(__dirname+"/setup.js", {encoding:"utf8"});

Fs.writeFileSync(__dirname+"/main.js", [
  "var Instrument = require('./instrument.js');",
  "var setup = "+JSON.stringify(setup)+";",
  "module.exports = function (options, code) { return (options.nosetup ? '' : setup.replace('ARAN', function () { return options.global || 'aran'})) + Instrument(options, code) };"
].join("\n"), {encoding:"utf8"});

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

Glitterdust({
  mode: "batch",
  out: __dirname+"/glitterdust/batch-sunspider.html",
  instrument: __dirname+"/glitterdust/main.js",
  masters: __dirname+"/glitterdust/analyses",
  targets: __dirname+"/../benchmark/sunspider-1.0.2"
});
