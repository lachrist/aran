
// Save compile time information for runtime, defines: aran.fetch.

module.exports = function (aran) {
  var store = []
  aran.fetch = function (i) { return store[i] }
  return function (x) {
    store.push(x)
    return store.length-1
  }
}
