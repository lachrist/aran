
var Fs = require("fs");
var Glitterdust = require("glitterdust");

//////////////////////
// Generate main.js //
//////////////////////

Fs.writeFileSync(__dirname+"/main.js", [
  "var Instrument = require('./instrument.js');"
  "var setup = "+JSON.stringify(Fs.readFileSync(__dirname+"/setup.js"))+";",
  "module.exports = function (options, code) {",
  "  if (options.nosetup)",
  "    return Instrument(options, code);",
  "  return setup.replace('ARAN', function () { return options.global || 'aran' }) + Instrument(options, code);",
  "};"
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
