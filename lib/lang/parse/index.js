"use strict";

const ArrayLite = require("array-lite");
const Parser = require("./parser.js");

ArrayLite.forEach(
  ["Program", "Link", "LabelBlock", "Block", "Expression", "Statement"],
  (type, _options) => {
    _options = {startRule:`Start${type}`};
    exports[`parse${type}`] = (string) => {
      try {
        return Parser.parse(string, _options); }
      catch (error) {
        console.log(string);
        throw error; } }; });
