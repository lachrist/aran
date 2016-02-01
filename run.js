var Main = require("./main.js");
var Fs = require("fs");

Main({
  loc: true,
  port: 8080,
  filter: function (url) {
    console.log(url);
    return true;
  },
  analysis: Fs.readFileSync(__dirname + "/analyses/2-Transparent.js", {encoding:"utf8"})
});
