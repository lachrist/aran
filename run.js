#!/usr/bin/env node

var Stream = require("stream");
var Otiluke = require("otiluke");
var Browserify = require("browserify");
var Minimist = require("minimist");

var args = Minimist(process.argv.slice(2));
var ports = {http:args["http-port"], ssl:args["ssl-port"]};
if ("help" in args)
  console.log("Usage: aran --entry /path/to/entry.js --http-port 8080 --ssl-port 8443")
if (!args.entry)
  throw "Argument --entry is mandatory"

var buffer = [];
var writable = new Stream.Writable();
writable._write = function (chunk, encoding, done) {
  buffer.push(chunk.toString("utf8"));
  done();
};
writable.on("finish", function () {
  buffer.push("\nrequire('trololo');");
  Otiluke("aran", buffer.join(""), ports);
});
var b = Browserify();
b.require(args.entry, {expose:"trololo"});
b.bundle().pipe(writable);

// FS.readFile(process.argv[2], {encoding:"utf8"}, function (err, master) {
//   if (err) { throw new Error(err) }
//   FS.readFile(process.argv[3], {encoding:"utf8"}, function (err, target) {
//     if (err) { throw new Error(err) }
//     var exports = {}
//     eval(master)
//     var aran = Aran(exports.sandbox, exports.hooks, exports.traps)
//     aran(target)
//   })
// })
