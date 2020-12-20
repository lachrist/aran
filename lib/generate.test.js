"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

require("colors");
const Util = require("util");
const Escodegen = require("escodegen");
const ArrayLite = require("array-lite");
const Diff = require("diff");
const ParseExternal = require("./parse-external.js");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Generate = require("./generate.js");

const diff_estree_loop = (path, node1, node2) => {
  if (global.Array.isArray(node1)) {
    Assert.ok(global.Array.isArray(node2), `${path} >> array mismatch`);
    Assert.deepEqual(node1.length, node2.length, `${path} >> length mismatch`);
    for (let index = 0; index < node1.length; index++) {
      diff_estree_loop(`${path}[${index}]`, node1[index], node2[index]);
    }
  } else if (typeof node1 === "object" && node1 !== null) {
    Assert.ok(typeof node2 === "object" && node2 !== null, `${path} >> object mismatch`);
    for (let key of global.Reflect.ownKeys(node1)) {
      Assert.ok(global.Reflect.getOwnPropertyDescriptor(node2, key) !== void 0, `${path} >> key ${key} missing`);
      diff_estree_loop(`${path}.${key}`, node1[key], node2[key]);
    }
  } else {
    Assert.equal(node1, node2, `${path} >> primitive mismatch`);
  }
};

const diff_estree = (node1, node2) => {
  try {
    diff_estree_loop("root", node1, node2);
  } catch (error) {
    if (error.name !== "AssertionError") {
      throw error;
    }
    console.log(error.stack);
    const code1 = Escodegen.generate(node1);
    const code2 = Escodegen.generate(node2);
    diff_code("estree", code1, code2);
  }
}

const diff_code = (kind, code1, code2) => {
  if (code1 !== code2) {
    console.log(kind);
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

const default_options = {
  __proto__: null,
  source: "script",
  local: false,
  newline: "\n    ",
  indent: "  ",
  intrinsic: "__aran__",
  output: "code",
  namespace: {
    ["actual-callee"]: "CALLEE",
    intrinsic: "INTRINSIC",
    arguments: "ARGUMENTS",
    error: "ERROR",
    export: "EXPORT",
    import: "IMPORT"},
  generate: {
    identifier: (identifier) => `$${identifier}`,
    label: (label) => `_${label}`,
    apply: (expression1, expression2, expressions, code1, code2, codes) => null,
    construct: (expression, expressions, code, codes) => null}};

const test = (options, program, code) => (
  diff_code(
    "code",
    Generate(
      program,
      global.Object.assign(
        {__proto__:null},
        default_options,
        options)),
    code),
  diff_estree(
    Generate(
      program,
      global.Object.assign(
        {__proto__:null},
        default_options,
        options,
        {output:"estree"})),
    ParseExternal(code, {source:options.source})));

// Program //
test(
  {source:"module"},
  Tree._program(
    [],
    Tree.BLOCK([], [])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null}; }) ());`);
test(
  {
    source: "eval",
    local: true},
  Tree._program(
    [],
    Tree.BLOCK([], [])),
  `
    "use strict"; ((() =>
      { let $input; $input = {__proto__:null}; }) ());`);

// Prelude //
test(
  {source:"module"},
  Tree._program(
    [
      Tree._import(null, "a"),
      Tree._import("spc1", "b"),
      Tree._export("spc2"),
      Tree._aggregate(null, "c", null),
      Tree._aggregate("spc3", "d", "spc4")],
    Tree.BLOCK([], [])),
  `
    "use strict"; let EXPORT_spc2;
      import * as IMPORT_0_0061 from "a";
      import {spc1 as IMPORT_spc1_0062} from "b";
      export {EXPORT_spc2 as spc2};
      export * from "c";
      export {spc3 as spc4} from "d"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null}; }) ());`);

// Atomic Statement //
test(
  {source:"module"},
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.primitive(123)),
        Tree.Debugger(),
        Tree.While(
          ["k", "l"],
          Tree.primitive("test"),
          Tree.BLOCK(
            [],
            [
              Tree.Break("k"),
              Tree.Continue("l")])),
        Tree.Return(
          Tree.primitive(456))])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
        123;
        debugger;
        _k: _l: while (
          "test")
          { let $input; $input = {__proto__:null};
            break _k;
            continue _l; }
        return (
          456); }) ());`);

// Compount Statement //
test(
  {source:"module"},
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
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
        _lone_label: /* lone */
          { let $input, $lone_identifier; $input = {__proto__:null}; }
        _if_label: if (
          123)
          { let $input, $then_identifier; $input = {__proto__:null}; }
          else { let $input, $else_identifier; $input = {__proto__:null}; }
        _while_label: while (
          456)
          { let $input, $do_identifier; $input = {__proto__:null}; }
        _try_label: try
          { let $input, $try_identifier; $input = {__proto__:null}; }
          catch (ERROR) { let $input, $catch_identifier; $input = {__proto__:null, error:ERROR}; }
          finally { let $input, $finally_identifier; $input = {__proto__:null}; } }) ());`);

// Literal Expression //
test(
  {source:"module"},
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.primitive(void 0)),
        Tree.Lift(
          Tree.primitive(null)),
        Tree.Lift(
          Tree.primitive(true)),
        Tree.Lift(
          Tree.primitive(false)),
        Tree.Lift(
          Tree.primitive(123)),
        Tree.Lift(
          Tree.primitive(456n)),
        Tree.Lift(
          Tree.primitive("foo")),
        Tree.Lift(
          Tree.intrinsic("Reflect.get")),
        Tree.Lift(
          Tree.apply(
            Tree.intrinsic("global"),
            Tree.primitive(void 0),
            [])),
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
                  Tree.primitive("function"))]))),
        Tree.Lift(
          Tree.arrow(
            Tree.BLOCK(
              [],
              [
                Tree.Lift(
                  Tree.apply(
                    Tree.intrinsic("Reflect.set"),
                    Tree.primitive(void 0),
                    [
                      Tree.read("input"),
                      Tree.primitive("callee"),
                      Tree.read("CALLEE")]))]))),
        Tree.Lift(
          Tree.apply(
            Tree.method(
              Tree.BLOCK(
                [],
                [
                  Tree.Lift(
                    Tree.apply(
                      Tree.intrinsic("Reflect.set"),
                      Tree.primitive(void 0),
                      [
                        Tree.read("input"),
                        Tree.primitive("callee"),
                        Tree.read("CALLEE")]))])),
            Tree.primitive(void 0),
            []))])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input, CALLEE_0, CALLEE_1, CALLEE_2, CALLEE_3; $input = {__proto__:null};
        (void 0);
        null;
        true;
        false;
        123;
        456n;
        "foo";
        (INTRINSIC["Reflect.get"]);
        (
          (null, INTRINSIC["global"]) ());
        (CALLEE_0 = (...ARGUMENTS) =>
          { let $input; $input = {__proto__:null, callee:CALLEE_0, arguments:ARGUMENTS};
            "arrow"; });
        (CALLEE_1 = ({ method (...ARGUMENTS)
          { let $input; $input = {__proto__:null, callee:CALLEE_1, arguments:ARGUMENTS, this:this};
            "method"; }}).method);
        (CALLEE_2 = function (...ARGUMENTS)
          { let $input; $input = {__proto__:null, callee:CALLEE_2, arguments:ARGUMENTS, "new.target":new.target};
            "constructor"; });
        (CALLEE_3 = function (...ARGUMENTS)
          { let $input; $input = {__proto__:null, callee:CALLEE_3, arguments:ARGUMENTS, this:this, "new.target":new.target};
            "function"; });
        ((...ARGUMENTS) =>
          { let $input; $input = {__proto__:null, callee:null, arguments:ARGUMENTS};
            (
              (null, INTRINSIC["Reflect.set"]) (
              $input,
              "callee",
              $CALLEE)); });
        (
          (null, ({ method (...ARGUMENTS)
            { let $input; $input = {__proto__:null, callee:null, arguments:ARGUMENTS, this:this};
              (
                (null, INTRINSIC["Reflect.set"]) (
                $input,
                "callee",
                $CALLEE)); }}).method) ()); }) ());`);

// Environment Expression //
test(
  {source:"module"},
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
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
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
        IMPORT_0_0061;
        IMPORT_import_specifier_0062;
        (EXPORT_export_dropped_specifier =
          "export-dropped-value");
        (!
          (EXPORT_export_used_specifier =
            "export-used-value", void 0)); }) ());`);

// Control Expression //
test(
  {source:"module"},
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.unary(
            "!",
            Tree.conditional(
              Tree.write(
                "conditional_test",
                Tree.primitive("conditional-test")),
              Tree.write(
                "conditional_consequent",
                Tree.primitive("conditional-consequent")),
              Tree.write(
                "conditional_alternate",
                Tree.primitive("conditional-alternate"))))),
        Tree.Lift(
          Tree.conditional(
            Tree.write(
              "conditional_dropped_test",
              Tree.primitive("conditional-dropped-test")),
            Tree.write(
              "conditional_dropped_consequent",
              Tree.primitive("conditional-dropped-consequent")),
            Tree.write(
              "conditional_dropped_alternate",
              Tree.primitive("conditional-dropped-alternate")))),
        Tree.Lift(
          Tree.unary(
            "!",
            Tree.sequence(
              Tree.write(
                "sequence_first",
                Tree.primitive("sequence-first")),
              Tree.write(
                "sequence_second",
                Tree.primitive("sequence-second"))))),
        Tree.Lift(
          Tree.sequence(
            Tree.write(
              "sequence_dropped_first",
              Tree.primitive("sequence-dropped-first")),
            Tree.write(
              "sequence_dropped_second",
              Tree.primitive("sequence-dropped-second")))),
        Tree.Lift(
          Tree.throw(
            Tree.primitive("throw-argument")))])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
        (!
          (
            ($conditional_test =
              "conditional-test", void 0) ?
            ($conditional_consequent =
              "conditional-consequent", void 0) :
            ($conditional_alternate =
              "conditional-alternate", void 0)));
        (
          ($conditional_dropped_test =
            "conditional-dropped-test", void 0) ?
          ($conditional_dropped_consequent =
            "conditional-dropped-consequent") :
          ($conditional_dropped_alternate =
            "conditional-dropped-alternate"));
        (!
          (
            ($sequence_first =
              "sequence-first"),
            ($sequence_second =
              "sequence-second", void 0)));
        (
          ($sequence_dropped_first =
            "sequence-dropped-first"),
          ($sequence_dropped_second =
            "sequence-dropped-second"));
        ((() => { throw (
          "throw-argument"); }) ()); }) ());`);

// Combination Expression //
test(
  {source:"module"},
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.unary(
            "!",
            Tree.primitive("unary-argument"))),
        Tree.Lift(
          Tree.binary(
            "+",
            Tree.primitive("binary-left"),
            Tree.primitive("binary-right"))),
        Tree.Lift(
          Tree.object(
            Tree.primitive("object-prototype"),
            [
              [
                Tree.primitive("object-key-1"),
                Tree.primitive("object-value-1")],
              [
                Tree.primitive("object-key-2"),
                Tree.primitive("object-value-2")]])),
        Tree.Lift(
          Tree.construct(
            Tree.primitive("construct-callee"),
            [
              Tree.primitive("construct-argument-1"),
              Tree.primitive("construct-argument-2")])),
        Tree.Lift(
          Tree.apply(
            Tree.primitive("apply-normal-callee"),
            Tree.primitive("apply-normal-this"),
            [
              Tree.primitive("apply-normal-argument-1"),
              Tree.primitive("apply-normal-argument-2")])),
        Tree.Lift(
          Tree.apply(
            Tree.primitive("apply-simple-callee"),
            Tree.primitive(void 0),
            [
              Tree.primitive("apply-simple-argument-1"),
              Tree.primitive("apply-simple-argument-2")]))])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
        (!
          "unary-argument");
        (
          "binary-left" +
          "binary-right");
        ({__proto__:
          "object-prototype",[
          "object-key-1"]:
          "object-value-1",[
          "object-key-2"]:
          "object-value-2"});
        (new
          "construct-callee" (
          "construct-argument-1",
          "construct-argument-2"));
        (INTRINSIC["Reflect.apply"](
          "apply-normal-callee",
          "apply-normal-this", [
          "apply-normal-argument-1",
          "apply-normal-argument-2"]));
        (
          "apply-simple-callee" (
          "apply-simple-argument-1",
          "apply-simple-argument-2")); }) ());`);

// Combination Expression (with special apply & construct) //
test(
  {
    source: "module",
    generate: {
      identifier: default_options.generate.identifier,
      label: default_options.generate.label,
      apply: (expression1, expression2, expressions, result1, result2, results) => (
        typeof result1 === "string" ?
        `(${ArrayLite.join(ArrayLite.concat([result1, result2], results), ",")})` :
        {
          type: "SequenceExpression",
          expressions: ArrayLite.concat([result1, result2], results)}),
      construct: (expression, expressions, result, results) => (
        typeof result === "string" ?
        `(${ArrayLite.join(ArrayLite.concat([result], results), ",")})` :
        {
          type: "SequenceExpression",
          expressions: ArrayLite.concat([result], results)})}},
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.apply(
            Tree.primitive("apply-callee"),
            Tree.primitive("apply-this"),
            [Tree.primitive("apply-argument")])),
        Tree.Lift(
          Tree.construct(
            Tree.primitive("construct-callee"),
            [
              Tree.primitive("construct-argument")]))])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
        (
          "apply-callee",
          "apply-this",
          "apply-argument");
        (
          "construct-callee",
          "construct-argument"); }) ());`);

// Enclave //
test(
  {source:"module"},
  Tree._program(
    [],
    Tree.BLOCK(
      [],
      [
        Tree.Lift(
          Tree.enclave_read("x")),
        Tree.Lift(
          Tree.enclave_typeof("y")),
        Tree.Lift(
          Tree.enclave_write(
            true,
            "z",
            Tree.primitive(123))),
        Tree.Lift(
          Tree.enclave_write(
            false,
            "t",
            Tree.primitive(456)))])),
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let $input; $input = {__proto__:null};
        x;
        typeof y;
        (z =
          123);
        ((($input) => { try { t = $input; } catch (ERROR) { if (ERROR instanceof INTRINSIC.ReferenceError) INTRINSIC["aran.globalObjectRecord"].t = $input; else throw ERROR; } }) (
          456)); }) ());`);
