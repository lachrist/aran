
const Data = require("./data.js");
const Identifier = require("./identifier.js");
const Pattern = require("./pattern.js");

exports.ExtendStrict = Data.ExtendStrict;
exports.ExtendFunction = Data.ExtendFunction;
exports.ExtendArrow = Data.ExtendArrow;
exports.ExtendToken = Data.ExtendToken;
exports.ExtendLabel = Data.ExtendLabel;

exports.GetStrict = Data.GetStrict;
exports.GetCallee = Data.GetCallee;
exports.GetToken = Data.GetToken;
exports.GetLabels = Data.GetLabels;

exports.BLOCK = Identifier.BLOCK;
exports.token = Identifier.token;
exports.Token = Identifier.Token;
exports.initialize = Identifier.initialize;
exports.Initialize = Identifier.Initialize;
exports.eval = Identifier.eval;
exports.read = Identifier.read;
exports.write = Identifier.write;
exports.Write = Identifier.Write;
exports.delete = Identifier.delete;
exports.typeof = Identifier.typeof;

exports.assign = Pattern.assign;
exports.Assign = Pattern.Assign;
exports.update = Pattern.update;
exports.Update = Pattern.Update;
