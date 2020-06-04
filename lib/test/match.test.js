"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Match = require("./match.js");

///////////
// Block //
///////////

///////////////
// Statement //
///////////////
// BlockLess //
// Lift //
// Return //
// Break //
// Continue //
// Debugger //
// Bundle //
// BlockFull //
// Lone //
// If //
// While //
// Try //

///////////////
// Producers //
///////////////
// primitive //
Match._match_expression(Lang.primitive(123), Lang.primitive(123));
// builtin //
// arrow //
// function //
// read //
// Consumers //
// write //
// sequence //
// conditional //
// throw //
// eval //
// Combiners //
// apply //
// construct //
// unary //
// binary //
// object //
