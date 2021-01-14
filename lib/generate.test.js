"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

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
  prefix: "X",
  newline: "\n    ",
  indent: "  ",
  IntrinsicExpression: "__aran__",
  output: "code",
  namespace: {
    ["actual-callee"]: "CALLEE",
    IntrinsicExpression: "INTRINSIC",
    arguments: "ARGUMENTS",
    error: "ERROR",
    ExportExpression: "EXPORT",
    ImportExpression: "IMPORT"},
  generate: {
    identifier: (identifier) => `$${identifier}`,
    label: (label) => `_${label}`,
    ApplyExpression: (expression1, expression2, expressions, code1, code2, codes) => null,
    ConstructExpression: (expression, expressions, code, codes) => null}};

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
    ParseExternal(code, {
      source:options.source,
      context: options.source === "eval" ? options.context : null})));

// Program //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block([], [], [])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null}; }) ());`);
test(
  {
    source: "eval",
    context: null,
    local: true},
  Tree.Program(
    [],
    Tree.Block([], [], [])),
  `
    "use strict"; ((() =>
      { let X$input; X$input = {__proto__:null}; }) ());`);

// Prelude //
test(
  {source:"module"},
  Tree.Program(
    [
      Tree.ImportLink(null, "a"),
      Tree.ImportLink("spc1", "b"),
      Tree.ExportLink("spc2"),
      Tree.AggregateLink(null, "c", null),
      Tree.AggregateLink("spc3", "d", "spc4")],
    Tree.Block([], [], [])),
  `
    "use strict"; let XEXPORT_spc2;
      import * as XIMPORT_0_0061 from "a";
      import {spc1 as XIMPORT_spc1_0062} from "b";
      export {XEXPORT_spc2 as spc2};
      export * from "c";
      export {spc3 as spc4} from "d"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null}; }) ());`);

// Atomic Statement //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(123)),
        Tree.DebuggerStatement(),
        Tree.WhileStatement(
          Tree.PrimitiveExpression("test"),
          Tree.Block(
            ["k", "l"],
            [],
            [
              Tree.BreakStatement("k")])),
        Tree.ReturnStatement(
          Tree.PrimitiveExpression(456))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null};
        123;
        debugger;
        while (
          "test")
          { _k: _l: { let X$input; X$input = {__proto__:null};
            break _k; } }
        return (
          456); }) ());`);

// Compount Statement //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.BranchStatement(
          Tree.Block(["lone_label"], ["lone_identifier"], [])),
        Tree.IfStatement(
          Tree.PrimitiveExpression(123),
          Tree.Block(["then_label"], ["then_identifier"], []),
          Tree.Block(["else_label"], ["else_identifier"], [])),
        Tree.WhileStatement(
          Tree.PrimitiveExpression(456),
          Tree.Block(["do_label"], ["do_identifier"], [])),
        Tree.TryStatement(
          Tree.Block(["try_label"], ["try_identifier"], []),
          Tree.Block(["catch_label"], ["catch_identifier"], []),
          Tree.Block(["finally_label"], ["finally_identifier"], []))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null};
        { _lone_label: { let X$input, X$lone_identifier; X$input = {__proto__:null}; } }
        if (
          123)
          { _then_label: { let X$input, X$then_identifier; X$input = {__proto__:null}; } }
          else { _else_label: { let X$input, X$else_identifier; X$input = {__proto__:null}; } }
        while (
          456)
          { _do_label: { let X$input, X$do_identifier; X$input = {__proto__:null}; } }
        try
          { _try_label: { let X$input, X$try_identifier; X$input = {__proto__:null}; } }
          catch (XERROR) { _catch_label: { let X$input, X$catch_identifier; X$input = {__proto__:null, error:XERROR}; } }
          finally { _finally_label: { let X$input, X$finally_identifier; X$input = {__proto__:null}; } } }) ());`);

// Literal Expression //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(void 0)),
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(null)),
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(true)),
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(false)),
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(123)),
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(456n)),
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression("foo")),
        Tree.ExpressionStatement(
          Tree.IntrinsicExpression("Reflect.get")),
        Tree.ExpressionStatement(
          Tree.ApplyExpression(
            Tree.IntrinsicExpression("global"),
            Tree.PrimitiveExpression(void 0),
            [])),
        Tree.ExpressionStatement(
          Tree.ClosureExpression(
            "arrow",
            false,
            false,
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.PrimitiveExpression("arrow"))]))),
        Tree.ExpressionStatement(
          Tree.ClosureExpression(
            "method",
            false,
            false,
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.PrimitiveExpression("method"))]))),
        Tree.ExpressionStatement(
          Tree.ClosureExpression(
            "constructor",
            false,
            false,
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.PrimitiveExpression("constructor"))]))),
        Tree.ExpressionStatement(
          Tree.ClosureExpression(
            "function",
            false,
            false,
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.PrimitiveExpression("function"))]))),
        Tree.ExpressionStatement(
          Tree.ClosureExpression(
            "arrow",
            false,
            false,
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.ApplyExpression(
                    Tree.IntrinsicExpression("Reflect.set"),
                    Tree.PrimitiveExpression(void 0),
                    [
                      Tree.ReadExpression("input"),
                      Tree.PrimitiveExpression("callee"),
                      Tree.ReadExpression("XCALLEE")]))]))),
        Tree.ExpressionStatement(
          Tree.ApplyExpression(
            Tree.ClosureExpression(
              "method",
              false,
              false,
              Tree.Block(
                [],
                [],
                [
                  Tree.ExpressionStatement(
                    Tree.ApplyExpression(
                      Tree.IntrinsicExpression("Reflect.set"),
                      Tree.PrimitiveExpression(void 0),
                      [
                        Tree.ReadExpression("input"),
                        Tree.PrimitiveExpression("callee"),
                        Tree.ReadExpression("XCALLEE")]))])),
            Tree.PrimitiveExpression(void 0),
            []))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input, XCALLEE_0, XCALLEE_1, XCALLEE_2, XCALLEE_3; X$input = {__proto__:null};
        (void 0);
        null;
        true;
        false;
        123;
        456n;
        "foo";
        (XINTRINSIC["Reflect.get"]);
        (
          (null, XINTRINSIC["global"]) ());
        (XCALLEE_0 = (...XARGUMENTS) =>
          { let X$input; X$input = {__proto__:null, callee:XCALLEE_0, arguments:XARGUMENTS};
            "arrow"; });
        (XCALLEE_1 = ({method (...XARGUMENTS)
          { let X$input; X$input = {__proto__:null, callee:XCALLEE_1, arguments:XARGUMENTS, this:this};
            "method"; }}).method);
        (XCALLEE_2 = function (...XARGUMENTS)
          { let X$input; X$input = {__proto__:null, callee:XCALLEE_2, arguments:XARGUMENTS, "new.target":new.target};
            "constructor"; });
        (XCALLEE_3 = function (...XARGUMENTS)
          { let X$input; X$input = {__proto__:null, callee:XCALLEE_3, arguments:XARGUMENTS, this:this, "new.target":new.target};
            "function"; });
        ((...XARGUMENTS) =>
          { let X$input; X$input = {__proto__:null, callee:null, arguments:XARGUMENTS};
            (
              (null, XINTRINSIC["Reflect.set"]) (
              X$input,
              "callee",
              X$XCALLEE)); });
        (
          (null, ({method (...XARGUMENTS)
            { let X$input; X$input = {__proto__:null, callee:null, arguments:XARGUMENTS, this:this};
              (
                (null, XINTRINSIC["Reflect.set"]) (
                X$input,
                "callee",
                X$XCALLEE)); }}).method) ()); }) ());`);

// Environment Expression //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.ReadExpression("read_identifier")),
        Tree.ExpressionStatement(
          Tree.WriteExpression(
            "write_dropped_identifier",
            Tree.PrimitiveExpression("write-dropped-value"))),
        Tree.ExpressionStatement(
          Tree.UnaryExpression(
            "!",
            Tree.WriteExpression(
              "write_used_identifier",
              Tree.PrimitiveExpression("write-used-value")))),
        Tree.ExpressionStatement(
          Tree.EvalExpression(
            Tree.PrimitiveExpression("eval-value"))),
        Tree.ExpressionStatement(
          Tree.RequireExpression(
            Tree.PrimitiveExpression("require-value"))),
        Tree.ExpressionStatement(
          Tree.ImportExpression(null, "a")),
        Tree.ExpressionStatement(
          Tree.ImportExpression("import_specifier", "b")),
        Tree.ExpressionStatement(
          Tree.ExportExpression(
            "export_dropped_specifier",
            Tree.PrimitiveExpression("export-dropped-value"))),
        Tree.ExpressionStatement(
          Tree.UnaryExpression(
            "!",
            Tree.ExportExpression(
              "export_used_specifier",
              Tree.PrimitiveExpression("export-used-value"))))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null};
        X$read_identifier;
        (X$write_dropped_identifier =
          "write-dropped-value");
        (!
          (X$write_used_identifier =
            "write-used-value", void 0));
        eval(
          "eval-value");
        import(
          "require-value");
        XIMPORT_0_0061;
        XIMPORTImportLink_specifier_0062;
        (XEXPORTExportLink_dropped_specifier =
          "export-dropped-value");
        (!
          (XEXPORTExportLink_used_specifier =
            "export-used-value", void 0)); }) ());`);

// Control Expression //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.UnaryExpression(
            "!",
            Tree.ConditionalExpression(
              Tree.WriteExpression(
                "conditional_test",
                Tree.PrimitiveExpression("conditional-test")),
              Tree.WriteExpression(
                "conditional_consequent",
                Tree.PrimitiveExpression("conditional-consequent")),
              Tree.WriteExpression(
                "conditional_alternate",
                Tree.PrimitiveExpression("conditional-alternate"))))),
        Tree.ExpressionStatement(
          Tree.ConditionalExpression(
            Tree.WriteExpression(
              "conditional_dropped_test",
              Tree.PrimitiveExpression("conditional-dropped-test")),
            Tree.WriteExpression(
              "conditional_dropped_consequent",
              Tree.PrimitiveExpression("conditional-dropped-consequent")),
            Tree.WriteExpression(
              "conditional_dropped_alternate",
              Tree.PrimitiveExpression("conditional-dropped-alternate")))),
        Tree.ExpressionStatement(
          Tree.UnaryExpression(
            "!",
            Tree.SequenceExpression(
              Tree.WriteExpression(
                "sequence_first",
                Tree.PrimitiveExpression("sequence-first")),
              Tree.WriteExpression(
                "sequence_second",
                Tree.PrimitiveExpression("sequence-second"))))),
        Tree.ExpressionStatement(
          Tree.SequenceExpression(
            Tree.WriteExpression(
              "sequence_dropped_first",
              Tree.PrimitiveExpression("sequence-dropped-first")),
            Tree.WriteExpression(
              "sequence_dropped_second",
              Tree.PrimitiveExpression("sequence-dropped-second")))),
        Tree.ExpressionStatement(
          Tree.ThrowExpression(
            Tree.PrimitiveExpression("throw-argument"))),
        Tree.ExpressionStatement(
          Tree.ClosureExpression(
            "function",
            true,
            true,
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.YieldExpression(
                    true,
                    Tree.PrimitiveExpression("yield-argument-1"))),
                Tree.ExpressionStatement(
                  Tree.YieldExpression(
                    false,
                    Tree.PrimitiveExpression("yield-argument-2"))),
                Tree.ExpressionStatement(
                  Tree.AwaitExpression(
                    Tree.PrimitiveExpression("await-argument")))])))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input, XCALLEE_0; X$input = {__proto__:null};
        (!
          (
            (X$conditional_test =
              "conditional-test", void 0) ?
            (X$conditional_consequent =
              "conditional-consequent", void 0) :
            (X$conditional_alternate =
              "conditional-alternate", void 0)));
        (
          (X$conditional_dropped_test =
            "conditional-dropped-test", void 0) ?
          (X$conditional_dropped_consequent =
            "conditional-dropped-consequent") :
          (X$conditional_dropped_alternate =
            "conditional-dropped-alternate"));
        (!
          (
            (X$sequence_first =
              "sequence-first"),
            (X$sequence_second =
              "sequence-second", void 0)));
        (
          (X$sequence_dropped_first =
            "sequence-dropped-first"),
          (X$sequence_dropped_second =
            "sequence-dropped-second"));
        ((() => { throw (
          "throw-argument"); }) ());
        (XCALLEE_0 = async function* (...XARGUMENTS)
          { let X$input; X$input = {__proto__:null, callee:XCALLEE_0, arguments:XARGUMENTS, this:this, "new.target":new.target};
            (yield*(
              "yield-argument-1"));
            (yield(
              "yield-argument-2"));
            (await
              "await-argument"); }); }) ());`);

// Combination Expression //
test(
  {source:"module"},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.UnaryExpression(
            "!",
            Tree.PrimitiveExpression("unary-argument"))),
        Tree.ExpressionStatement(
          Tree.BinaryExpression(
            "+",
            Tree.PrimitiveExpression("binary-left"),
            Tree.PrimitiveExpression("binary-right"))),
        Tree.ExpressionStatement(
          Tree.ObjectExpression(
            Tree.PrimitiveExpression("object-prototype"),
            [
              [
                Tree.PrimitiveExpression("object-key-1"),
                Tree.PrimitiveExpression("object-value-1")],
              [
                Tree.PrimitiveExpression("object-key-2"),
                Tree.PrimitiveExpression("object-value-2")]])),
        Tree.ExpressionStatement(
          Tree.ConstructExpression(
            Tree.PrimitiveExpression("construct-callee"),
            [
              Tree.PrimitiveExpression("construct-argument-1"),
              Tree.PrimitiveExpression("construct-argument-2")])),
        Tree.ExpressionStatement(
          Tree.ApplyExpression(
            Tree.PrimitiveExpression("apply-normal-callee"),
            Tree.PrimitiveExpression("apply-normal-this"),
            [
              Tree.PrimitiveExpression("apply-normal-argument-1"),
              Tree.PrimitiveExpression("apply-normal-argument-2")])),
        Tree.ExpressionStatement(
          Tree.ApplyExpression(
            Tree.PrimitiveExpression("apply-simple-callee"),
            Tree.PrimitiveExpression(void 0),
            [
              Tree.PrimitiveExpression("apply-simple-argument-1"),
              Tree.PrimitiveExpression("apply-simple-argument-2")]))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null};
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
        (XINTRINSIC["Reflect.apply"](
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
      ApplyExpression: (expression1, expression2, expressions, result1, result2, results) => (
        typeof result1 === "string" ?
        `(${ArrayLite.join(ArrayLite.concat([result1, result2], results), ",")})` :
        {
          type: "SequenceExpression",
          expressions: ArrayLite.concat([result1, result2], results)}),
      ConstructExpression: (expression, expressions, result, results) => (
        typeof result === "string" ?
        `(${ArrayLite.join(ArrayLite.concat([result], results), ",")})` :
        {
          type: "SequenceExpression",
          expressions: ArrayLite.concat([result], results)})}},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.ApplyExpression(
            Tree.PrimitiveExpression("apply-callee"),
            Tree.PrimitiveExpression("apply-this"),
            [Tree.PrimitiveExpression("apply-argument")])),
        Tree.ExpressionStatement(
          Tree.ConstructExpression(
            Tree.PrimitiveExpression("construct-callee"),
            [
              Tree.PrimitiveExpression("construct-argument")]))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null};
        (
          "apply-callee",
          "apply-this",
          "apply-argument");
        (
          "construct-callee",
          "construct-argument"); }) ());`);

// Enclave //
test(
  {
    source: "eval",
    context: {
      strict: true,
      sort: "derived-constructor"}},
  Tree.Program(
    [],
    Tree.Block(
      [],
      [],
      [
        Tree.ExpressionStatement(
          Tree.EnclaveReadExpression("x")),
        Tree.ExpressionStatement(
          Tree.TypeofEnclaveExpression("y")),
        Tree.ExpressionStatement(
          Tree.WriteEnclaveExpression(
            true,
            "z",
            Tree.PrimitiveExpression(123))),
        Tree.ExpressionStatement(
          Tree.WriteEnclaveExpression(
            false,
            "t",
            Tree.PrimitiveExpression(456))),
        Tree.ExpressionStatement(
          Tree.SuperMemberEnclaveExpression(
            Tree.PrimitiveExpression("foo"))),
        Tree.ExpressionStatement(
          Tree.SuperCallEnclaveExpression(
            Tree.PrimitiveExpression("bar"))),
        Tree.EnclaveDeclare(
          "let",
          "z",
          Tree.PrimitiveExpression(789))])),
  `
    "use strict"; ((() =>
      { const XINTRINSIC = __aran__; let X$input; X$input = {__proto__:null};
        x;
        typeof y;
        (z =
          123);
        (((X$input) => { try { t = X$input; } catch (XERROR) { if (XERROR instanceof XINTRINSIC.ReferenceError) XINTRINSIC["aran.globalObjectRecord"].t = X$input; else throw XERROR; } }) (
          456));
        super[
          "foo"];
        super(...
          "bar");
        let z =
          789; }) ());`);
