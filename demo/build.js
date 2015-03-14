
var fs = require("fs")
var browserify = require("browserify")

var ws = fs.createWriteStream("./bundle.js")
ws.write("window.masters = {};\n")

fs.readdir("./masters", function (err, names) {
  if (err) { throw err }
  var o = {}
  var done = 0
  names.forEach(function (name) {
    fs.readFile("./masters/"+name, {encoding:"utf8"}, function (err, str) {
      if (err) { throw err }
      ws.write("window.masters."+name.replace("\.js", "")+" = "+JSON.stringify(str)+";\n")
      if (++done === names.length) {
        var b = browserify()
        b.add("./main.js")
        b.bundle().pipe(ws)
      }
    })
  })
})
