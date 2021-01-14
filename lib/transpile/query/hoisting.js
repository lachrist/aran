"use strict";

const ArrayLite = require("array-lite");

const export_self = (variable) => (
  variable.exports[variable.exports.length] = variable.name,
  variable);

const export_default = (variable) => (
  variable.exports[variable.exports.length] = "default",
  variable);

const bind = {__proto__: null};

ArrayLite.forEach(
  ["param", "let", "const", "var"],
  (kind) => bind[kind] = (identifier) => ({
    kind,
    name: identifier,
    ghost: false,
    exports: []}));

/////////////
// Pattern //
/////////////

// type Node = Maybe (estree.Pattern | estree.AssignmentProperty | estree.CallExpression | estree.MemberExpression)
const collect = (node) => (
  node === null ?
  [] :
  (
    node.type === "RestElement" ?
    collect(node.argument) :
    (
      node.type === "Property" ?
      collect(node.value) :
      (
        node.type === "AssignmentPattern" ?
        collect(node.left) :
        (
          node.type === "ArrayPattern" ?
          ArrayLite.flatMap(node.elements, collect) :
          (
            node.type === "ObjectPattern" ?
            ArrayLite.flatMap(node.properties, collect) :
            (
              node.type === "Identifier" ?
              [node.name] :
              [])))))));

// type Node = estree.VariableDeclarator
const collect_id = (node) => collect(node.id);

exports.getPatternIdentifierArray = collect;

// type Node = estree.Pattern
exports.getParameterHoisting = (node) => ArrayLite.map(
  collect(node),
  bind.param);

///////////
// Block //
///////////

// type Node = estree.Statement | estree.VariableDeclarator
const shallow_hoisting = (node) => (
  (
    node.type === "VariableDeclaration" &&
    node.kind !== "var") ?
  ArrayLite.map(
    ArrayLite.flatMap(node.declarations, collect_id),
    bind[node.kind]) :
  (
    (
      node.type === "ClassDeclaration" &&
      node.id !== null) ?
    [
      {
        kind: "class",
        ghost: false,
        name: node.id.name,
        exports: []}] :
    (
      node.type === "ImportDeclaration" ?
      ArrayLite.map(
        node.specifiers,
        (specifier) => ({
          kind: "import",
          ghost: true,
          name: specifier.local.name,
          exports: [],
          import: (
            specifier.type === "ImportNamespaceSpecifier" ?
            null :
            (
              specifier.type === "ImportDefaultSpecifier" ?
              "default" :
              specifier.imported.name)),
          source: node.source.value})) :
      (
        (
          node.type === "ExportDefaultDeclaration" &&
          node.declaration.type === "ClassDeclaration") ?
        ArrayLite.map(
          shallow_hoisting(node.declaration),
          export_default) :
        (
          (
            node.type === "ExportNamedDeclaration" &&
            node.declaration !== null) ?
          ArrayLite.map(
            shallow_hoisting(node.declaration),
            export_self) :
          [])))));

// type Node = estree.BlockStatement | estree.Program
exports.getShallowHoisting = shallow_hoisting;

/////////////
// Closure //
/////////////

const deep_hoisting = (node) => (
  node.type === "IfStatement" ?
  ArrayLite.concat(
    deep_hoisting(node.consequent),
    (
      node.alternate === null ?
      [] :
      deep_hoisting(node.alternate))) :
  (
    (
      node.type === "LabeledStatement" ||
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement") ?
    deep_hoisting(node.body) :
    (
      node.type === "ForStatement" ?
      ArrayLite.concat(
        (
          (
            node.init !== null &&
            node.init.type === "VariableDeclaration") ?
          deep_hoisting(node.init) :
          []),
        deep_hoisting(node.body)) :
      (
        (
          node.type === "ForOfStatement" ||
          node.type === "ForInStatement") ?
        ArrayLite.concat(
          (
            node.left.type === "VariableDeclaration" ?
            deep_hoisting(node.left) :
            []),
          deep_hoisting(node.body)) :
        (
          node.type === "BlockStatement" ?
          ArrayLite.flatMap(node.body, deep_hoisting) :
          (
            node.type === "TryStatement" ?
            ArrayLite.concat(
              deep_hoisting(node.block),
              (
                node.handler !== null ?
                deep_hoisting(node.handler) :
                []),
              (
                node.finalizer !== null ?
                deep_hoisting(node.finalizer) :
                [])) :
            (
              node.type === "CatchClause" ?
              deep_hoisting(node.body) :
              (
                node.type === "SwitchStatement" ?
                ArrayLite.flatMap(node.cases, deep_hoisting) :
                (
                  node.type === "SwitchCase" ?
                  ArrayLite.flatMap(node.consequent, deep_hoisting) :
                  (
                    (
                      node.type === "VariableDeclaration" &&
                      node.kind === "var") ?
                    ArrayLite.map(
                      ArrayLite.flatMap(node.declarations, collect_id),
                      bind.var) :
                    (
                      (
                        node.type === "FunctionDeclaration" &&
                        node.id !== null) ?
                      [
                        {
                          kind: "function",
                          ghost: false,
                          name: node.id.name,
                          exports: []}] :
                      (
                        (
                          node.type === "ExportDefaultDeclaration" &&
                          node.declaration.type === "FunctionDeclaration") ?
                        ArrayLite.map(
                          deep_hoisting(node.declaration),
                          export_default) :
                        (
                          (
                            node.type === "ExportNamedDeclaration" &&
                            node.declaration !== null)) ?
                          ArrayLite.map(
                            deep_hoisting(node.declaration),
                            export_self) :
                          []))))))))))));

// type Node = estree.BlockStatement | estree.Program
exports.getDeepHoisting = deep_hoisting;

/////////////
// Exports //
/////////////

exports.setVariableExports = (node, variables) => (
  node.type === "ExportNamedDeclaration" &&
  node.source === null &&
  ArrayLite.forEach(
    node.specifiers,
    (node) => ArrayLite.forEach(
      variables,
      (variable) => (
        variable.name === node.local.name &&
        (variable.exports[variable.exports.length] = node.exported.name)))));
