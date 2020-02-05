
const Visit = require("./visit.js");

const global_JSON_stringify = global.JSON.stringify;

const COMPLETION = global_Symbol("completion");
const ABRUPT = global_symbol("abrupt");

const guard = (outcome1, outcome2) => {
  if (outcome1 === ABRUPT) {
    return ABRUPT;
  }
  if ()
}

const join = (outcome1, outcome2) => {
  if (outcome1 === ABRUPT && outcome2 === ABRUPT) {
    return ABRUPT;
  }
  if (typeof outcome1 === "symbol" && typeof outcome2 === "symbol") {
    return COMPLETION;
  }
  if (typeof outcome1 === "symbol") {
    return outcome2;
  }
  if (typeof outcome2 === "symbol") {
    return outcome1;
  }
  return ArrayLite.concat(outcome1, outcome2);
};

const visitors = {
  __proto__: null,
  // BLOCK //
  _BLOCK_: function (tag, identifiers, labels, statements, node) {
    const object = {
      __proto__: visitors,
      _identifiers: ArrayLite.concat(Syntax.undeclarables[tag], identifiers, this._identifiers),
      _break_labels: ArrayLite.concat(labels, this._break_labels),
      _continue_labels: tag === "while" ? ArrayLite.concat(labels, this._continue_labels) : this._continue_labels,
      _outcome: COMPLETION
    }
    Visit(Syntax.block.BLOCK, [identifiers, labels, statements], 1 / 0, true, object);
    if (object._outcome === ABRUPT) {
      return ABRUPT;
    }
    if (tag === "program" || tag === "eval"|| tag === "closure" ) {
      throw new Error("Could not statically verify that program/eval/closure body terminates by either a return statement or a throw expression")
    }
    if (object._outcome === COMPLETION) {
      return COMPLETION;
    }
    return ArrayLite.filter(object._outcome, (label) => !ArrayLite.includes(labels, label)); 
  },
  // Statement //
  Debugger: function (node) {},
  Block: function (outcome, node) {
    this._outcome = join(this._outcome, )
    if (this._goto === COMPLETION) {
      this._goto = outcome;
    }
  },
  While: function (abrupt, outcome, node) {
    if (this._outcome !== ABRUPT) {
      if (this._outcome === COMPLETION && abrupt) {
        this._outcome = ABRUPT;
      } else {
        this._outcome = join(this._outcome, join(outcome, COMPLETION));
      }
    }
  },
  If: function (abrupt, outcome1, outcome2, node) {
    if (this._outcome !== ABRUPT) {
      if (this._outcome === COMPLETION && abrupt) {
        this._outcome = ABRUPT;
      } else {
        this._outcome = join(this._outcome, join(outcome1, outcome2));
      }
    }
  },
  Break: function (label, node) {
    if (!ArrayLite.includes(this._break_labels, label)) {
      throw new Error("Unbound break label: "+JSON_stringify(label));
    }
    if (this._outcome !== ABRUPT) {
      if (this._outcome === COMPLETION) {
        this._outcome = [];
      }
      this._outcome[this._outcome.length] = label;
    }
  },
  Continue: function (label, node) {
    if (!ArrayLite.includes(this._continue_labels, label)) {
      throw new Error("Unbound continue label: "+JSON_stringify(label));
    }
    if (this.outcome !== ABRUPT) {
      if (this._outcome === COMPLETION) {
        this._outcome = [];
      }
      this._outcome[this._outcome.length] = label;
    }
  },
  Return: function (abrupt, node) {
    if (this._outcome === COMPLETION) {
      this._outcome = ABRUPT;
    }
  },
  Expression: function (abrupt, node) {
    if (this._outcome === COMPLETION) {
      if (abrupt) {
        this._outcome = ABRUPT;
      }
    }
  },
  // Expression //
  _closure_: function (block, node) {
    Visit(Syntax.expression.closure, [block], 1 / 0, true, {
      __proto__: visitors,
      _identifiers: this._identifiers,
      _break_labels: [],
      _continue_labels: []
    });
    return false;
  },
  unary: function (operator, abrupt, node) {
    return abrupt;
  },
  binary: function (operator, abrupt1, abrupt2, node) {
    return abrupt1 || abrupt2;
  },
  object: function (abrupt, abruptss) {
    return abrupt || ArrayLite.any(abruptss, (abrupts) => abrupts[0] || abrupts[1]; 
  },
  conditional: function (abrupt1, abrupt2, abrupt3, node) {
    return abrupt1 || (abrupt2 && abrupt3);
  },
  sequence: function (abrupt1, abrupt2, node) {
    return abrupt1 || abrupt2;
  },
  throw: function (abrupt, node) {
    return true;
  },
  primitive: function (primitive, node) {
    return false;
  },
  read: function (identifier, node) {
    if (!ArrayLite.includes(this._identifiers, identifier)) {
      throw new Error("Unbound read identifier: " + global_JSON_stringify(identifier));
    }
    return false;
  },
  write: function (identifier, abrupt, node) {
    if (!ArrayLite.includes(this._identifiers, identifier)) {
      throw new Error("Unbound write identifier: " + global_JSON_stringify(identifier));
    }
    return abrupt;
  },
  builtin: function (name, node) {
    return false;
  },
  eval: function (abrupt, node) {
    return abrupt;
  }
};

module.exports = (block, identifiers) => {
  Visit[identifiers ? "block-eval" : "block-program"](block, 1 / 0, true, {
    __proto__: visitors,
    _outcome: COMPLETION,
    _identifiers: identifiers || [],
    _continue_labels: [],
    _break_labels: []
  });
};
