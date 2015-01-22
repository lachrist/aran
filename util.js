
exports.flaten = function (xss) {
  return xss.reduce(function (xs, ys) { return xs.concat(ys) }, [])
}

exports.prepend = function (xs, ys) {
  for (var i=xs.length-1; i>=0; i--) { ys.unshift(xs[i]) }
}

exports.extract = function (o1) {
  var o2 = {}
  for (var k in o1) {
    o2[k] = o1[k]
    delete o1[k]
  }
  return o2
}

exports.inject = function (o1, o2) {
  var k
  for (k in o2) { delete o2[k] }
  for (k in o1) { o2[k] = o1[k] }
}

exports.identity = function (x) { return x }

exports.nil = function () {}