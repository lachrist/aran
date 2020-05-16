// nyc --reporter=html --report-dir=./nyc_output node lib/

const ChildProcess = require("child_process");

if (process.argv.length > 2) {
  ChildProcess.execSync("nyc --reporter=html --report-dir=coverage --include " + process.argv[2] + ".js node " + process.argv[2] + ".test.js", {
    __proto__: null,
    stdio: "inherit"
  });
  ChildProcess.execSync("open coverage/index.html", {
    __proto__: null,
    stdio: "inherit"
  });
} else {
  [
    "lib/lang/syntax",
    "lib/lang/build",
    "lib/normalize/state",
    "lib/normalize/build",
    "lib/normalize/query/access",
    "lib/normalize/object",
    "lib/normalize/scope/core",
    "lib/normalize/scope/layer",
    "lib/normalize/scope/container",
    "lib/normalize/scope/index"
  ].forEach((path) => {
    ChildProcess.execSync("nyc --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include " + path + ".js node " + path + ".test.js", {
      __proto__: null,
      stdio: "inherit"
    });
  });
}


