// nyc --reporter=html --report-dir=./nyc_output node lib/

const ChildProcess = require("child_process");
const Fs = require("fs");
const Path = require("path");

if (process.argv.length > 2) {
  try {
    ChildProcess.execSync("node " + process.argv[2] + ".test.js", {
      __proto__: null,
      stdio: "inherit"
    });
  } catch (error) {
    process.exit(1);
  }
  ChildProcess.execSync(`nyc --reporter=html --report-dir=coverage --include ${process.argv[2]}.js node ${process.argv[2]}.test.js`, {
    __proto__: null,
    stdio: "inherit"
  });
  ChildProcess.execSync("open coverage/index.html", {
    __proto__: null,
    stdio: "inherit"
  });
} else {
  const files = new Set();
  const loop = (path) => {
    Fs.readdirSync(path).forEach((filename) => {
      const child = Path.join(path, filename);
      if (Fs.lstatSync(child).isDirectory()) {
        loop(child);
      } else {
        files.add(child);
      }
    });
  };
  loop(Path.join(__dirname, "lib"));
  [
    // "lib/throw",
    // "lib/variable",  
    // "lib/source",
    // "lib/parser/wrapper/acorn",
    // "lib/parser/wrapper/esprima",
    // "lib/parser/wrapper/index",
    // "lib/parser/parser",
    // "lib/parser/index",
    // "lib/annotation",
    // "lib/annotator/hoisting",
    // "lib/annotator/annotator",
    // "lib/annotator/index",
    // "lib/tree",
    // "lib/identifier",
    // "lib/lang/parse/index",
    // "lib/lang/generate",
    // "lib/lang/match/mapping",
    // "lib/lang/match/result",
    // "lib/lang/match/index",
    // "lib/lang/index",
    // "lib/transpile/state",
    // "lib/transpile/tree",
    // "lib/transpile/completion",
    // "lib/transpile/intrinsic",
    "lib/transpile/scope/layer-1-core",
    "lib/transpile/scope/layer-2-split",
    "lib/transpile/scope/layer-3-meta",
    "lib/transpile/scope/layer-4-base",
    "lib/transpile/scope/layer-5-index",
    "lib/transpile/scope/index",
    "lib/transpile/visit/index",
    "lib/transpile/visit/other",
    "lib/transpile/visit/pattern",
    "lib/transpile/visit/closure",
    "lib/transpile/visit/class",
    "lib/transpile/visit/expression",
    "lib/transpile/visit/link-statement",
    "lib/transpile/visit/hoisted-statement",
    "lib/transpile/visit/statement",
    "lib/transpile/visit/block",
    "lib/transpile/index",
    "lib/instrument",
    "lib/generate",
    "lib/index"
  ].forEach((path) => {
    console.log(`\n${path}...`);
    try {
      // ChildProcess.execSync(`node ${path}.test.js`, {
      //   __proto__: null,
      //   stdio: "inherit"
      // });
      ChildProcess.execSync(`nyc --reporter=text-summary --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include ${path}.js node ${path}.test.js`, {
        __proto__: null,
        stdio: "inherit"
      });
    } catch (error) {
      process.exit(1);
    }
    path = Path.join(__dirname, path);
    if (!files.has(path + ".js") || !files.has(path + ".test.js")) {
      throw new Error(`Missing path: ${path}`);
    }
    files.delete(path + ".js");
    files.delete(path + ".test.js");
  });
  if (files.size) {
    console.log("\nMissing files:");
    for (let file of files) {
      console.log("  - " + file);
    }
  } else {
    console.log("Victoly, you reached 100% coverage!!!");
  }
}
