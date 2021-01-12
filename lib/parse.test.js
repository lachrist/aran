"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
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
      ObjectExpression: {
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

match(Parse("new.target;", {
  parser,
  serial: 1,
  scopes: {
    1: {
      context: {sort:"function", strict:false}
    }
  },
  source: "eval",
  context: null,
  parserOptions: "parser-options"
}), {
  type: "Program",
  sourceType: "script",
  body: [nodes["new.target;"]]
});

const run = (code, source, context) => Parse(code, {
  parser,
  serial: null,
  scopes: null,
  source,
  context,
  parserOptions: "parser-options",
});

const success = (code, source, context) => match(run(code, source, context), {
  type: "Program",
  sourceType: source === "module" ? "module" : "script",
  body: [nodes[code]]
});

const failure = (code, source, context, name, message) => Assert.throws(() => {
  run(code, source, context);
}, {name, message});

success(`delete foo;`, "script", null);
success(`delete foo;`, "eval", null);
success(`export * from "source";`, "module", null);

////////////////
// Constraint //
////////////////

// failure(
//   [],
//   {source:"eval", context:{"super-property":true}},
//   "Error",
//   /Violation of super-propety => new-target/);
// failure(
//   [],
//   {source:"eval", context:{"super-call":true, "strict-mode":true}},
//   "Error",
//   /Violation of super-call => super-property/);
// failure(
//   [],
//   {source:"eval", context:{"super-call":true, "super-property":true}},
//   "Error",
//   /Violation of super-call => strict-mode/);

/////////////
// Options //
/////////////

ArrayLite.forEach(
  ["program"],
  (sort) => failure(
    `new.target;`,
    "eval",
    {strict:true, sort},
    "SyntaxError",
    /^'new.target' can only be used in functions/));
ArrayLite.forEach(
  ["function", "method", "constructor", "derived-constructor"],
  (sort) => success(
    `new.target;`,
    "eval",
    {strict:true, sort}));

ArrayLite.forEach(
  ["program", "function"],
  (sort) => failure(
    `super.foo;`,
    "eval",
    {strict:true, sort:"function"},
    "SyntaxError",
    /^'super' keyword outside a method/));
ArrayLite.forEach(
  ["method", "constructor", "derived-constructor"],
  (sort) => success(
    `super.foo;`,
    "eval",
    {strict:true, sort:"method"}));

ArrayLite.forEach(
  ["program", "function", "method", "constructor"],
  (sort) => failure(
    `super();`,
    "eval",
    {strict:true, sort},
    "SyntaxError",
    /^('super' keyword outside a method|super\(\) call outside constructor of a subclas)/));
ArrayLite.forEach(
  ["derived-constructor"],
  (sort) => success(
    `new.target;`,
    "eval",
    {strict:true, sort}));

failure(
  `delete foo;`,
  "eval",
  {strict:true, sort:"program"},
  "SyntaxError",
  /^Deleting local variable in strict mode/);
success(
  `delete foo;`,
  "eval",
  {strict:false, sort:"program"});

////////////
// Return //
////////////

ArrayLite.forEach(
  [
    `foo: return 123;`,
    `{ 123; return 456; 789; }`,
    `if (123) return 456;`,
    `if (123) 456; else return 789;`,
    `try { return 123; } catch {} finally {}`,
    `try { 123; } catch { return 456; }`,
    `try { 123; } finally { return 456; }`,
    `while (123) return 456;`,
    `do return 123; while (456);`,
    `for (;;) return 123;`,
    `for (x in 123) return 456;`,
    `for (x of 123) return 456;`,
    `switch (123) { case 456:
      789;
      return 901;
      234; }`],
  (code) => failure(
    code,
    "eval",
    {strict:false, sort:"program"},
    "SyntaxError",
    /^Illegal return statement/));
