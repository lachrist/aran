"use strict";

const Match = require("./match.js");
const Parser = require("./parser/index.js");

const global_Object_assign = global.Object.assign

global_Object_assign(exports, Match, Parser);