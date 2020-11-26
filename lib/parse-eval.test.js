"use strict";
Error.stackTraceLimit = 1/0;

const Acorn = require("acorn");
const ParseEval = require("./parse-eval.js");

const parse = (code) => Acorn.parse(code, {
  sourceType: "script",
  ecmaVersion: 2021
});

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

const success = (codes, sort, options) => match(ParseEval(codes.join("\n"), sort, options, parse), {
  type: "Program",
  body: codes.map((code) => nodes[code])
});

const failure = (codes, sort, options, name, message) => {
  try {
    ParseEval(codes.join("\n"), sort, options, parse);
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

failure([`123;`], "foobar", {}, "Error", /^Invalid sort/);

/////////////
// Program //
/////////////

[false, true].forEach((strict) => {
  failure([`new.target;`], "program", {strict}, "SyntaxError", /^'new.target' can only be used in functions/);
  failure([`super.foo;`], "program", {strict}, "SyntaxError", /^'super' keyword outside a method/);
  failure([`super();`], "program", {strict}, "SyntaxError", /^'super' keyword outside a method/);
});

success([`delete foo;`], "program", {strict:false});
failure([`delete foo;`], "program", {strict:true}, "SyntaxError", /^Deleting local variable in strict mode/);
success([`123;`], "program", {strict:true});

////////////
// Arrow //
///////////

[false, true].forEach((strict) => {
  failure([`new.target;`], "arrow", {strict}, "SyntaxError", /^'new.target' can only be used in functions/);
  failure([`super.foo;`], "arrow", {strict}, "SyntaxError", /^'super' keyword outside a method/);
  failure([`super();`], "arrow", {strict}, "SyntaxError", /^'super' keyword outside a method/);
});

success([`delete foo;`], "arrow", {strict:false});
failure([`delete foo;`], "arrow", {strict:true}, "SyntaxError", /^Deleting local variable in strict mode/);

//////////////
// Function //
//////////////

[false, true].forEach((strict) => {
  success([`new.target;`], "function", {strict});
  failure([`super.foo;`], "function", {strict}, "SyntaxError", /^'super' keyword outside a method/);
  failure([`super();`], "function", {strict}, "SyntaxError", /^'super' keyword outside a method/);
});

success([`delete foo;`], "function", {strict:false});
failure([`delete foo;`], "function", {strict:true}, "SyntaxError", /^Deleting local variable in strict mode/);

////////////
// Method //
////////////

[false, true].forEach((strict) => {
  success([`new.target;`], "method", {strict});
  success([`super.foo;`], "method", {strict});
  failure([`super();`], "method", {strict}, "SyntaxError", /^super\(\) call outside constructor of a subclass/);
});

success([`delete foo;`], "method", {strict:false});
failure([`delete foo;`], "method", {strict:true}, "SyntaxError", /^Deleting local variable in strict mode/);

/////////////////
// Constructor //
/////////////////

[false, true].forEach((strict) => {
  [false, true].forEach((derived) => {
    success([`new.target;`], "constructor", {strict, derived});
    success([`super.foo;`], "constructor", {strict, derived});
    failure([`delete foo;`], "constructor", {strict, derived}, "SyntaxError", /^Deleting local variable in strict mode/);
  });
  success([`super();`], "constructor", {strict, derived:true});
  failure([`super();`], "constructor", {strict, derived:false}, "SyntaxError", /^super\(\) call outside constructor of a subclass/);
});

////////////
// Return //
////////////

failure([`foo: return 123;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`{ 123; return 456; 789; }`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`if (123) return 456;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`if (123) 456; else return 789;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`try { return 123; } catch {} finally {}`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`try { 123; } catch { return 456; }`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`try { 123; } finally { return 456; }`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`while (123) return 456;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`do return 123; while (456);`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`for (;;) return 123;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`for (x in 123) return 456;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`for (x of 123) return 456;`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
failure([`switch (123) { case 456:
  789;
  return 901;
  234;
}`], "arrow", {strict:true}, "SyntaxError", /^Illegal return statement/);
