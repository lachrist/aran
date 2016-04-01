
var Fs = require("fs");
var Browserify = require("Browserify");
var Otiluke = require("otiluke");
var Instrument = require("./instrument.js");
var Stream = require("stream");
var Esprima = require("esprima");

var cf = " -- cf: https://github.com/lachrist/aran#api";
var dynamic = [
  "require(ANALYSIS);",
  "var Esprima = require(\"esprima\");",
  "var Instrument = require(\"" + __dirname.replace(/\"/g, "\\\"") + "/instrument.js\");",
  "var aran = (function () { return this.NAMESPACE } ());",
  "var instrument = Instrument(\"NAMESPACE\", Object.keys(aran));",
  "var options = {range:RANGE, loc:LOC};",
  "aran.instrument = function (code, url) {",
  "  var ast = Esprima.parse(code, options);",
  "  var instrumented = instrument(ast);",
  "  aran.Ast && aran.Ast(ast, url);",
  "  return instrumented;",
  "};"
].join("\n");

function test (f, x, msg) { try { f(x) } catch (e) { throw new Error(msg) } } 


exports.static = function (options) {
  if (!Array.isArray(options.traps))
    throw new Error("The option traps should be an array" + cf);
  if 
};

exports.dynamic = {
  monolithic:
  mitm:
  commonjs:
};

exports.instrument = instrument;

exports.static = function (options, callback) {
  var instrument = Instrument(options);
  if (options.monolithic) {
    Fs.readFile(options.monolithic, "utf8", function (error, content) {
      return callback(error, instrument(content));
    });
  } else if (options.)

};

exports.dynamic = function (options) {

};

exports.static = function () {=
  monolithic:
  commonjs:
  html:
};


exports.static = function (options) {
  if (!Array.isArray(options.traps))
    throw new Error("The option traps should be an array" + cf);
  var suboptions = {range:options.range, loc:options.loc};
  var instrument = Instrument(options.namespace, options.traps);
  return function (code) {
    var ast = Esprima.parse(code, suboptions);
    return {instrumented:instrument(ast), ast:ast};
  };
};

exports.mitm = function (options) {
  if (typeof options.port !== "number")
    throw new Error("The option port should be a number");
  initialize(options);
};

exports.commonjs = function (options) {
  test(Fs.createReadStream, options.main, "The option main does not point to a readable file" + cf);
  test(Fs.createWriteStream, options.out, "The option out does not point to a writable file" + cf);
  initialize(options);
};

function initialize (options) {
  options.namespace = options.namespace || "aran";
  options.intercept = function (url) {
    if (!options.filter || options.filter(url))
      return function (code) {
        return "eval(" + options.namespace + ".instrument(" + JSON.stringify(code) + "," + JSON.stringify(url) + "))";
      }
  };
  test(Fs.createReadStream, options.analysis, "The option analysis does not point to a readable file" + cf);
  var stream = new Stream.Readable({read: function () {}});
  stream.push(dynamic
    .replace(/ANALYSIS/g, function () { return JSON.stringify(options.analysis) })
    .replace(/NAMESPACE/g, function () { return options.namespace })
    .replace(/RANGE/g, function () { return Boolean(options.range) })
    .replace(/LOC/g, function () { return Boolean(options.loc) }));
  stream.push(null);
  Browserify(stream).bundle(function (error, buffer) {
    if (error)
      throw error;
    options.setup = buffer.toString();
    Otiluke(options);
  });
};
