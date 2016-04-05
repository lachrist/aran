
var Glitterdust = require("glitterdust");

function options (mode, targets, out) {
  return {
    mode: mode,
    targets: targets,
    out: out,
    instrument: __dirname+"/main.js",
    masters: __dirname+"/analyses"
  }
}

Glitterdust(options("demo", __dirname+"/../../benchmark/atom", __dirname+"/demo.html"));
Glitterdust(options("batch", __dirname+"/../../benchmark/atom", __dirname+"/batch-atom.html"));
Glitterdust(options("batch", __dirname+"/../../benchmark/sunspider-1.0.2", __dirname+"/batch-sunspider.html"));
