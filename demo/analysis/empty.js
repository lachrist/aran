// Does nothing beside logging the instrumented code //
const Aran = require("../../main.js");
const Esprima = require("esprima");
const JsBeautify = require("js-beautify");
const aran = Aran("__traps__");
global.__traps__ = {};
module.exports = (source, script, log) => {
  const root = Esprima.parse(script);
  const instrumented = aran.instrument(root, []);
  log(JsBeautify.js_beautify(instrumented)+"\n");
  log(JSON.stringify(global.eval(instrumented))+"\n");
};