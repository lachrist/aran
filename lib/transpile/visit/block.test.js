"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ParseExternal = require("../../parse-external.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Completion = require("../completion.js");
const Scope = require("../scope");
const Visit = require("./index.js");

Visit.initializeTest(
  [
    require("./other.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./link-statement.js"),
    require("./hoisted-statement.js"),
    require("./statement.js"),
    require("./block.js")]);

State.runSession({nodes:[], serials:new Map(), evals:{__proto__:null}}, () => {

  // // PROGRAM >> Empty //
  // Lang.match(
  //   Visit.visitProgram(
  //     Scope.RootScope({strict:true}),
  //     ParseExternal(
  //       ``,
  //       {source:"script"}),
  //     {source:"script"}),
  //   Lang.parseProgram(`{
  //     let $this;
  //     $this = #aran.globalObjectRecord;
  //     completion void 0; }`),
  //   Assert);

  // PROGRAM >> Module //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope({strict:true}),
      ParseExternal(
        `
          !i;
          export function f () { 123; };
          import * as i from "source";`,
        {source:"module"}),
      {source:"module"}),
    Lang.parseProgram(`
      module;
      export f;
      import * from "source";
      {
        let $this, $f, _prototype;
        (
          $f = void 0,
          export f $f);
        $this = #aran.globalObjectRecord;
        (
          $f = (
            _prototype = {__proto__:#Object.prototype},
            ${Lang.generate(
              Visit.visitClosure(
                Scope.RootScope({strict:true}),
                ParseExternal(`(function f () { 123; })`).body[0].expression,
                {prototype:Scope.TestBox("_prototype")}))}),
          export f $f);
        !import * from "source";
        completion void 0; }`),
    Assert);

  // PROGRAM >> Eval (global) //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope({strict:true}),
      ParseExternal(`
        123;
        foo: bar: function f () { 456; };
        789;`),
      {source:null}),
    Lang.parseProgram(`
      eval;
      {
        let $this, $f, _completion, _prototype;
        $f = void 0;
        _completion = void 0;
        $this = #aran.globalObjectRecord;
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang.generate(
            Visit.visitClosure(
              Scope.RootScope({strict:true}),
              ParseExternal(`(function f () { 456; })`).body[0].expression,
              {prototype:Scope.TestBox("_prototype")}))});
        123;
        _completion = 789;
        completion _completion; }`),
    Assert);
  
  
  // PROGRAM >> Eval (Local) //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope({strict:true}),
      ParseExternal(`
        123;`),
      {source:["$x", "$y"]}),
    Lang.parseProgram(`
      eval §$x §$y;
      {
        let _completion;
        _completion = void 0;
        _completion = 123;
        completion _completion; }`),
    Assert);

  // PROGRAM >> Script //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope(),
      ParseExternal(`
        "use strict";
        123;
        debugger;`),
      {source:"script"}),
    Lang.parseProgram(`
      script;
      {
        let $this, _completion;
        _completion = void 0;
        $this = #aran.globalObjectRecord;
        "use strict";
        _completion = 123;
        debugger;
        completion _completion; }`),
    Assert);

  // Block >> node.type === BlockStatement && Hoisting //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope({strict:true}),
      ParseExternal(`{
        123;
        function f () { 456; } }`),
      {source:null}),
    Lang.parseProgram(`
      eval;
      {
        let $this, $f, _completion;
        $f = void 0;
        _completion = void 0;
        $this = #aran.globalObjectRecord;
        {
          let _prototype;
          $f = (
            _prototype = {__proto__:#Object.prototype},
            ${Lang.generate(
              Visit.visitClosure(
                Scope.RootScope({strict:true}),
                ParseExternal(`(function f () { 456; })`).body[0].expression,
                {prototype:Scope.TestBox("_prototype")}))});
          _completion = 123;
          completion void 0; }
        completion _completion; }`),
    Assert);

  // Block >> node.type !== BlockStatement && context.with !== null //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope(),
      ParseExternal(`with (123) 456;`),
      {source:"script"}),
    Lang.parseProgram(`
      script;
      {
        let $this, _completion, _frame;
        _completion = void 0;
        $this = #aran.globalObjectRecord;
        _completion = void 0;
        _frame = 123;
        _frame = (
          (
            (_frame === null) ?
            true :
            (_frame === void 0)) ?
          throw new #TypeError("Cannot convert undefined or null to object") :
          #Object(_frame));
        {
          _completion = 456;
          completion void 0; }
        completion _completion; }`),
    Assert);

  // Block >> reset === true //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope(),
      ParseExternal(`try { 123; } catch { 456; }`),
      {source:"script"}),
    Lang.parseProgram(`
      script;
      {
        let $this, _completion;
        _completion = void 0;
        $this = #aran.globalObjectRecord;
        _completion = void 0;
        try {
          _completion = 123;
          completion void 0; }
        catch {
          _completion = void 0;
          _completion = 456;
          completion void 0; }
        finally {
          completion void 0; }
        completion _completion; }`),
    Assert);

  // CLOSURE_BODY >> node.type !== "BlockStatement" //
  Lang.match(
    Visit.visitClosureBody(
      Scope.RootScope(),
      ParseExternal(`123;`).body[0].expression,
      {bindings:[]}),
    Lang.parseBlock(`{
      return 123;
      completion void 0; }`),
    Assert);

  // CLOSURE_BODY >> dynamic //
    Lang.match(
      Visit.visitClosureBody(
        Scope.RootScope(),
        ParseExternal(`eval(123);`).body[0].expression,
        {bindings:[]}),
      Lang.parseBlock(`{
        let _frame, _eval;
        _frame = {__proto__:null};
        return (
          _eval = (
            #Reflect.has(_frame, "eval") ?
            #Reflect.get(_frame, "eval") :
             throw new #ReferenceError("Cannot read from missing variable eval")),
          (
            (_eval === #eval) ?
            eval §_frame §_eval 123 :
            _eval(123)));
        completion void 0; }`),
      Assert);

  // CLOSURE_BODY >> bindings //
    Lang.match(
      Visit.visitClosureBody(
        Scope.RootScope(),
        ParseExternal(`{ var x = 123, y = 456; function f () { 789 } }`).body[0],
        {
          bindings: [
            {
              identifier: "x",
              box: Scope.PrimitiveBox("x-value")},
            {
              identifier: "y",
              box: Scope.PrimitiveBox("y-value")}]}),
      Lang.parseBlock(`{
        let $x, $y, $f, _prototype;
        $x = void 0;
        $y = void 0;
        $f = void 0;
        $x = "x-value";
        $y = "y-value";
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang.generate(
            Visit.visitClosure(
              Scope.RootScope(),
              ParseExternal(`(function f () { 789; })`).body[0].expression,
              {prototype:Scope.TestBox("_prototype")}))});
        $x = 123;
        $y = 456;
        completion void 0; }`),
      Assert);

  // SWITCH //
  Lang.match(
    Visit.visitProgram(
      Scope.RootScope({strict:true}),
      ParseExternal(
        `
          switch (!1) {
            case 2:
              3;
              let x = 4;
              function f () { 5; }
            default:
              x;
              6; }`),
      {source:null}),
    Lang.parseProgram(`
      eval;
      {
        let $this, $f, _completion, _discriminant, _matched;
        $f = void 0;
        _completion = void 0;
        $this = #aran.globalObjectRecord;
        _completion = void 0;
        _discriminant = !1;
        _matched = false;
        $: {
          let $x, _x, _prototype;
          _x = false;
          $f = (
            _prototype = {__proto__:#Object.prototype},
            ${Lang.generate(
              Visit.visitClosure(
                Scope.RootScope({strict:true}),
                ParseExternal(`(function f () { 5; })`).body[0].expression,
                {prototype:Scope.TestBox("_prototype")}))});
          if (
            (
              _matched ?
              true :
              (
                (_discriminant === 2) ?
                (
                  _matched = true,
                  true) :
                false)))
            {
              3;
              ($x = 4, _x = true);
              completion void 0; } else
            {
              completion void 0; }
          _matched = true;
          {
            (
              _x ?
              $x :
              throw new #ReferenceError("Cannot read from non-initialized static variable named x"));
            _completion = 6;
            completion void 0; }
          completion void 0; }
        completion _completion; }`),
    Assert);

});
