
const Scope = require("./scope.js");
const Name = require("./name.js");
const Pattern = require("./pattern.js");

exports.token = Scope.token;
exports.Token = Scope.Token;
exports.declare = Scope.declare;
exports.EXTEND = Scope.EXTEND;

exports.write = Name.write;
exports.read = Name.read;
exports.typeof = Name.typeof;
exports.delete = Name.delete;

exports.assign = Pattern.assign;
