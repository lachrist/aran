"use strict";

const ArrayLite = require("array-lite");
const Build = require("../lang/build.js");
const Syntax = require("../lang/syntax.js");
const State = require("./state.js");

const global_Error = global.global.Error;
const global_Reflect_ownKeys = global.Object.keys;

ArrayLite.forEach(global_Reflect_ownKeys(Syntax.statement), (constructor) => {
  if (Syntax.statement[constructor].length === 0) {
    exports[constructor] = () => {
      const aran_statement_array = Build[constructor]();
      State.tag(aran_statement_array[0]);
      return aran_statement_array;
    };
  } else if (Syntax.statement[constructor].length === 1) {
    exports[constructor] = (field1) => {
      const aran_statement_array = Build[constructor](field1);
      State.tag(aran_statement_array[0]);
      return aran_statement_array;
    };
  } else if (Syntax.statement[constructor].length === 2) {
    exports[constructor] = (field1, field2) => {
      const aran_statement_array = Build[constructor](field1, field2);
      State.tag(aran_statement_array[0]);
      return aran_statement_array;
    };
  } else if (Syntax.statement[constructor].length === 3) {
    exports[constructor] = (field1, field2, field3) => {
      const aran_statement_array = Build[constructor](field1, field2, field3);
      State.tag(aran_statement_array[0]);
      return aran_statement_array;
    };
  } else {
    // console.assert(Syntax.statement[constructor].length === 4);
    exports[constructor] = (field1, field2, field3, field4) => {
      const aran_statement_array = Build[constructor](field1, field2, field3, field4);
      State.tag(aran_statement_array[0]);
      return aran_statement_array;
    }
  }
});

ArrayLite.forEach(global_Reflect_ownKeys(Syntax.expression), (constructor) => {
  if (Syntax.expression[constructor].length === 1) {
    exports[constructor] = (field1) => State.tag(Build[constructor](field1));
  } else if (Syntax.expression[constructor].length === 2) {
    exports[constructor] = (field1, field2) => State.tag(Build[constructor](field1, field2));
  } else {
    // console.assert(Syntax.expression[constructor].length === 3);
    exports[constructor] = (field1, field2, field3) => State.tag(Build[constructor](field1, field2, field3));
  }
});

exports.BLOCK = (field1, field2) => State.tag(Build.BLOCK(field1, field2));

ArrayLite.forEach(["BLOCK", "eval", "read", "write"], (constructor) => {
  exports["__" + constructor + "__"] = exports[constructor];
  exports[constructor] = () => {
    throw new global_Error("Forbidden construction of scope-related node");
  };
});
