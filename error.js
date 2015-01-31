
module.exports = function () {
  var msg = ""
  for (var i=0; i<arguments.length; i++) {
    try {
      msg = msg + JSON.stringify(arguments[i]) + "\n"
    } catch (e) {
      msg = msg + arguments[i]
    }
  }
  throw new Error(msg)
}