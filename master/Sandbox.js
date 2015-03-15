
exports.sandbox = {}

var excluded = ["eval", "Function"]

for (var key in window) {
  if (excluded.indexOf(key) === -1) {
    sandbox[key] = window[key]
  }
}
