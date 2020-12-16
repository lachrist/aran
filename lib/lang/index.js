"use strict";

const global_Object_assign = global.Object.assign;

const Parse = require("./parse/index.js");
const Generate = require("./generate.js");
const Match = require("./match.js");
const Acorn = require("acorn");

global_Object_assign(exports, Parse, Generate, Match);
