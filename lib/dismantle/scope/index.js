
const Data = require("./data.js");
const Identifier = require("./identifier.js");
const Pattern = require("./pattern.js");

exports.ExtendStrict = Data.ExtendStrict;
exports.ExtendFunction = Data.ExtendFunction;
exports.ExtendArrow = Data.ExtendArrow;
exports.ExtendWith = Data.ExtendWith;
exports.ExtendCompletion = Data.ExtendCompletion;
exports.ExtendSwitch = Data.ExtendSwitch;

exports.GetStrict = Data.GetStrict;
exports.GetCallee = Data.GetContext;
exports.GetSwitch = Data.GetSwitch;
exports.GetCompletion = Data.GetCompletion;

exports.BLOCK = Identifier.BLOCK;
exports.token = Identifier.token;
exports.Token = Identifier.Token;
exports.initialize = Identifier.initialize;
exports.read = Identifier.read;
exports.write = Identifier.write;
exports.delete = Identifier.delete;
exports.typeof = Identifier.typeof;

exports.assign = Pattern.assign;
