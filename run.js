var Main = require("./main.js");
var Fs = require("fs");

Main({
  loc: true,
  port: 8080,
  filter: function (url) {
    console.log(url);
    return true;
  },
  namespace: "gruntyyy",
  traps: ["Ast"],
  analysis: [
    "var gruntyyy = {};",
    "gruntyyy.Ast = function (ast, url) { console.log(url) };"
  ].join("")
});
