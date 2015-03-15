
var FS = require("fs")
var Browserify = require("browserify")

var ws = FS.createWriteStream(__dirname+"/bundle.js")
ws.write("window.masters = {};\n")

FS.readdir(__dirname+"/../master", function (err, names) {
  if (err) { throw err }
  var o = {}
  var done = 0
  names = names.filter(function (name) { return name !== ".DS_Store"})
  names.forEach(function (name) {
    FS.readFile(__dirname+"/../master/"+name, {encoding:"utf8"}, function (err, str) {
      if (err) { throw err }
      ws.write("window.masters."+name.replace("\.js", "")+" = "+JSON.stringify(str)+";\n")
      if (++done === names.length) {
        var b = Browserify()
        b.add(__dirname+"/main.js")
        b.bundle().pipe(ws)
      }
    })
  })
})
