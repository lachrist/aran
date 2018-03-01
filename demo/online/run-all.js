const Fs = require("fs");
const Path = require("path");
const ChildProcess = require("child_process"); 
if (process.argv.length !== 4) {
  process.stderr.write("Usage: node run.js path/to/analysis.js path/to/target\n");
  process.exit(1);
}
process.argv[3] = Path.resolve(process.argv[3]);
Fs.readdirSync(process.argv[3]).forEach((filename) => {
  if (/\.js/.test(filename)) {
    const chunks = [];
    const child = ChildProcess.fork(__dirname+"/run.js", [process.argv[2], process.argv[3]+"/"+filename], {stdio:"pipe"});
    child.stderr.on("data", (chunk) => { chunks.push(chunk) });
    child.on("exit", (code, signal) => { console.log(filename+" "+chunks.join(""))});
  }
});