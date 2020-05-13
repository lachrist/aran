"use strict";

const Assert = require("assert").strict;
const Build = require("./build.js");
const State = require("./state.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};
const program = {
  sourceType: "script",
  type: "Program",
  body: []
};

State.session({nodes, serials, scopes}, program, () => {
  Assert.throws(() => Build.read("x"), new Error("Forbidden construction of scope-related node"));
  // Block //
  Assert.deepEqual(Build.__BLOCK__(["x", "y"], Build.Break("l")), ["BLOCK", ["x", "y"], [["Break", "l"]]]);
  // Statement //
  Assert.deepEqual(Build.Debugger(), [["Debugger"]]);
  Assert.deepEqual(Build.Break("l"), [["Break", "l"]]);
  Assert.deepEqual(Build.Lone(["l", "m"], Build.__BLOCK__(["x", "y"], Build.Break("l"))), [["Lone", ["l", "m"], ["BLOCK", ["x", "y"], [["Break", "l"]]]]]);
  Assert.deepEqual(Build.While(["l", "m"], Build.__read__("x"), Build.__BLOCK__(["y", "z"], Build.Break("l"))), [["While", ["l", "m"], ["read", "x"], ["BLOCK", ["y", "z"], [["Break", "l"]]]]]);
  Assert.deepEqual(Build.If(["l", "m"], Build.__read__("x"), Build.__BLOCK__(["y"], Build.Break("l")), Build.__BLOCK__(["z"], Build.Break("m"))), [["If", ["l", "m"], ["read", "x"], ["BLOCK", ["y"], [["Break", "l"]]], ["BLOCK", ["z"], [["Break", "m"]]]]]);
  // Expression //
  Assert.deepEqual(Build.__read__("x"), ["read", "x"]);
  Assert.deepEqual(Build.__write__("x", Build.__read__("y")), ["write", "x",  ["read", "y"]]);
  Assert.deepEqual(Build.conditional(Build.__read__("x"), Build.__read__("y"), Build.__read__("z")), ["conditional", ["read", "x"], ["read", "y"], ["read", "z"]]);
});
