
/*
 * Nasus and his siphoning strike will construct syntactic calls to aran stacks.
 */  

var Ptah = require("./ptah.js")
var Shadow = require("./shadow.js")

exports.mark = function () { return Shadow("mark", []) }
exports.unmark = function () { return Shadow("unmark", []) }

exports.push = function (x) { return Shadow("push", [x]) }
exports.push1 = function (x) { return Shadow("push1", [x]) }
exports.push2 = function (x) { return Shadow("push2", [x]) }
exports.push3 = function (x) { return Shadow("push3", [x]) }

exports.pop = function () { return Shadow("pop", []) }
exports.pop1 = function () { return Shadow("pop1", []) }
exports.pop2 = function () { return Shadow("pop2", []) }
exports.pop3 = function () { return Shadow("pop3", []) }

exports.get = function () { return Shadow("get", []) }
exports.get1 = function () { return Shadow("get1", []) }
exports.get2 = function () { return Shadow("get2", []) }
exports.get3 = function () { return Shadow("get3", []) }
