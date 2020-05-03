"use strict";

// const Tap = require("tap");
const Core = require("./core.js");
const State = require("../state.js");
const Assert = require("assert").strict;

const tag1 = {};
const context1 = {};
const result1 = {};
const result3 = {};

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};
const program = {};
const aran_expression = ["primitive", 123];

State.session({nodes, serials, scopes}, program, () => {

  const dynamic1 = {};

  const scope1 = Core.extend(null, false, false, dynamic1);
  Assert.equal(Core.get_depth(scope1), 1);
  Assert.equal(Core.get_is_strict(scope1), false);

  const aran_identifier_1 = "foo";
  Assert.equal(Core.get_declared(scope1, aran_identifier_1), false);
  Assert.equal(Core.lookup(scope1, aran_identifier_1, {
    on_hit: (context2, initialized, escaped, tag, access) => {
      Assert.fail("expected a miss");
    },
    on_miss: (context2) => {
      Assert.equal(context2, context1);
      return result1;
    },
    on_dynamic: (context2, result2, dynamic2) => {
      Assert.equal(context2, context1);
      Assert.equal(dynamic2, dynamic1);
      Assert.equal(result2, result1);
      return result3;
    },
  }, context1), result3);
  Assert.throws(() => { Core.declare(scope1, aran_identifier_1, tag1) }, new Error("Unexpected shadowing"));
  Assert.throws(() => { Core.initialize(scope1, aran_identifier_1, tag1) }, new Error("Cannot initialize undeclared identifier"));

  const aran_identifier_2 = "bar";
  Assert.equal(Core.declare(scope1, aran_identifier_2, tag1), undefined);
  Assert.throws(() => { Core.declare(scope1, aran_identifier_2, tag1) }, new Error("Already declared"));
  Assert.equal(Core.get_declared(scope1, aran_identifier_2), true);
  Assert.equal(Core.get_initialized(scope1, aran_identifier_2), false);
  Assert.equal(Core.get_lookedup(scope1, aran_identifier_2), false);
  Assert.equal(Core.get_tag(scope1, aran_identifier_2), tag1);
  Assert.equal(Core.lookup(scope1, aran_identifier_2, {
    on_hit: (context2, initialized, escaped, tag2, access) => {
      Assert.equal(context2, context1);
      Assert.equal(initialized, false);
      Assert.equal(escaped, false);
      Assert.equal(tag2, tag1);
      Assert.deepEqual(access(null), ["read", aran_identifier_2]);
      Assert.deepEqual(access(aran_expression), ["write", aran_identifier_2, aran_expression]);
      return result1;
    },
    on_miss: (context2) => {
      Assert.fail("expected a hit");
    },
    on_dynamic: (context2, result2, dynamic2) => {
      Assert.fail("expected a direct hit");
    },
  }, context1), result1);
  Assert.equal(Core.get_lookedup(scope1, aran_identifier_2), true);
  Assert.deepEqual(Core.initialize(scope1, aran_identifier_2, aran_expression), ["write", aran_identifier_2, aran_expression]);
  Assert.throws(() => { Core.initialize(scope1, aran_identifier_2, null) }, new Error("Already initialized"));
  Assert.equal(Core.get_initialized(scope1, aran_identifier_2), true);

  const scope2 = Core.extend(scope1, true, true, null);
  Assert.equal(Core.get_depth(scope2), 2);
  Assert.equal(Core.get_is_strict(scope2), true);
  Assert.equal(Core.lookup(scope2, aran_identifier_2, {
    on_hit: (context2, initialized, escaped, tag2, access) => {
      Assert.equal(context2, context1);
      Assert.equal(initialized, true);
      Assert.equal(escaped, true);
      Assert.equal(tag2, tag1);
      Assert.deepEqual(access(null), ["read", aran_identifier_2]);
      Assert.deepEqual(access(aran_expression), ["write", aran_identifier_2, aran_expression]);
      return result1;
    },
    on_miss: (context2) => {
      Assert.fail("expected a hit");
    },
    on_dynamic: (context2, result2, dynamic2) => {
      Assert.fail("expected a direct hit");
    },
  }, context1), result1);
  
  const aran_identifier_3 = "qux";
  Assert.equal(Core.declare(scope2, aran_identifier_3, tag1), undefined);
  Assert.throws(() => { Core.block(scope2, (aran_identifier_4, lookedup, tag1) => true, () => []) }, new Error("Uninitialized identifier"));
  Assert.equal(Core.initialize(scope2, aran_identifier_3, null), undefined);
  let counter2 = 0;
  Assert.deepEqual(Core.block(scope2, (aran_identifier_4, lookedup, tag2) => {
    counter2++;
    Assert.equal(tag2, tag1);
    Assert.equal(lookedup, aran_identifier_4 === aran_identifier_2);
    console.log(aran_identifier_4);
    return aran_identifier_4 === aran_identifier_2;
  })([]), ["BLOCK", [aran_identifier_2], []]);
  Assert.equal(counter2, 2);

  let counter1 = 0;
  Assert.deepEqual(Core.eval(scope2, (aran_identifier_4, escaped, initialized, lookedup, tag2) => {
    Assert.equal(aran_identifier_4, aran_identifier_2);
    Assert.equal(escaped, true);
    Assert.equal(initialized, true);
    Assert.equal(lookedup, true);
    Assert.equal(tag2, tag1);
    counter1++;
    return true;
  })(aran_expression), ["eval", [aran_identifier_2], aran_expression]);
  Assert.equal(counter1, 1);
  Assert.deepEqual(scopes, {
    __proto__: null,
    0: [
      {
        is_closure: true,
        is_use_strict: true,
        dynamic: null,
        misses: null,
        bindings: {
          __proto__: null,
        }
      },
      {
        is_closure: false,
        is_use_strict: false,
        dynamic: dynamic1,
        misses: null,
        bindings: {
          __proto__: null,
          [aran_identifier_2]: {
            initialized: true,
            lookedup: true,
            tag: tag1
          }
        }
      }
    ]
  });
  Assert.deepEqual(Core.extend(scopes[0], false, false, null).parent, {
    parent: {
      parent: null,
      is_closure: false,
      is_use_strict: false,
      dynamic: {},
      misses: null,
      bindings: {
        __proto__: null,
        foobar: { initialized: true, lookedup: true, tag: {} }
      }
    },
    is_closure: true,
    is_use_strict: true,
    dynamic: null,
    misses: null,
    bindings: {
      __proto__: null
    }
  });
  Assert.deepEqual(Core.extend(JSON.parse(JSON.stringify(scopes[0])), false, false, null).parent, Core.extend(scopes[0], false, false, null).parent);

});




// 
