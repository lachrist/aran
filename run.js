
var Minimist = require("minimist");
var Otiluke = require("otiluke");
var Node = require("./node.js");
var Mitm = require("./mitm.js");

var argv = Minimist(process.argv.slice(2))

if ("help" in argv) {
  console.log("aran --node --analysis /path/to/analysis.js --main /path/to/main.js");
  console.log("aran --mitm --analysis /path/to/analysis.js --port 8080 [--reset]");
  console.log("The reset options reset all certificates (including the selfsigned root).")
}

if ("mitm" in argv)
  Mitm(argv.analysis, argv.port, "reset" in argv);

if ("node" in argv)
  Node(argv.analysis, argv.main);
