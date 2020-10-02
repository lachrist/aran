// nyc --reporter=html --report-dir=./nyc_output node lib/

const ChildProcess = require("child_process");

if (process.argv.length > 2) {
  try {
    ChildProcess.execSync("node " + process.argv[2] + ".test.js", {
      __proto__: null,
      stdio: "inherit"
    });
  } catch (error) {
    process.exit(1);
  }
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
    "lib/tree",
    "lib/reserved-words",
    "lib/lang/parse/index",
    "lib/lang/generate",
    "lib/lang/match",
    "lib/lang/index",
    "lib/stratum",
    "lib/normalize/query/eval",
    "lib/normalize/query/other",
    "lib/normalize/query/valuation",
    "lib/normalize/query/hoisting",
    "lib/normalize/query/access",
    "lib/normalize/query/index",
    "lib/normalize/state",
    "lib/normalize/tree",
    "lib/normalize/mop",
    "lib/normalize/scope/inner",
    "lib/normalize/scope/outer",
    "lib/normalize/scope/meta",
    "lib/normalize/scope/base",
    "lib/normalize/scope/index",
    "lib/normalize/completion",
    "lib/normalize/program/common/assign",
    "lib/normalize/program/common/closure",
    "lib/normalize/program/common/class",
    "lib/normalize/program/common/index",
    "lib/normalize/program/expression",
    "lib/normalize/program/statement",
    "lib/normalize/program/index",
    "lib/normalize/index"
  ].forEach((path) => {
    console.log(`\n${path}...`);
    try {
      ChildProcess.execSync(`node ${path}.test.js`, {
        __proto__: null,
        stdio: "inherit"
      });
      ChildProcess.execSync(`nyc --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include ${path}.js node ${path}.test.js`, {
        __proto__: null,
        stdio: "inherit"
      });
    } catch (error) {
      process.exit(1);
    }
  });
}
