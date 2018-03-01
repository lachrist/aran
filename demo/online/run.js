const Fs = require("fs");
const Path = require("path");
if (process.argv.length !== 4) {
  process.stderr.write("Usage: node run.js path/to/analysis.js path/to/target.js\n");
  process.exit(1);
}
global.postMessage = (message) => process.stdout.write(message);
const Analysis = require(Path.resolve(process.argv[2]));
Analysis(Fs.readFileSync(process.argv[3], "utf8"));