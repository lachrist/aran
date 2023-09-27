const Fs = require("fs");
const Path = require("path");
const ChildProcess = require("child_process");

const path1 = Path.join(__dirname, "run-one.js");

const path2 = Path.resolve(process.argv[2]);

Fs.readdirSync(process.argv[3]).forEach((name) => {
  if (name.endsWith(".js")) {
    const path3 = Path.join(process.argv[3], name)
    ChildProcess.exec("node " + path3, (error1, stdout1, stderr1) => {
      if (error1 || stderr1.length > 0) {
        console.error(path3);
        if (stderr.length > 0) {
          console.error(stderr1);
        }
        if (error1) {
          console.error("Error1 Code: ", error1.code);
          console.error("Error1 Signal: ", error1.signal);
          console.error(error1.stack);
        }
        process.exit(1);
      }
      ChildProcess.exec("node " + path1 + " " + path2 + " " path3, (error2, stdout2, stderr2) => {
        if (error2) {
          console.error(name);
          console.error("Error2 Code: ", error2.code);
          console.error("Error2 Signal: ", error2.signal);
          console.error(error2.stack);
          process.exit(1);
        }
        if (stdout1 !== stdout2) {
          console.error(name);
          console.error("Mismatch:");
          console.error("Original:", stdout1);
          console.error("Instrumented:", stdout2);
          process.exit(1);
        }
        console.log(name);
        console.log(stdout2);
        console.log(stderr2);
      });
    });
  }
});
