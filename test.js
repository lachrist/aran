// nyc --reporter=html --report-dir=./nyc_output node lib/

const ChildProcess = require("child_process");

[
  "lib/syntax",
  "lib/build",
  "lib/normalize/state",
  "lib/normalize/build",
  "lib/normalize/scope/core",
  "lib/normalize/scope/layer",
  "lib/normalize/scope/container"
  // "lib/normalize/scope/index.js"
].forEach((path) => {
  const command = "nyc --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include " + path + ".js node " + path + ".test.js";
  console.log(command);
  ChildProcess.execSync(command, {
    stdio: "inherit"
  });
});



