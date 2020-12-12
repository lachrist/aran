"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Parse = require("../../parse.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  require("./class.js"),
  require("./expression.js"),
  require("./hoisted-statement.js"),
  require("./prelude-statement.js")]);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {

  const test = (code1, code2, _preludes1, _preludes2) => (
    _preludes1 = ArrayLite.flatMap(
      typeof code1 === "string" ? Parse.module(code1).body : code1,
      (node) => Visit._prelude_statement(Scope._make_root(), node, null)),
    _preludes2 = ArrayLite.map(
      code2 === `` ? [] : code2.split("\n"),
      (code2) => Lang._parse_prelude(code2)),
    Assert.deepEqual(_preludes1.length, _preludes2.length),
    ArrayLite.forEach(
      _preludes1,
      (_, index) => Lang._match_prelude(
        _preludes1[index],
        _preludes2[index],
        Assert)));

  ////////////
  // Import //
  ////////////

  test(
    `import "source";`,
    `import * from "source";`);

  test(
    `import {imported1 as local1, imported2 as local2} from "source";`,
    `import imported1 from "source";
     import imported2 from "source";`);

  test(
    `import * as local from "source";`,
    `import * from "source";`);

  test(
    `import local from "source";`,
    `import default from "source";`);

  ////////////
  // Export //
  ////////////

  test(
    `export default 123;`,
    `export default;`);

  test(
    `export * from "source";`,
    `aggregate * from "source";`);

  test(
    ` export {imported1 as exported1, imported2 as exported2} from "source";`,
    ` aggregate imported1 from "source" as exported1;
      aggregate imported2 from "source" as exported2;`);

  test(
    [
      {
        type: "ExportNamedDeclaration",
        source: null,
        declaration: null,
        specifiers: [
          {
            type: "ExportSpecifier",
            local: {
              type: "Identifier",
              name: "local1"},
            exported: {
              type: "Identifier",
              name: "exported1"}},
          {
            type: "ExportSpecifier",
            local: {
              type: "Identifier",
              name: "local2"},
            exported: {
              type: "Identifier",
              name: "exported2"}}]}],
    ` export exported1;
      export exported2;`);

  test(
    `export let x;`,
    `export x;`);

  test(
    `export function f () {}`,
    `export f;`);

});
