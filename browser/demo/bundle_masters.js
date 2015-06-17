
var fs = require("fs");
var ws = fs.createWriteStream(__dirname+"/masters.js");

ws.write("window.masters = {};\n");

fs.readdirSync(__dirname+"/../master").forEach(function (name) {
  if (name !== ".DS_Store")
    fs.readFile(__dirname+"/../master/"+name, {encoding:"utf8"}, function (err, str) {
      if (err) { throw err }
      ws.write("window.masters."+name.replace("\.js", "")+" = "+JSON.stringify(str)+";\n");
    })
});
