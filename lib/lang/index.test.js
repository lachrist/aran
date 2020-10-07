"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Lang = require("./index.js");
