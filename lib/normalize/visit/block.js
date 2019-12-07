
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

const global_Array_from = global.Array.from;
const global_Boolean = global.Boolean;
const global_Symbol = global.Symbol;

const VALUED = global_Symbol("valued");
const NOT_VALUED = global_Symbol("not-valued");
const RETURN = global_Symbol("return");
const THROW = global_Symbol("throw");


let argument = null;

let result = null;

const cids = (nodes) => {
  if (nodes === argument) {
    const temporary = result;
    argument = null;
    result = null;
    return temporary;
  }
  argument = nodes;
  nodes = global_Array_from(nodes);
  let length = nodes.length;
  const identifiers = [];
  while (length) {
    const node = nodes[--length];
    if (node.type === "IfStatement") {
      nodes[length++] = node.consequent;
      if (node.alternate) {
        nodes[length++] = node.alternate;
      }
    } else if (node.type === "LabeledStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "ForStatement") {
      nodes[length++] = node.body;
      if (node.init && node.init.type === "VariableDeclaration") {
        nodes[length++] = node.init;
      }
    } else if (node.type === "ForOfStatement" || node.type === "ForInStatement") {
      nodes[length++] = node.body;
      if (node.left.type === "VariableDeclaration") {
        nodes[length++] = node.left;
      }
    } else if (node.type === "BlockStatement") {
      for (let index = node.body.length - 1; index >= 0; index--) {
        nodes[length++] = node.body[index];
      }
    } else if (node.type === "TryStatement") {
      nodes[length++] = node.block;
      if (node.handler) {
        nodes[length++] = node.handler.body;
      }
      if (node.finalizer) {
        nodes[length++] = node.finalizer;
      }
    } else if (node.type === "SwitchCase") {
      for (let index = node.consequent.length - 1; index >= 0; index--) {
        nodes[length++] = node.consequent[index];
      }
    } else if (node.type === "SwitchStatement") {
      for (let index = node.cases.length - 1; index >= 0; index--) {
        nodes[length++] = node.cases[index];
      }
    } else if (node.type === "VariableDeclaration") {
      if (node.kind === "var") {
        ArrayLite.forEach(ArrayLite.flatMap(node.declarations, dids), (identifier) => {
          if (!ArrayLite.includes(identifiers, identifier)) {
            identifiers[identifiers.length] = identifier;
          }
        });
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(identifiers, node.id.name)) {
        identifiers[identifiers.length] = node.id.name;
      }
    }
  }
  result = identifiers;
  return identifiers;
};



foo: while (test) {
  "last";
  break foo;
  "not-last";
}


{
  foo: {
    "not-last";
    break foo;
  }
  "last";
}

const dids = (declaration) => Pattern.$GetIdentifiers(declaration.id);

const bids = (nodes, kind) => ArrayLite.flatMap(
  nodes,
  (node) => (
    (
      node.type === "VariableDeclaration" &&
      node.kind === kind) ?
    ArrayLite.flatMap(node.declarations, dids) :
    []));

const types1 = [
  "FunctionDeclaration",
  "VariableDeclaration",
  "EmptyStatement",
  "Debugger"
];

const types2 = [
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
    return node.label ? node.label.name : "";
  }
  if (node.type === "ThrowStatement") {
    return THROW;
  }
  if (node.type === "ResturnStatement") {
    return RETURN;
  }
  if (node.type === "LabeledStatement") {
    const key = outcome(node.body);
    if (typeof key === "string" && key === node.label.name) {
      return NOT_VALUED;
    }
    return key;
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
  if (ArrayLite.includes(types1, node.type)) {
    return NOT_VALUED;
  }
  if (ArrayLite.includes(types2, node.type)) {
    return VALUED;
  }
  throw new Error("Unexpected statement type");
};

const visitall = (nodes, scope) => {
  const completion = Scope.$GetCompletion(scope1)
  if (completion === null) {
    return ArrayLite.map(nodes, (node) => Visit.Node(node, scope, []));
  }
  const keys = ArrayLite.map(node.body, outcome);
  return ArrayLite.map(nodes, (node, index1) => {
    if (keys[index1] !== VALUED) {
      return Visit.Node(node, Scope.$SetCompletion(scope, null), []);
    }
    for (let index2 = index1 + 1; index2 < node.length; index2++) {
      if (keys[index2] === VALUED || keys[index2] === THROW || keys[index2] === RETURN) {
        return Visit.Node(nodes[index1], Scope.$SetCompletion(scope, {
          __proto__: null,
          cache: completion.cache,
          labels: completion.labels,
          last: false
        }), []);
      }
      if (typeof keys[index2] === "string") {
        // I think that if completion.last is true then the label is always a completion label...
        return Visit.Node(nodes[index1], Scope.$SetCompletion(scope, {
          __proto__: null,
          cache: completion.cache,
          labels: completion.labels,
          last: ArrayLite.includes(completion.labels, keys[index2])
        }), []);
      }
    }
    return Visit.Node(nodes[index1], scope, []);
  });
};

// Arguments and vars live in different scope frames:
//
// > function f (x = y) { var y = 1; return x }
// undefined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

exports.Block = (nodes, scope1, tag, labels, cache, object) => Scope.BLOCK(
  (
    (
      object["@completion"] !== null &&
      object["@completion"].last) ?
    global_
    
  (
    (
      Scope.$GetCompletion(scope1) &&
      Scope.$GetCompletion(scope1).last) ?
    Scope.$SetCompletion(scope1, {
      __proto__: null,
      cache:  Scope.$GetComppletion(scope1).cache,
      last: true,
      labels: ArrayLite.concat(
        Scope.$GetComppletion(scope1).labels,
        labels)}) :
    scope1),
  {
    __proto__: null,
    labels: labels,
    completion: tag === "program",
    closure: (
      (
        tag === "function" ||
        tag === "arrow") ?
      tag :
      null),
    with: (
      tag === "with" ?
      with :
      null),
    strict: (
      nodes.length > 0 &&
      nodes[0].type === "ExpressionStatement" &&
      nodes[0].expression.type === "Literal" &&
      nodes[0].expression.value === "use strict")},
  ArrayLite.concat(
    (
      (
        tag === "function" ||
        tag === "arrow" ||
        (
          tag === "program" &&
          (
            scope1 === null ||
            !Scope.$GetStrict(scope2)))) ?
      cids(nodes) :
      []),
    bids(
      (
        tag === "switch" ?
        ArrayLite.flatMap(nodes, (node) => node.consequent) :
        nodes),
      "let")),
  ArrayLite.concat(
    (
      (
        tag === "program" &&
        scope1 === null) ?
      ["this"] :
      []),
    bids(
      (
        tag === "switch" ?
        ArrayLite.flatMap(nodes, (node) => node.consequent) :
        nodes),
      "const")),
  (scope2) => ArrayLite.concat(
    (
      (
        tag === "program" &&
        scope1 === null) ?
      Build.Expression(
        Scope.initialize(
          scope,
          "this",
          Build.builtin("global"))) :
      []),
    (
      (
        tag === "program" ||
        tag === "function" ||
        tag === "arrow") ?
      ArrayLite.flatMap(
        cids(nodes),
        (identifier) => Build.Expression(
          (
            (
              tag === "program" &&
              scope1 === null &&
              !Scope.$GetStrict(scope2)) ?
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                Build.builtin("global"),
                Build.primitive(identifier),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      Build.primitive(void 0)]
                    [
                      Build.primitive("writable"),
                      Build.primitive(true)],
                    [
                      Build.primitive("enumerable"),
                      Build.primitive(true)]])]) :
        Build.initialize(
          scope,
          identifier,
          Build.primitive(void 0))))) :
      []),
    ArrayLite.flatMap(
      (
        tag === "switch" ?
        ArrayLite.flatMap(nodes, (node) => node.consequent) :
        nodes),
      (node) => (
        node.type === "FunctionDeclaration" ?
        Visit.node(node, scope) :
        [])),
    (
      tag === "switch" ?
      Scope.Cache(
        scope,
        "BlockSwitchDiscriminant",
        (
          node.discriminant.type === "Literal" ?
          node.discriminant.value :
          Visit.node(node.discriminant, scope, false, null)),
        (cache1) => Scope.Cache(
          scope,
          "BlockSwitchMatched",
          Build.primitive(false),
          (cache2) => ArrayLite.flatMap(
            nodes,
            (node) => Build.If(
              Build.conditional(
                cache2(),
                Build.primitive(true),
                (
                  node.test === null ?
                  Build.sequence(
                    cache2(
                      Build.primitive(true)),
                    Build.primitive(true)) :
                  Build.conditional(
                    Build.binary(
                      "===",
                      cache1(),
                      Visit.node(node.test, scope, false, null)),
                    Build.sequence(
                      cache2(
                        Build.primitive(true)),
                      Build.primitive(true)),
                    Build.primitive(false)))),
              Scope.BLOCK(
                scope,
                null,
                [],
                [],
                (scope) => ArrayLite.flatMap(
                  node.consequent,
                  (node) => (
                    node.type === "FunctionDeclaration" ?
                    [] :
                    Visit.Node(node, scope, [])))),
              Scope.BLOCK(scope, null, [], [], (scope) => []))))) :
      ArrayLite.flatMap(
        nodes,
        (node, index) => (
          node.type === "FunctionDeclaration" ?
          [] :
          (
            Scope.$GetCompletion(scope) &&
            index < nodes.length - 1 &&
            valued()
          Visit.Node(node, scope, []))))));
