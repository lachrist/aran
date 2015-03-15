
// node --harmony --harmony_proxies master target

var FS = require("fs")
var Aran = require("./main.js")

FS.readFile(process.argv[2], {encoding:"utf8"}, function (err, master) {
  if (err) { throw new Error(err) }
  FS.readFile(process.argv[3], {encoding:"utf8"}, function (err, target) {
    if (err) { throw new Error(err) }
    var exports = {}
    eval(master)
    var aran = Aran(exports.sandbox, exports.hooks, exports.traps)
    aran(target)
  })
})
