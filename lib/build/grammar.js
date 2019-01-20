
exports.block = {
  "BLOCK": [["identifier"], ["statement"]]
};
exports.statement = {
  "Write": ["identifier", "expression"],
  "Expression": ["expression"],
  "Break": ["nullable-label"],
  "Continue": ["nullable-label"],
  "Return": ["expression"],
  "Throw": ["expression"],
  "Debugger": [],
  "If": [["label"], "expression", "block", "block"],
  "Try": [["label"], "block", "block", "block"],
  "Block": [["label"], "block"],
  "While": [["label"], "expression", "block"],
  "Switch": [["label"], "block"],
  "Case": ["nullable-expression"]
};
exports.expression = {
  "closure": ["block"],
  "write": ["identifier", "expression", "expression"],
  "error": [],
  "argument": ["argument-name"],
  "read": ["identifier"],
  "primitive": ["primitive"],
  "primordial": ["primordial-name"],
  "sequence": ["expression", "expression"],
  "eval": ["expression"],
  "conditional": ["expression", "expression", "expression"],
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]],
  "unary": ["unary-operator", "expression"],
  "binary": ["binary-operator", "expression", "expression"],
  "trap": ["trap-name", ["expression"], "serial"]
};
