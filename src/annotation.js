"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;

const Throw = require("./throw.js");

const makeSetter = (key) => (annotation, value) => (
  Throw.assert(
    global_Reflect_getOwnPropertyDescriptor(annotation, key) === void 0,
    null,
    `Annotation overwritting`),
  annotation[key] = value,
  void 0);

const makeGetter = (key) => (annotation) => (
  Throw.assert(
    global_Reflect_getOwnPropertyDescriptor(annotation, key) !== void 0,
    null,
    `Annotation miss`),
  annotation[key]);

exports.make = () => ({});

// estree.Program | estree.BlockStatement | estree.Function | estree.CatchClause | estree.ForStatement | estree.ForInStatement | estree.ForOfStatement
exports.setHoisting = makeSetter("hoisting");
exports.getHoisting = makeGetter("hoisting");

// estree.Program | estree.Function | estree.BlockStatement | estree.Expression
exports.setDirectEvalCall = makeSetter("hasDirectEvalCall");
exports.hasDirectEvalCall = makeGetter("hasDirectEvalCall");

// estree.Program | estree.Function
exports.setUseStrictDirective = makeSetter("hasUseStrictDirective");
exports.hasUseStrictDirective = makeGetter("hasUseStrictDirective");

// estree.CallExpression (direct eval call)
exports.setSource = makeSetter("DirectEvalCallSource");
exports.getSource = makeGetter("DirectEvalCallSource");

// estree.CallExpression (direct eval call)
exports.setScope = makeSetter("DirectEvalCallScope");
exports.getScope = makeGetter("DirectEvalCallScope");
