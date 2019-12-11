
const ArrayLite = require("array-lite");
const Build = require("./build.js");
const Visit = require("./visit");

const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Error = global.Error;

const COMPLETION = "@completion";
const LAST = "@last";

const NONE = 1;
const PROM = 2
const DOOR = 3;

const EMPTY = "@empty";
const VALUED = "@valued";
const NOT_VALUED = "@not-valued";
const RETURN = "@return";
const THROW = "@throw";

const NOT_VALUED_TYPES = [
  "FunctionDeclaration",
  "VariableDeclaration",
  "EmptyStatement",
  "Debugger"
];
const VALUED_TYPES = [
  "ExpressionStatement",
  "WithStatement",
  "IfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "SwitchStatement"
];

// Why you cannot go from valued statement to valued statement:
// ============================================================
// foo: {
//   if (true) {
//     "last";
//     break foo;
//   }
//   "not-last";
// }

const outcome = (node) => {
  if (node.type === "BreakStatement" || node.type === "ContinueStatement") {
    return node.label ? node.label.name : EMPTY;
  }
  if (node.type === "ThrowStatement") {
    return THROW;
  }
  if (node.type === "ReturnStatement") {
    return RETURN;
  }
  if (node.type === "LabeledStatement") {
    const string = outcome(node.body);
    if (string === node.label.name) {
      return NOT_VALUED;
    }
    return string;
  }
  if (node.type === "BlockStatement") {
    for (let index = 0; index < node.body.length; index++) {
      const key = outcome(node.body[index]);
      if (key !== NOT_VALUED) {
        return key;
      }
    }
    return NOT_VALUED;
  }
  if (ArrayLite.includes(NOT_VALUED_TYPES, node.type)) {
    return NOT_VALUED;
  }
  if (ArrayLite.includes(VALUED_TYPES, node.type)) {
    return VALUED;
  }
  throw new global_Error("Unexpected statement type");
};

const setlast = (lexic, boolean) => (
  lexic[LAST] === boolean ?
  lexic :
  {
    __proto__: lexic,
    [LAST]: boolean});

exports.Create = (cache) => ({
  __proto__: null,
  [COMPLETION]: cache,
  [LAST]: cache !== null
});

exports.IsLast = (lexic) = lexic[LAST];

exports.SetLastFalse = (lexic) => setlast(lexic, false);

exports.GetCompletion = (lexic) => lexic[COMPLETION];

exports.IsPromoted = (lexic, label) => lexic[label] % PROMOTED === 0;

exports.Block = (lexic, labels1, labels2, nodes, closure) => {
  if (labels1.length > 0 || labels2.length > 0) {
    lexic = {__proto__:lexic};
    const descriptor = {
      __proto__: null,
      writable: true,
      enumerable: true,
      configurable: true,
      value: null
    };
    ArrayLite.forEach([labels1, labels2], (labels, index) => {
      descriptor.value = index === 0 ? NONE : PROM;
      if (lexic[LAST]) {
        descriptor.value = DOOR * descriptor.value;
      }
      for (let index = 0; index < labels.length; index++) {
        global_Reflect_defineProperty(lexic, labels[index] === null ? LOOP : labels[index], descriptor);
      }
    });
  }
  // Special case for performance reasons.
  // If the lexic does not start with @last set to true, it cannot toggled it.
  if (lexic[COMPLETION] === null) {
    return ArrayLite.flatMap(nodes, closure(lexic, node));
  }
  // General Case:
  const strings = ArrayLite.flatMap(nodes, outcome);
  return ArrayLite.flatMap(nodes, (node, index1) => {
    if (strings[index1] !== VALUED) {
      return ArrayLite.flatMap(nodes, closure(setlast(lexic, false), node));
    }
    for (let index2 = index1 + 1; index2 < node.length; index2++) {
      if (strings[index2] === NOT_VALUED) {
        continue;
      }
      if (strings[index2] === VALUED || strings[index2] === THROW || strings[index2] === RETURN) {
        return closure(node, setlast(lexic, false));
      }
      // Possible invariant: if @last is true then the label is always a completion label...
      return closure(node, setlast(lexic, lexic[strings[index2]] % DOOR === 0));
    }
    return closure(node, lexic);
  });
};
