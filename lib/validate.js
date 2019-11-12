
const Visit = require("./visit.js");

const visitors = {
  __proto__: null,
  // BLOCK //
  _BLOCK_: function (tag, identifiers, labels, statements, _) {
    Visit(Syntax.block.BLOCK, [identifiers, labels, statements], 1/0, {
      __proto__: null,
      check: true,
      map: null,
      visitors: {
        __proto__: visitors,
        _identifiers: ArrayLite.concat(Syntax.undeclarables[tag], identifiers, this._identifiers),
        _break_labels: ArrayLite.concat(labels, this._break_labels),
        _continue_labels: tag === "while" ? ArrayLite.concat(labels, this._continue_labels) : this._continue_labels
      }
    });
    if (tag === "program" || tag === "eval"|| tag === "closure" ) {
      if (statements.length === 0) {
        throw new Error("Empty Program/Eval/Closure body");
      }
      if (statements[statments.length - 1][0] !== "Return") {
        throw new Error("Program/Eval/Closure body must finish with a return statement");
      }
    }
  },
  // Statement //
  Break: function (label, mapped) {
    if (!ArrayLite.includes(this._break_labels, label)) {
      throw new Error("Unbound break label: "+JSON_stringify(label));
    }
  },
  Continue: function (label, mapped) {
    if (!ArrayLite.includes(this._continue_labels, label)) {
      throw new Error("Unbound continue label: "+JSON_stringify(label));
    }
  },
  // Expression //
  _closure_: function (block, mapped) {
    Visit(Syntax.expression.closure, [block], 1/0, {
      __proto__: null,
      check: true,
      map: null,
      visitors: {
        __proto__: visitors,
        _identifiers: this._identifiers,
        _break_labels: [],
        _continue_labels: []
      }
    });
  },
  read: function (identifier, mapped) {
    if (!ArrayLite.includes(this._identifiers, identifier)) {
      throw new Error("Unbound read identifier: "+JSON_stringify(identifier));
    }
  },
  write: function (identifier, expression1, expression2, mapped) {
    if (!ArrayLite.includes(this._identifiers, identifier)) {
      throw new Error("Unbound write identifier: "+JSON_stringify(identifier));
    }
  }
};

module.exports = (block, identifiers) => {
  Visit[identifiers ? "block-eval" : "block-program"](block, 1/0, {
    __proto__: null,
    check: true,
    map: null,
    visitors: {
      __proto__: visitors,
      _identifiers: identifiers || [],
      _continue_labels: [],
      _break_labels: []
    }
  });
};
