"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Lang = require("./lang.js");
const State = require("./state.js");
const Parser = require("../../test/parser/index.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};

State._run_session({nodes: [], serials: new Map, scopes: {__proto__:null}}, [], () => {
  Assert.deepEqual(Completion._make("foo"), "foo");
  Assert.deepEqual(Completion._make(null), null);
  
  Assert.deepEqual(Scope.EXTEND_STATIC(null, {__proto__:null}, (scope) => {
    Scope.Box(scope, "x", false, Build.primitive(123), (box) => {
      
    });
  }), Parser.PARSE(`{
    
  }`));
});