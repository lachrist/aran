const Path = require("path");
const Fs = require("fs");
const Stream = require("stream");
const Browserify = require("browserify");
if (process.argv.length !== 4) {
  process.stderr.write("usage: node bundle.js advice.js script.js > script.js");
}
const readable = new Stream.Readable();
readable.push([
  "const geval = global.eval"
  "const Join = require(\"./join.js\");",
  "const Advice = require("+JSON.stringify(Path.resolve(process.argv[2]))+");",
  "const script = "+JSON.stringify(Fs.readFileSync(process.argv[3], "utf8"))+";",
  "console.log(script);",
  "console.dir(geval(script));"
].join("\n"));
readable.push(null);
const browserify = Browserify(readable, {basedir:__dirname});
browserify.bundle().pipe(process.stdout);