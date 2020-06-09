"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Completion = require("./completion.js");
const Scope = require("./scope/index.js");
const Tree = require("./lang.js");
const State = require("./state.js");
const Parser = require("../test/parser/index.js");
const Acorn = require("acorn");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};

State._run_session({nodes: [], serials: new Map, scopes: {__proto__:null}}, [], () => {
  Scope.EXTEND_STATIC(null, {__proto__:null}, (scope) => {
    return Scope.Box(scope, "x", false, Tree.primitive(123), (box) => {
      // _is_arrow //
      Assert.deepEqual(Completion._is_arrow(Completion._make_arrow()), true);
      Assert.deepEqual(Completion._is_arrow(Completion._make_function()), false);
      // _is_function //
      Assert.deepEqual(Completion._is_function(Completion._make_arrow()), false);
      Assert.deepEqual(Completion._is_function(Completion._make_function()), true);
      // _get_box //
      Assert.deepEqual(Completion._get_box(Completion._make_program(box)), box);
      Assert.throws(() => Completion._get_box(Completion._make_arrow()), new Error("Cannot get the box of a non full program completion"));
      // _is_last //
      Assert.deepEqual(Completion._is_last(Completion._make_arrow()), false);
      Assert.deepEqual(Completion._is_last(Completion._make_program(box)), true);
      // _register_label //
      Assert.deepEqual(Completion._register_label(Completion._make_arrow()), Completion._make_arrow());
      Assert.notDeepEqual(Completion._register_label(Completion._make_program(box)), Completion._make_program(box));
      Assert.deepEqual(
        Completion._register_label(Completion._extend(Completion._make_program(box), Acorn.parse(`123; 456;`).body, 0), "l"),
        Completion._extend(Completion._make_program(box), Acorn.parse(`123; 456;`).body, 0));
      // _extend //
      Assert.throws(() => Completion._extend(Completion._make_arrow(), Acorn.parse(`123;`).body, -1), new Error("Out-of-range offset"));
      Assert.throws(() => Completion._extend(Completion._make_arrow(), Acorn.parse(`123;`).body, 1), new Error("Out-of-range offset"));
      Assert.deepEqual(Completion._extend(Completion._make_arrow(), Acorn.parse(`123;`).body, 0), Completion._make_arrow());
      Assert.deepEqual(Completion._extend(Completion._make_program(box), Acorn.parse(`var x;`).body, 0), Completion._make_program(null));
      Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make_program(box), Acorn.parse(`123; 456;`).body, 0)), false);
      Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make_program(box), Acorn.parse(`123; var x;`).body, 0)), true);
      Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make_program(box), "l"), Acorn.parse(`k: { 123; break k; }`).body[0].body.body, 0)), false);
      Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make_program(box), "l"), Acorn.parse(`l: { 123; break l; }`).body[0].body.body, 0)), true);
      // return //
      return Tree.Bundle([]);
    });
  });
});