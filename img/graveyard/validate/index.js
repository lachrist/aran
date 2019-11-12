
const Visit = require("./visit.js");

const options1 = {
  __proto__: null,
  check: true,
  map: null,
  visitors: {
    __proto_: null
  }
};

const options2 = {
  __proto__: null,
  check: true,
  map: null,
  visitors: {
    __proto__: null,
    _BLOCK_: (tag, identifiers, labels, statements, mapped, accumulation) => {
      Visit(["identifier"], identifiers, 1, options1);
      Visit(["label"], labels, 1, options1);
      Visit(["statement"], statements, 1, options1);
      if (tag === "program" || tag === "eval"|| tag === "closure" ) {
        if (statements.length === 0) {
          throw new Error("Empty Program/Eval/Closure body");
        }
        if (statements[statments.length - 1][0] !== "Return") {
          throw new Error("Program/Eval/Closure body must finish with a return statement");
        }
      }
      return {
        __proto__: null,
        identifiers: ArrayLite.concat(Syntax.undeclarables[tag], identifiers, options.identifiers),
        blabels: ArrayLite.concat(labels, options.blabels),
        clabels: tag === "while" ? ArrayLite.concat(labels, options.clabels) : options.clabels
      };
    },
    Break: (label, mapped, accumulation) => {
      if (!ArrayLite.includes(accumulation.blabels, label)) {
        throw new Error("Unbound break label: "+JSON_stringify(label));
      }
    },
    Continue: (label, mapped, accumulation) => {
      if (!ArrayLite.includes(accumulation.clabels, label)) {
        throw new Error("Unbound continue label: "+JSON_stringify(label));
      }
    },
    _closure_: (block, mapped, accumulation) => ({
      __proto__: null,
      identifiers: accumulation.identifiers,
      blabels: [],
      clabels: []
    }),
    read: (identifier, mapped, accumulation) => {
      if (!ArrayLite.includes(accumulation.identifiers, identifier)) {
        throw new Error("Unbound read identifier: "+JSON_stringify);
      }
    },
    write: (identifier, expression1, expression2, mapped, accumulation) => {
      if (!ArrayLite.includes(accumulation.identifiers, identifier)) {
        throw new Error("Unbound write identifier: "+JSON_stringify(identifier));
      }
    }
  }
};

module.exports = (block, identifiers) => {
  Visit[identifiers ? "block-eval" : "block-program"](block, {
    __proto__: null,
    identifiers: identifiers || [],
    clabels: [],
    blabels: []
  }, 1/0, options2);
};
