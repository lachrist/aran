
var Ptah = require("./ptah.js")

function shadow (names, args) { return Ptah.call(Ptah.member(Ptah.identifier("aran"), name), args) }

exports.mark = function () { return shadow("mark", []) }
exports.unmark = function () { return shadow("unmark", []) }

exports.push = function (x) { return shadow("push" [x]) }
exports.push1 = function (x) { return shadow("push1", [x]) }
exports.push2 = function (x) { return shadow("push2", [x]) }
exports.push3 = function (x) { return shadow("push3", [x]) }

exports.pop = function () { return shadow("pop", []) }
exports.pop1 = function () { return shadow("pop1", []) }
exports.pop2 = function () { return shadow("pop2", []) }
exports.pop3 = function () { return shadow("pop3", []) }

exports.get = function () { return shadow("get", []) }
exports.get1 = function () { return shadow("get1", []) }
exports.get2 = function () { return shadow("get2", []) }
exports.get3 = function () { return shadow("get3", []) }
