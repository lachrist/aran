"use strict";

// exports.parseModule = (code, enclave, parser) => common(code, globals, 

const common = (code, globals, parser, source) => {
  const node = Parse(code, source, parser);
  const state = Scoping.scopeProgram(node, source);
  ArrayLite.forEach(globals, (variable1) => {
    ArrayLite.forEach(state.globals, (variable2) => {
      Throw.assert(Variable.isCompatible(variable1, variable2), Throw.SyntaxError, `Duplicate variable declaration: ${variable1.name}`);
    });
  });
  return {
    node: node,
    hoistings: state.hoistings,
    sources: state.source,
    globals: ArrayLite.concat(globals, state.globals),
    evals: state.evals
  };
};



module.exports = (code, source, parser) => {
  const node = Parse(code, source, parser);
  
};
