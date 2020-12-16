"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

require("colors");
const Diff = require("diff");
const Acorn = require("acorn");
const Tree = require("./tree.js");
const Lang = require("./lang");
const GenerateCode = require("./generate-code.js");

const diff = (code1, code2) => {
  if (code1 !== code2) {
    console.log(code1);
    console.log(code2);
    const parts = Diff.diffLines(code1, code2, {ignoreWhitespace:false});
    parts.forEach((part) => {
      const color = (
        part.added ?
        "green" :
        (
          part.removed ? "red" : "grey"));
      process.stderr.write(part.value[color]);});
    process.stderr.write("\n");
    Assert.fail("Diff failing");}};

const builtin = "__aran_builtin__";
const namespace = {
  __proto__: null,
  error: "ERROR",
  builtin: "BUILTIN",
  arguments: "ARGUMENTS",
  callee: "CALLEE",
  import: "IMPORT",
  export: "EXPORT"};

const test = (local, program, code) => diff(
  GenerateCode(program, {newline:"\n    ", local}),
  code);

// Program //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK([], [])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input; $input = {__proto__:null}; }`);
test(
  true,
  Tree._program(
    [],
    Tree.BLOCK([], [])),
  `
    "use strict";
      { let $input; $input = {__proto__:null}; }`);

// Prelude //
test(
  false,
  Tree._program(
    [
      Tree._import(null, "a"),
      Tree._import("spc1", "b"),
      Tree._export("spc2"),
      Tree._aggregate(null, "c", null),
      Tree._aggregate("spc3", "d", "spc4")],
    Tree.BLOCK([], [])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      import * as IMPORT_0_FROM_0061 from "a";
      import {spc1 as IMPORT_spc1_FROM_0062} from "b";
      let EXPORT_spc2; export {EXPORT_spc2 as spc2};
      export * from "c";
      export {spc3 as spc4} from "d";
      { let $input; $input = {__proto__:null}; }`);

// Atomic Statement //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.primitive(123)),
        Tree.Debugger(),
        Tree.Break("k"),
        Tree.Continue("l"),
        Tree.Return(
          Tree.primitive(456))])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input; $input = {__proto__:null};
        123;
        debugger;
        break k;
        continue l;
        return (
          456); }`);

// Compount Statement //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lone(
          ["lone_label"],
          Tree.BLOCK(["lone_identifier"], [])),
        Tree.If(
          ["if_label"],
          Tree.primitive(123),
          Tree.BLOCK(["then_identifier"], []),
          Tree.BLOCK(["else_identifier"], [])),
        Tree.While(
          ["while_label"],
          Tree.primitive(456),
          Tree.BLOCK(["do_identifier"], [])),
        Tree.Try(
          ["try_label"],
          Tree.BLOCK(["try_identifier"], []),
          Tree.BLOCK(["catch_identifier"], []),
          Tree.BLOCK(["finally_identifier"], []))])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input; $input = {__proto__:null};
        lone_label: /* lone */
          { let $input, $lone_identifier; $input = {__proto__:null}; }
        if_label: if (
          123)
          { let $input, $then_identifier; $input = {__proto__:null}; }
          else { let $input, $else_identifier; $input = {__proto__:null}; }
        while_label: while (
          456)
          { let $input, $do_identifier; $input = {__proto__:null}; }
        try_label: try
          { let $input, $try_identifier; $input = {__proto__:null}; }
          catch (ERROR) { let $input, $catch_identifier; $input = {__proto__:null, error:ERROR}; }
          finally { let $input, $finally_identifier; $input = {__proto__:null}; } }`);

// Literal Expression //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.primitive(123)),
        Tree.Lift(
          Tree.builtin("Reflect.get")),
        Tree.Lift(
          Tree.arrow(
            Tree.BLOCK(
              [],
              [
                Tree.Lift(
                  Tree.primitive("arrow"))]))),
        Tree.Lift(
          Tree.method(
            Tree.BLOCK(
              [],
              [
                Tree.Lift(
                  Tree.primitive("method"))]))),
        Tree.Lift(
          Tree.constructor(
            Tree.BLOCK(
              [],
              [
                Tree.Lift(
                  Tree.primitive("constructor"))]))),
        Tree.Lift(
          Tree.function(
            Tree.BLOCK(
              [],
              [
                Tree.Lift(
                  Tree.primitive("function"))])))])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input, CALLEE_0, CALLEE_1, CALLEE_2, CALLEE_3; $input = {__proto__:null};
        123;
        BUILTIN["Reflect.get"];
        (CALLEE_0 = (...ARGUMENTS) =>
          { let $input; $input = {__proto__:null, callee:CALLEE_0, arguments:ARGUMENTS};
            "arrow"; }, CALLEE_0);
        (CALLEE_1 = ({ method (...ARGUMENTS)
          { let $input; $input = {__proto__:null, callee:CALLEE_1, arguments:ARGUMENTS, this:this};
            "method"; }}).method, CALLEE_1);
        (CALLEE_2 = function (...ARGUMENTS)
          { let $input; $input = {__proto__:null, callee:CALLEE_2, arguments:ARGUMENTS, "new.target":new.target};
            "constructor"; }, CALLEE_2);
        (CALLEE_3 = function (...ARGUMENTS)
          { let $input; $input = {__proto__:null, callee:CALLEE_3, arguments:ARGUMENTS, this:this, "new.target":new.target};
            "function"; }, CALLEE_3); }`);

// Environment Expression //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.read("read_identifier")),
        Tree.Lift(
          Tree.write(
            "write_dropped_identifier",
            Tree.primitive("write-dropped-value"))),
        Tree.Lift(
          Tree.unary(
            "!",
            Tree.write(
              "write_used_identifier",
              Tree.primitive("write-used-value")))),
        Tree.Lift(
          Tree.eval(
            Tree.primitive("eval-value"))),
        Tree.Lift(
          Tree.require(
            Tree.primitive("require-value"))),
        Tree.Lift(
          Tree.import(null, "a")),
        Tree.Lift(
          Tree.import("import_specifier", "b")),
        Tree.Lift(
          Tree.export(
            "export_dropped_specifier",
            Tree.primitive("export-dropped-value"))),
        Tree.Lift(
          Tree.unary(
            "!",
            Tree.export(
              "export_used_specifier",
              Tree.primitive("export-used-value"))))])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input; $input = {__proto__:null};
        $read_identifier;
        ($write_dropped_identifier =
          "write-dropped-value");
        (!
          ($write_used_identifier =
            "write-used-value", void 0));
        eval(
          "eval-value");
        import(
          "require-value");
        IMPORT_0_FROM_0061;
        IMPORT_import_specifier_FROM_0062;
        (EXPORT_export_dropped_specifier =
          "export-dropped-value");
        (!
          (EXPORT_export_used_specifier =
            "export-used-value", void 0)); }`);

// Control Expression //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.conditional(
            Tree.write(
              "conditional_test",
              Tree.primitive("conditional-test")),
            Tree.write(
              "conditional_consequent",
              Tree.primitive("conditional-consequent")),
            Tree.write(
              "conditional_alternate",
              Tree.primitive("conditional-alternate")))),
        Tree.Lift(
          Tree.sequence(
            Tree.write(
              "sequence_first",
              Tree.primitive("sequence-first")),
            Tree.write(
              "sequence_second",
              Tree.primitive("sequence-second")))),
        Tree.Lift(
          Tree.throw(
            Tree.primitive("throw-argument")))])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input; $input = {__proto__:null};
        (
          ($conditional_test =
            "conditional-test", void 0) ?
          ($conditional_consequent =
            "conditional-consequent") :
          ($conditional_alternate =
            "conditional-alternate"));
        (
          ($sequence_first =
            "sequence-first"),
          ($sequence_second =
            "sequence-second"));
        ((() => { throw
          "throw-argument"; }) ()); }`);

// Combination Expression //
test(
  false,
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [])),
  `
    "use strict"; const BUILTIN = this["__aran_builtin__"];
      { let $input; $input = {__proto__:null}; }`);
