"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("acorn");
const Block = require("./block.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {
  ////////////////////////////////////////////
  // 2. ExpressionStatement (no completion) //
  ////////////////////////////////////////////
  Lang._match_statement(
    Statement.visit(
      Scope._make_root(),
      Acorn.parse(`123;`).body[0],
      Competion._make_program(null),
      []),
    Lang.ParseStatement(`123;`),
    Assert);
      
  const test = (code1, code2) => Lang._match_block(
    Block.PROGRAM(
      Scope._make_eval([]),
      Acorn.parse(code1).body),
    Lang.PARSE_BLOCK(code2),
    Assert);
  // ExpressionStatement //
  test(
    `
      123;
      456;
      debugger;`,
    `{
      let _completion;
      _completion = void 0;
      123;
      _completion = 456;
      debugger;
      return _completion;}`);
  // EmptyStatement //
  test(
    `
      123;
      ;
      `,
    `{
        let _completion;
        _completion = void 0;
        _completion = 123;
        return _completion;}`);
  // DebuggerStatement //
  test(
    `
      123;
      debugger;`,
    `{
      let _completion;
      _completion = void 0;
      _completion = 123;
      debugger;
      return _completion;}`);
  // LabeledStatement //
  test(
    `k: 123;`,
    `{
      let _completion;
      _completion = void 0;
      _completion = 123;
      return _completion;}`);
  // BlockStatement //
  test(
    `
      k: l: {
        123;}
      456;`,
    `{
      k: l: {
        123;}
      return 456;}`);
  // BreakStatement //
  // Throw //
  Assert._match_statement(
    Statement.Visit(
      Scope._make_root(),
      Acorn.parse(`throw 123;`).body[0],
      Completion._make_program(null),
      []),
    Lang.ParseStatement(`throw 123;`),
    Assert);
});