"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const Source = require("./source.js");
const Parser = require("./parser.js");

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
  [`#! foo${"\n"}"bar";`]: {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: "bar"
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
  parseModule: (code, options, offset) => {
    Assert.deepEqual(options, {foo:"bar"});
    return Acorn.parse(code, {
      sourceType: "module",
      ecmaVersion: 2021,
      allowHashBang: true
    });
  },
  parseScript: (code, options, offset) => {
    Assert.deepEqual(options, {foo:"bar"});
    return Acorn.parse(code, {
      sourceType: "script",
      ecmaVersion: 2021,
      allowHashBang: true
    });
  }
};

const success = (code, source) => match(Parser.parse(code, source, parser, {foo:"bar"}), {
  type: "Program",
  sourceType: Source.getType(source) === "module" ? "module" : "script",
  body: [nodes[code]]
});

const failure = (code, source, name, message) => Assert.throws(() => {
  Parser.parse(code, source, parser);
}, {name, message});

success(`#! foo${"\n"}"bar";`, Source.make("eval", false, null));
success(`export * from "source";`, Source.make("module", false, null));

////////////////
// new.target //
////////////////

ArrayLite.forEach(
  [true, false],
  (strict) => {
    ArrayLite.forEach(
      ["program"],
      (mode) => {
        failure(
          `new.target;`,
          Source.make("eval", true, {strict, mode}),
          "SyntaxError",
          /^'new.target' can only be used in functions/); }); });

ArrayLite.forEach(
  [true, false],
  (strict) => {
    ArrayLite.forEach(
      ["function", "method", "constructor", "derived-constructor"],
      (mode) => {
        success(
          `new.target;`,
          Source.make("eval", true, {strict, mode})); }); });

////////////////
// super[...] //
////////////////

ArrayLite.forEach(
  [true, false],
  (strict) => {
    ArrayLite.forEach(
      ["program", "function"],
      (mode) => {
        failure(
          `super.foo;`,
          Source.make("eval", true, {strict, mode}),
          "SyntaxError",
          /^'super' keyword outside a method/); }); });

ArrayLite.forEach(
  [true, false],
  (strict) => {
    ArrayLite.forEach(
      ["method", "constructor", "derived-constructor"],
      (mode) => {
        success(
          `super.foo;`,
          Source.make("eval", true, {strict, mode})); }); });

////////////////
// super(...) //
////////////////

ArrayLite.forEach(
  [true, false],
  (strict) => {
    ArrayLite.forEach(
      ["program", "function", "method", "constructor"],
      (mode) => {
        failure(
          `super();`,
          Source.make("eval", true, {strict, mode}),
          "SyntaxError",
          /^('super' keyword outside a method|super\(\) call outside constructor of a subclas)/); }); });

ArrayLite.forEach(
  [true, false],
  (strict) => {
    ArrayLite.forEach(
      ["derived-constructor"],
      (mode) => {
        success(
          `new.target;`,
          Source.make("eval", true, {strict, mode})); }); });

////////////////
// delete ... //
////////////////

failure(
  `delete foo;`,
  Source.make("module", false, null),
  "SyntaxError",
  /^Deleting local variable in strict mode/);

success(
  `delete foo;`,
  Source.make("script", false, null));

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
    `switch (12) { case 34:
      56;
      return 78;
      90; }`],
  (code) => failure(
    code,
    Source.make("eval", false, null),
    "SyntaxError",
    /^Illegal return statement/));
