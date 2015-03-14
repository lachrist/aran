
/*
 * Nasus and his siphoning strike will construct syntactic calls to aran stacks.
 */  

var Shadow = require("./shadow.js")
var Esvisit = require("esvisit")

exports.mark = function () { return Esvisit.Halt(Shadow("mark", [])) }
exports.unmark = function () { return Esvisit.Halt(Shadow("unmark", [])) }

exports.push = function (x) { return Shadow("push", [x]) }
exports.push1 = function (x) { return Shadow("push1", [x]) }
exports.push2 = function (x) { return Shadow("push2", [x]) }
exports.push3 = function (x) { return Shadow("push3", [x]) }

exports.pop = function () { return Esvisit.Halt(Shadow("pop", [])) }
exports.pop1 = function () { return Esvisit.Halt(Shadow("pop1", [])) }
exports.pop2 = function () { return Esvisit.Halt(Shadow("pop2", [])) }
exports.pop3 = function () { return Esvisit.Halt(Shadow("pop3", [])) }

exports.get = function () { return Esvisit.Halt(Shadow("get", [])) }
exports.get1 = function () { return Esvisit.Halt(Shadow("get1", [])) }
exports.get2 = function () { return Esvisit.Halt(Shadow("get2", [])) }
exports.get3 = function () { return Esvisit.Halt(Shadow("get3", [])) }
