
var fs = require("fs");
var browserify = require("browserify");

var b = browserify()
b.require(__dirname+"/../main.js", {expose: "aran"});
b.bundle().pipe(fs.createWriteStream(__dirname+"/aran.js"));
