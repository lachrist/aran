"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Parser = require("./index.js");

Parser.parse(`123`);
Parser.Parse(`123;`);
Parser.PARSE(`{123;}`);