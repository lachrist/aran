"use strict";

const ArrayLite = require("array-lite");
const Parser = require("./parser.js");

const parse = (options) => (code) => {
  try {
    return Parser.parse(code, options); }
  catch (error) {
    require("fs").writeFileSync(require("path").join(__dirname, "..", "..", "..", "tmp.js"), code, "utf8");
    throw error; } }

exports.parse = (type, code) => parse({startRule:`Start${type}`})(code);

ArrayLite.forEach(
  ["Program", "Link", "LabelBlock", "Block", "Expression", "Statement"],
  (type, _options) => {
    exports[`parse${type}`] = parse({startRule:`Start${type}`}); });
