
function error (blame, message, arguments) {
  var args = []
  for (var i=1; i<arguments.length; i++) { args.push(arguments[i]) }
  var error = new Error(message)
  error.blame = blame
  error.data = args
  throw error
}

exports.esprima = function (message) { error("esprima", message, arguments) }

exports.internal = function (message) { error("internal", message, arguments) }

exports.external = function (message) { error("external", message, arguments) }
