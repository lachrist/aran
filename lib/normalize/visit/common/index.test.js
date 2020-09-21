"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Common = require("./index.js");

Common._resolve_circular_dependencies({}, {});
