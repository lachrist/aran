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

Visit._test_init(
  [
    require("./other.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./prelude-statement.js"),
    require("./hoisted-statement.js"),
    require("./statement.js"),
    require("./block.js")]);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // PROGRAM >> Empty //
  Lang._match(
    Visit._program(
      Scope._make_root({strict:true}),
      ParseExternal(
        ``,
        {source:"script"}),
      {source:"script"}),
    Lang.parseProgram(`{
      let $this;
      $this = #aran.globalObjectRecord;
      return void 0; }`),
    Assert);

  // PROGRAM >> Module //
  Lang._match(
    Visit._program(
      Scope._make_root({strict:true}),
      ParseExternal(
        `
          !i;
          export function f () { 123; };
          import * as i from "source";`,
        {source:"module"}),
      {source:"module"}),
    Lang.parseProgram(`
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
              Visit.closure(
                Scope._make_root({strict:true}),
                ParseExternal(`(function f () { 123; })`).body[0].expression,
                {prototype:Scope._test_box("_prototype")}))}),
          export f $f);
        !import * from "source"; }`),
    Assert);

  // PROGRAM >> Eval //
  Lang._match(
    Visit._program(
      Scope._make_root({strict:true}),
      ParseExternal(`
        123;
        foo: bar: function f () { 456; };
        789;`),
      {source:"eval", local:true}),
    Lang.parseProgram(`{
      let $f, _prototype;
      $f = void 0;
      $f = (
        _prototype = {__proto__:#Object.prototype},
        ${Lang.generate(
          Visit.closure(
            Scope._make_root({strict:true}),
            ParseExternal(`(function f () { 456; })`).body[0].expression,
            {prototype:Scope._test_box("_prototype")}))});
      123;
      return 789; }`),
    Assert);

  // PROGRAM >> Script //
  Lang._match(
    Visit._program(
      Scope._make_root(),
      ParseExternal(`
        "use strict";
        123;
        debugger;`),
      {source:"script"}),
    Lang.parseProgram(`{
      let $this, _completion;
      _completion = void 0;
      $this = #aran.globalObjectRecord;
      "use strict";
      _completion = 123;
      debugger;
      return _completion; }`),
    Assert);

  // Block >> node.type === BlockStatement && Hoisting //
  Lang._match(
    Visit._program(
      Scope._make_root({strict:true}),
      ParseExternal(`{
        123;
        function f () { 456; } }`),
      {source:"eval"}),
    Lang.parseProgram(`{
      let $this, _completion, $f;
      $f = void 0;
      _completion = void 0;
      $this = #aran.globalObjectRecord;
      {
        let _prototype;
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang.generate(
            Visit.closure(
              Scope._make_root({strict:true}),
              ParseExternal(`(function f () { 456; })`).body[0].expression,
              {prototype:Scope._test_box("_prototype")}))});
        _completion = 123; }
      return _completion; }`),
    Assert);

  // Block >> node.type !== BlockStatement && context.with !== null //
  Lang._match(
    Visit._program(
      Scope._make_root(),
      ParseExternal(`with (123) 456;`),
      {source:"script"}),
    Lang.parseProgram(`{
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
        _completion = 456; }
      return _completion; }`),
    Assert);

  // Block >> reset === true //
  Lang._match(
    Visit._program(
      Scope._make_root(),
      ParseExternal(`try { 123; } catch { 456; }`),
      {source:"script"}),
    Lang.parseProgram(`{
      let $this, _completion;
      _completion = void 0;
      $this = #aran.globalObjectRecord;
      _completion = void 0;
      try {
        _completion = 123; }
      catch {
        _completion = void 0;
        _completion = 456; }
      finally {}
      return _completion; }`),
    Assert);

  // CLOSURE_BODY >> node.type !== "BlockStatement" //
  Lang._match(
    Visit.CLOSURE_BODY(
      Scope._make_root(),
      ParseExternal(`123;`).body[0].expression,
      {bindings:[]}),
    Lang.parseBlock(`{
      return 123; }`),
    Assert);

  // CLOSURE_BODY >> dynamic //
    Lang._match(
      Visit.CLOSURE_BODY(
        Scope._make_root(),
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
            eval(123) :
            _eval(123))); }`),
      Assert);

  // CLOSURE_BODY >> bindings //
    Lang._match(
      Visit.CLOSURE_BODY(
        Scope._make_root(),
        ParseExternal(`{ var x = 123, y = 456; function f () { 789 } }`).body[0],
        {
          bindings: [
            {
              identifier: "x",
              box: Scope._primitive_box("x-value")},
            {
              identifier: "y",
              box: Scope._primitive_box("y-value")}]}),
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
            Visit.closure(
              Scope._make_root(),
              ParseExternal(`(function f () { 789; })`).body[0].expression,
              {prototype:Scope._test_box("_prototype")}))});
        $x = 123;
        $y = 456; }`),
      Assert);

  // SWITCH //
  Lang._match(
    Visit._program(
      Scope._make_root({strict:true}),
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
      {source:"eval"}),
    Lang.parseProgram(
      `{
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
              Visit.closure(
                Scope._make_root({strict:true}),
                ParseExternal(`(function f () { 5; })`).body[0].expression,
                {prototype:Scope._test_box("_prototype")}))});
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
            ($x = 4, _x = true); }
          else {}
          _matched = true;
          {
            (
              _x ?
              $x :
              throw new #ReferenceError("Cannot read from non-initialized static variable named x"));
            _completion = 6; } }
        return _completion; }`),
    Assert);

});
