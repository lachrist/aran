"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Parse = require("./index.js");

Parse.expression(`123`);
Parse.Statement(`123;`);
Parse.BLOCK(`{123;}`);