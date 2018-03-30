// Usage node bundle.js path/to/advice.js path/to/target.js [--namespace META] [--output EstreeValid] [--nocache] [--nosandbox]
const Path = require("path");
const Fs = require("fs");
const Stream = require("stream");
const Minimist = require("minimist");
const Browserify = require("browserify");
const readable = new Stream.Readable();
readable.push([
  "const geval = global.eval",
  "const Instrument = require(\"./instrument.js\");",
  "const Advice = require("+JSON.stringify(Path.resolve(process.argv[2]))+");",
  "const instrument = Instrument("+JSON.stringify(Minimist(process.argv.slice(4)))+", Advice);",
  "const script = weave("+JSON.stringify(Fs.readFileSync(process.argv[3], "utf8"))+");",
  "console.log(script);",
  "debugger;",
  "console.dir(geval(script));"
].join("\n"));
readable.push(null);
const browserify = Browserify(readable, {basedir:__dirname});
browserify.bundle().pipe(process.stdout);