var Stream = require("stream");
var Otiluke = require("otiluke");
var Browserify = require("browserify");
var Minimist = require("minimist");

var args = Minimist(process.argv.slice(2));
if ("help" in args)
  console.log("Usage: node proxy.js --entry /absolute/path/to/main.js --port 8080")
if (!args.entry)
  throw "Argument --entry is mandatory"
var buffer = [];
var writable = new Stream.Writable();
writable._write = function (chunk, encoding, done) {
  buffer.push(chunk.toString("utf8"));
  done();
};
writable.on("finish", function () {
  buffer.push("\nrequire('main');");
  Otiluke({
    port: Number(args.port),
    namespace: "aran",
    init: buffer.join(""),
    log: args["log-level"],
    record: args["record-port"] ? {port:args["record-port"], file:args["record-file"]} : null
  });
});
var b = Browserify();
b.require(args.entry, {expose:"main"});
b.bundle().pipe(writable);