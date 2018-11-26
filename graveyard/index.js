
const Scope = require("./scope.js");
const Signal = require("./signal.js");

exports.throw = Signal.throw;

exports.Declare = Scope.Declare;
exports.Deadzone = Scope.Deadzone;
exports.read = Scope.read;
exports.write = Scope.write;
exports.typeof = Scope.write;
exports.delete = Scope.delete;

exports.function = Closure

Object.assign(exports, Scope);


