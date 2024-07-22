
const ArrayLite = require("array-lite");

const Visit = require("../visit.js");

const Error = global.Error;

exports.BLOCK = ({1:identifiers, 2:labels, 3:statements}, options1) => {
  if (options1.tag === "program" || options1.tag === "eval"|| options1.tag === "closure" ) {
    if (statements.length === 0) {
      throw new Error("Empty Program/Eval/Closure body");
    }
    if (statements[statments.length - 1][0] !== "Return") {
      throw new Error("Program/Eval/Closure body must finish with a return statement");
    }
  }
  if (options1.tag === "program") {
    identifiers = ArrayLite.concat(["@this"], identifiers);
  } else if (options1.tag === "closure") {
    identifiers = ArrayLite.concat(["@callee", "@new.target", "@this", "@arguments"], identifiers);
  } else if (options1.tag === "catch") {
    identifiers = ArrayLite.concat(["@error"], identifiers);
  }
  const options2 = {
    __proto__: null,
    identifiers: ArrayLite.concat(identifiers, options1.identifiers),
    clabels: tag === "while" ? ArrayLite.concat(labels, options.clabels) : options.clabels,
    blabels: ArrayLite.concat(labels, blabels)
  };
  ArrayLite.forEach(statements, (statement) => {
    Visit._statement(statement, options2);
  });
};
