
var Browserify = require("browserify");
var Otiluke = require("otiluke");
var Fs = require("fs");
var Stream = require("stream");

function random (length) {
  return String.fromCharCode.call(String, new Array(length).map(function () {
    return Math.floor(Math.random() * (90 - 65)) + 65;
  }));
}

module.exports = function (options) {
  var name = random(10);
  var stream = new Stream.Readable();
  stream.push("if(typeof "+name+"==='undefined'))"+name+"=require("+JSON.stringify(options.analysis)+")");
  stream.push(null);
  Browserify(stream).bundle(function (error, buffer) {
    if (error)
      throw error;
    options.setup = buffer.toString("utf8");
    options.intercept = function (url) {
      return function (js) {
        return "eval("+name+"("+JSON.stringify(js)+","+JSON.stringify(url)+"))"
      };
    };
    Otiluke(options);
  });
};
