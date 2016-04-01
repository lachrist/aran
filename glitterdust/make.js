
var Glitterdust = require("glitterdust");

Glitterdust({
  mode: "demo",
  out: __dirname+"/demo.html",
  instrument: __dirname+"/main.js",
  masters: __dirname+"/../analyses",
  targets: __dirname+"/../../benchmark/atom"
});

Glitterdust({
  mode: "batch",
  out: __dirname+"/batch-atom.html",
  instrument: __dirname+"/main.js",
  masters: __dirname+"/../analyses",
  targets: __dirname+"/../../benchmark/atom"
});

Glitterdust({
  mode: "batch",
  out: __dirname+"/linvail-atom.html",
  instrument: __dirname+"/main.js",
  masters: __dirname+"/../../linvail/analyses/bundles",
  targets: __dirname+"/../../benchmark/atom"
});

Glitterdust({
  mode: "batch",
  out: __dirname+"/batch-sunspider.html",
  instrument: __dirname+"/main.js",
  masters: __dirname+"/../analyses",
  targets: __dirname+"/../../benchmark/sunspider-1.0.2"
});
