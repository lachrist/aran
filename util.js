
exports.flaten = function (xss) {
  return xss.reduce(function (xs, ys) { return xs.concat(ys) }, [])
}

exports.append = function (xs, ys) {
  for (var i=0; i<ys.length; i++) { xs.push(ys[i])}
}

exports.prepend = function (xs, ys) {
  for (var i=ys.length-1; i>=0; i--) { xs.unshift(ys[i]) }
}

exports.log = function (mess) {
  for (var i=1; i<arguments.length; i++) {
    try { mess = mess+"\n    "+JSON.stringify(arguments[i]) }
    catch (e) { mess = mess+"\n    "+arguments[i] }
  }
  console.log(mess+"\n\n")
}

exports.last = function (xs) {
  return xs[xs.length-1]
}

exports.copy = function (o1) {
  var keys = Object.keys(o)
  var length = keys.length
  var o2 = {}
  for (var i=0; i<length; i++) { o2[keys[i]] = o1[keys[i]]}
  return o2
}

// exports.extract = function (o1) {
//   var o2 = {}
//   for (var k in o1) {
//     o2[k] = o1[k]
//     delete o1[k]
//   }
//   return o2
// }

// exports.inject = function (o1, o2) {
//   if (o1 !== o2) {
//     for (var k in o2) { delete o2[k] }
//     for (var k in o1) { o2[k] = o1[k] }
//   }
// }

exports.constant = function (c) { return function () { return c} }

exports.identity = function (x) { return x }

exports.second = function (x, y) { return y }

exports.nil = function () {}

exports.error = function () {
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
