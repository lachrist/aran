const Fs = require("fs");
const Path = require("path");
const ChildProcess = require("child_process");
const dirname = Path.resolve(process.argv[process.argv.length-1]);
const path = process.argv.splice(0, 3)[2];
Fs.readdirSync(dirname).forEach((filename) => {
  process.argv[process.argv.length-1] = dirname+"/"+filename;
  if (/\.js/.test(filename)) {
    const chunks = [];
    const child = ChildProcess.fork(path, process.argv, {stdio:"pipe"});
    child.stderr.on("data", (chunk) => { chunks.push(chunk) });
    child.on("exit", (code, signal) => {
      process.stdout.write(filename+"\n");
      chunks.length && process.stderr.write(chunks.join(""))
    });
  }
});