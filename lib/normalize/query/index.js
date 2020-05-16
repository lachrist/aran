
"use strict";

const ArrayLite = require("array-lite");

const Other = require("./other.js");
const Access = require("./access.js");
const Hoisting = require("./hoisting.js");

exports._access = Access._access;

exports._is_direct_eval_call = Other._is_direct_eval_call

exports._is_use_strict = Other._is_use_strict

exports._params_hoisting = Hoisting._params;

exports._shallow_hoisting = Hoisting._shallow;

exports._deep_hoisting = Hoisting._deep;
