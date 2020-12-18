"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("acorn");
const Parse = require("./parse.js");

const match = (value1, value2) => {
  if (global.Array.isArray(value2)) {
    if (!global.Array.isArray(value1)) {
      throw new global.Error(`Expected an array`);
    }
    if (value1.length !== value2.length) {
      throw new global.Error(`Length missmatch`);
    }
    for (let index = 0; index < value2.length; index++) {
      match(value1[index], value2[index]);
    }
  } else if (typeof value2 === "object" && value2 !== null) {
    if (typeof value1 !== "object" || value1 === null) {
      throw new global.Error(`Expected a non-null object`);
    }
    for (let key of global.Reflect.ownKeys(value2)) {
      match(value1[key], value2[key]);
    }
  } else if (!global.Object.is(value1, value2)) {
    throw new global.Error(`Value mismatch ${global.String(value1)} !== ${global.String(value2)}`);
  }
}

const nodes = {
  __proto__: null,
  [`export * from "source";`]: {
    type: "ExportAllDeclaration",
    source: {
      type: "Literal",
      value: "source"
    }
  },
  [`super();`]: {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Super"
      },
      arguments: []
    }
  },
  [`super.foo;`]: {
    type: "ExpressionStatement",
    expression: {
      type: "MemberExpression",
      optional: false,
      object: {
        type: "Super",
      },
      property: {
        type: "Identifier",
        name: "foo"
      }
    }
  },
  [`new.target;`]: {
    type: "ExpressionStatement",
    expression: {
      type: "MetaProperty",
      meta: {
        type: "Identifier",
        name: "new"
      },
      property: {
        type: "Identifier",
        name: "target"
      }
    }
  },
  [`delete foo;`]: {
    type: "ExpressionStatement",
    expression: {
      type: "UnaryExpression",
      prefix: true,
      operator: "delete",
      argument: {
        type: "Identifier",
        name: "foo"
      }
    }
  },
  [`123;`]: {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: 123
    }
  }
};

const parser = {
  module: (code, options) => {
    Assert.deepEqual(options, "parser-options", );
    return Acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: 2021
    });
  },
  script: (code, options) => {
    Assert.deepEqual(options, "parser-options");
    return Acorn.parse(code, {
      sourceType: "script",
      ecmaVersion: 2021
    });
  }
};

const run = (codes, options) => Parse(codes.join("\n"), global.Object.assign({
  parser,
  source: "eval",
  context: null,
  parserOptions: "parser-options",
  serial: null,
  scopes: null
}, options));

const success = (codes, options) => match(run(codes, options), {
  type: "Program",
  sourceType: options.source === "module" ? "module" : "script",
  body: codes.map((code) => nodes[code])
});

const failure = (codes, options, name, message) => Assert.throws(() => {
  run(codes, options);
}, {name, message});

success([`delete foo;`], {source:"script"});
success([`delete foo;`], {source:"global-eval"});
success([`export * from "source";`], {source:"module"});
success(
  [`new.target;`],
  {
    source: "eval",
    serial: 123,
    scopes: {
      [123]: {
        context: {"new-target":true},
        data: "foobar"}}});

////////////////
// Constraint //
////////////////

failure(
  [],
  {source:"eval", context:{"super-property":true}},
  "Error",
  /Violation of super-propety => new-target/);
failure(
  [],
  {source:"eval", context:{"super-call":true, "strict-mode":true}},
  "Error",
  /Violation of super-call => super-property/);
failure(
  [],
  {source:"eval", context:{"super-call":true, "super-property":true}},
  "Error",
  /Violation of super-call => strict-mode/);

/////////////
// Options //
/////////////

failure(
  [`new.target;`],
  {source:"eval", context:{"new-target":false}},
  "SyntaxError",
  /^'new.target' can only be used in functions/);
success(
  [`new.target;`],
  {source:"eval", context:{"new-target":true}});

failure(
  [`super.foo;`],
  {source:"eval", context:{"new-target":true, "super-property":false}},
  "SyntaxError",
  /^'super' keyword outside a method/);
success(
  [`new.target;`],
  {source:"eval", context:{"new-target":true, "super-property":true}});

failure(
  [`super();`],
  {source:"eval", context:{"new-target":true, "super-property":true, "super-call":false, "strict-mode":true}},
  "SyntaxError",
  /^super\(\) call outside constructor of a subclass/);
success(
  [`new.target;`],
  {source:"eval", context:{"new-target":true, "super-property":true, "super-call":true, "strict-mode":true}});

failure(
  [`delete foo;`],
  {source:"eval", context:{"strict-mode":true}},
  "SyntaxError",
  /^Deleting local variable in strict mode/);
success(
  [`delete foo;`],
  {source:"eval", context:{"strict-mode":false}});

////////////
// Return //
////////////

failure(
  [`foo: return 123;`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`{ 123; return 456; 789; }`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`if (123) return 456;`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`if (123) 456; else return 789;`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`try { return 123; } catch {} finally {}`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`try { 123; } catch { return 456; }`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`try { 123; } finally { return 456; }`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`while (123) return 456;`],
  {source:"eval"},
  "SyntaxError", /^Illegal return statement/);
failure(
  [`do return 123; while (456);`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`for (;;) return 123;`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`for (x in 123) return 456;`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`for (x of 123) return 456;`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
failure(
  [`switch (123) { case 456:
    789;
    return 901;
    234; }`],
  {source:"eval"},
  "SyntaxError",
  /^Illegal return statement/);
