"use strict";
Error.stackTraceLimit = 1/0;
const Parse = require("./parse.js");

const success = (closure, ...args) => closure(...args);

const failure = (closure, ...args) => {
  try {
    closure(...args);
    throw new global.Error("Error expected");
  } catch (error) {
    if (error.name !== "SyntaxError") {
      throw error;
    }
  }
};

success(Parse.module, `import.meta;`);
failure(Parse.module, `delete foo;`);

failure(Parse.script, `import.meta;`);
success(Parse.script, `delete foo;`);

failure(Parse.eval, `new.target`, "arrow", {strict:false});
success(Parse.eval, `new.target`, "function", {strict:false});
failure(Parse.eval, `delete foo;`, "program", {strict:true});
success(Parse.eval, `delete foo;`, "program", {strict:false});
