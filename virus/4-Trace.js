// This analysis traps everything and forward all operations //
var Aran = require("aran");
var Esprima = require("esprima");
var JsBeautify = require("js-beautify");
var ForwardTraps = require("aran/forward-traps");
module.exports = function (parameter, channel, callback) {
  var socket = channel.connect();
  socket.on("open", function () {
    function locate (idx) {
      var node = aran.node(idx);
      var src = aran.program(idx).source;
      var loc = node.loc.start;
      return node.type+"@"+src+"#"+loc.line+":"+loc.column;
    }
    function logtrap (name, args) {
      var arr = [name, locate(args[args.length-1]), ">>"];
      for (var i=0; i<args.length-1; i++)
        arr.push(typeof args[i]);
      socket.send(arr.join(" "));
    }
    var namespace = "_traps_";
    global[namespace] = {};
    Object.keys(ForwardTraps).forEach(function (name) {
      global[namespace][name] = function () {
        logtrap(name, arguments);
        return ForwardTraps[name].apply(this, arguments);
      };
    });
    var aran = Aran(namespace);
    var pointcut = Object.keys(global[namespace]);
    callback(function (script, source) {
      var program = Esprima.parse(script, {loc:true});
      program.source = source;
      return JsBeautify.js_beautify(aran.instrument(program, pointcut));
    });
  });
};