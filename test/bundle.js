const Path = require("path");
const Fs = require("fs");
const Stream = require("stream");
const Minimist = require("minimist");
const Browserify = require("browserify");
const readable = new Stream.Readable();
readable.push([
  "const geval = global.eval",
  "const Weave = require(\"./weave.js\");",
  "const Advice = require("+JSON.stringify(Path.resolve(process.argv[2]))+");",
  "const weave = Weave("+JSON.stringify(Minimist(process.argv.slice(4)))+", Advice);",
  "const script = weave("+JSON.stringify(Fs.readFileSync(process.argv[3], "utf8"))+");",
  "console.log(script);",
  "debugger;",
  "console.dir(geval(script));"
].join("\n"));
readable.push(null);
const browserify = Browserify(readable, {basedir:__dirname});
browserify.bundle().pipe(process.stdout);