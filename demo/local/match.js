const Fs = require("fs");
const Path = require("path");
const ChildProcess = require("child_process");

if (process.argv.length !== 5) {
  process.stderr.write("Usage: node run.js path/to/analysis1.js path/to/analysis2.js path/to/target.js\n");
  process.exit(1);
}

const launch = (analysis, target, callback) => {
  const child = ChildProcess.fork(__dirname+"/run.js", [analysis, target], {stdio:"pipe"});
  let chunks = [];
  console.log(analysis+":");
  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    chunks.push(chunk);
  });
  child.stderr.on("data", (chunk) => { process.stderr.write(chunk) });
  child.on("exit", (code, signal) => {
    if (code)
      process.exit(code);
    console.log("");
    callback(chunks.join(""));
  });
};

launch(process.argv[2], process.argv[4], (stdout1) => {
  launch(process.argv[3], process.argv[4], (stdout2) => {
    if (stdout1 !== stdout2) {
      let lines1 = stdout1.split("\n");
      let lines2 = stdout2.split("\n");
      for (let index = 0, length = Math.max(lines1.length, lines2.length); index < length; index ++) {
        if (lines1[index] !== lines2[index])
          throw new Error("Mismatch at line "+index+":\n  "+lines1[index]+"\n  "+lines2[index]);
      }
      throw new Error("\"\" !== \"\\n\"");
    }
  });
});
