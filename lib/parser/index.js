"use strict";

const Variable = require("./variable");
const Source = require("./source.js");
const Cache = require("./cache.js");
const Wrapper = require("./wrapper");
const Parser = require("./parser");
const Scoping = require("./scoping.js");

exports.getVariableName = Variable.getName;
exports.isVariableWritable = Variable.isWritable;
exports.isVariableImport = Variable.isImport;
exports.getVariableImportSource = Variable.getImportSpecifier;
exports.getVariableImportSpecifier = Variable.getImportSource;
exports.getVariableExportSpecifierArray = Variable.getExportSpecifierArray;

exports.makeSource = Source.make; 

exports.getCacheHoisting = Cache.getHoisting;
exports.hasCacheUseStrictDirective = Cache.hasUseStrictDirective;
exports.hasCacheDirectEvalCall = Cache.hasDirectEvalCall;
exports.getCacheSource = Cache.getSource;

exports.wrapAcorn = Wrapper.wrapAcorn;
exports.wrapEsprima = Wrapper.wrapEsprima;

exports.parse = Parser.parse;

exports.scope = Scoping.scopeProgram;
