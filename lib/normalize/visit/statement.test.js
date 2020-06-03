"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Acorn = require("acorn");
const Expression = require("./expression.js");
const Lang = require("../../lang.js");
const State = require("../state.js");
const Parser = require("../../../test/parser/index.js");

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {
  const test = (code, code) => {
    Assert.deepEqual(Program.Visit(Acorn.parse(code1), null, Completion._make(null), []), Parser.PARSE(code2)));
  }
  // EmptyStatement //
  Assert.deepEqual(Statement.Visit(Acorn.parse(`;`).body[0], null, Completion._make(null), []), Lang.Bundle([]));
  Assert.deepEqual(Expression.visit(Acorn.parse(`/abc/g;`).body[0].expression, null, false, null), Parser.parse(`new #RegExp("abc", "g")`));
});