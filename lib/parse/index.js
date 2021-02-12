"use strict";

data Source
  = Script
  | Module
  | GlobalEval
  | LocalEval Strict (Maybe FunctionSort) [Identifier]

data Source
  = Script
  | ScriptEnclave
  | Module
  | ModuleEnclave
  | GlobalEval
  | GlobalEvalEnclave
  | LocalEval Strict 

data Source
  = Script Enclave
  | Module Enclave
  | Eval Enclave Strict Mode Global [Identifier]

data Mode
  = Program
  | Constructor
  | Method
  | DerivedConstructor
  | Function

data Mode
  = 
  | 

data Mode
  | Script
  | Module
  | Eval
  | Constructor
  | Method
  | DerivedConstructor
  | Function


data Mode
  | EnclaveProgram
  | EnclaveFunction
  | EnclaveMethod
  | EnclaveConstructor
  | EnclaveDerivedConstructor
  | 
  | Module
  | Script
  | Eval
  | Constructor
  | Method
  | DerivedConstructor
  | Function

enclave

const sorts = {
  __proto__: null,
  "script": null,
  "module": null,
  "eval": null,
  "derived-constructor": "derived-constructor",
  "constructor": "constructor",
  "method": "method",
  "function": "function"};

const parseEval = (code, strict, sort, parser) => {}

const isCompatible = (variable1, variable2) => (
  variable1.name !== variable2.name &&
  (
    (
      variable1.kind === "var" ||
      variable1.kind === "function") &&
    (
      variable2.kind === "var" ||
      variable2.kind === "function")));

module.exports = (code, source, globals, parser) => {
  let node;
  if (source.type === "module") {
    node = parser.parseModule(code);
  } else if (source.type === "script") {
    node = parser.parseScript(code);
  } else {
    // console.assert(source.type === "eval");
    node = parseEval(code, source.strict, sorts[source.mode], parser);
  }
  const variables = Scope.scopeProgram(node, source);
  ArrayLite.forEach(
    globals,
    (variable1) => ArrayLite.forEach(
      variables,
      (variable2) => Throw.assert(
        isCompatible(variable1, variable2),
        null,
        `Duplicate global variable declaration: ${variale.name}}`)));
  for (let index = 0, index < variables.length; index++) {
    globals[globals.length] = variables[index];
  }
  
  if (source.enclave) {
    // do nothing
  } else {
    if (source.type === "eval" && !source.global) {
      // do nothing
    } else if (source.type === "module") {
      // do nothing because module may cause an early error because of links
      // however variables should always be empty
    } else {
      
    }
  }
  if (!source.enclave && source.type === "eval" && source.mode !== "program") {
    // do nothing
  } else {
    globals.push(...variables);
  }
};