"use strict";
Error.stackTraceLimit = 1/0;

const Acorn = require("acorn");
const ParseLocal = require("./parse-local.js");

const parse = {
  script: (code) => Acorn.parse(code, {
    sourceType: "script",
    ecmaVersion: 2021
  })
};

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

const success = (codes, options) => match(ParseLocal(codes.join("\n"), options, parse), {
  type: "Program",
  body: codes.map((code) => nodes[code])
});

const failure = (codes, options, name, message) => {
  try {
    ParseLocal(codes.join("\n"), options, parse);
    throw new global.Error("Expected an error");
  } catch (error) {
    if (error.name !== name) {
      console.log(`Expected error.name to be ${name}, but got ${error.name}`);
      throw error;
    }
    if (!message.test(error.message)) {
      console.log(`Expected error.message to be ${message}, but got ${error.message}`);
      throw error;
    }
  }
};

////////////////
// Constraint //
////////////////

failure([], {"super-property":true}, "Error", /Violation of super-propety => new-target/);
failure([], {"super-call":true, "strict-mode":true}, "Error", /Violation of super-call => super-property/);
failure([], {"super-call":true, "super-property":true}, "Error", /Violation of super-call => strict-mode/);

/////////////
// Options //
/////////////

failure([`new.target;`], {"new-target":false}, "SyntaxError", /^'new.target' can only be used in functions/);
success([`new.target;`], {"new-target":true});

failure([`super.foo;`], {"new-target":true, "super-property":false}, "SyntaxError", /^'super' keyword outside a method/);
success([`new.target;`], {"new-target":true, "super-property":true});

failure([`super();`], {"new-target":true, "super-property":true, "super-call":false, "strict-mode":true}, "SyntaxError", /^super\(\) call outside constructor of a subclass/);
success([`new.target;`], {"new-target":true, "super-property":true, "super-call":true, "strict-mode":true});

failure([`delete foo;`], {"strict-mode":true}, "SyntaxError", /^Deleting local variable in strict mode/);
success([`delete foo;`], {"strict-mode":false});

////////////
// Return //
////////////

failure([`foo: return 123;`], null, "SyntaxError", /^Illegal return statement/);
failure([`{ 123; return 456; 789; }`], null, "SyntaxError", /^Illegal return statement/);
failure([`if (123) return 456;`], null, "SyntaxError", /^Illegal return statement/);
failure([`if (123) 456; else return 789;`], null, "SyntaxError", /^Illegal return statement/);
failure([`try { return 123; } catch {} finally {}`], null, "SyntaxError", /^Illegal return statement/);
failure([`try { 123; } catch { return 456; }`], null, "SyntaxError", /^Illegal return statement/);
failure([`try { 123; } finally { return 456; }`], null, "SyntaxError", /^Illegal return statement/);
failure([`while (123) return 456;`], null, "SyntaxError", /^Illegal return statement/);
failure([`do return 123; while (456);`], null, "SyntaxError", /^Illegal return statement/);
failure([`for (;;) return 123;`], null, "SyntaxError", /^Illegal return statement/);
failure([`for (x in 123) return 456;`], null, "SyntaxError", /^Illegal return statement/);
failure([`for (x of 123) return 456;`], null, "SyntaxError", /^Illegal return statement/);
failure([`switch (123) { case 456:
  789;
  return 901;
  234;
}`], null, "SyntaxError", /^Illegal return statement/);
