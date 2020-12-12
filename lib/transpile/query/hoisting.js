"use strict";

const ArrayLite = require("array-lite");

const export_self = (variable) => (
  variable.exports[variable.exports.length] = variable.name,
  variable);

const bind = {__proto__: null};

ArrayLite.forEach(
  ["param", "let", "const", "var"],
  (kind) => bind[kind] = (variable) => (
    variable.kind = kind,
    variable));

// type Node = estree.Statement
const make_check_export = (variables) => (node) => (
  node.type === "ExportNamedDeclaration" &&
  node.declaration === null &&
  node.source === null &&
  ArrayLite.forEach(
    node.specifiers,
    (specifier) => ArrayLite.forEach(
      variables,
      (variable) => (
        variable.name === specifier.local.name &&
        (variable.exports[variable.exports.length] = specifier.exported.name)))));

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
              [
                {
                  kind: null,
                  ghost: false,
                  name: node.name,
                  exports: []}] :
              [])))))));

// type Node = estree.Pattern
exports._get_parameter_hoisting = (nodes) => ArrayLite.map(
  ArrayLite.flatMap(nodes, collect),
  bind.param);

///////////
// Block //
///////////

// type Node = estree.Statement | estree.VariableDeclarator
const block_hoisting = (node) => (
  (
    node.type === "VariableDeclaration" &&
    node.kind !== "var") ?
  ArrayLite.map(
    ArrayLite.flatMap(node.declarations, block_hoisting),
    bind[node.kind]) :
  (
    node.type === "VariableDeclarator" ?
    collect(node.id) :
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
            (
              node.type === "ExportDefaultDeclaration" &&
              node.declaration.type === "ClassDeclaration") ||
            (
              node.type === "ExportNamedDeclaration" &&
              node.declaration !== null)) ?
          ArrayLite.map(
            block_hoisting(node.declaration),
            export_self) :
          [])))));

// type Node = estree.Statement
exports._get_block_hoisting = (nodes, _variables) => (
  _variables = ArrayLite.flatMap(nodes, block_hoisting),
  ArrayLite.forEach(nodes, make_check_export(_variables)),
  _variables);

/////////////
// Closure //
/////////////

const closure_hoisting = (node) => (
  node.type === "IfStatement" ?
  ArrayLite.concat(
    closure_hoisting(node.consequent),
    (
      node.alternate === null ?
      [] :
      closure_hoisting(node.alternate))) :
  (
    (
      node.type === "LabeledStatement" ||
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement") ?
    closure_hoisting(node.body) :
    (
      node.type === "ForStatement" ?
      ArrayLite.concat(
        (
          (
            node.init !== null &&
            node.init.type === "VariableDeclaration") ?
          closure_hoisting(node.init) :
          []),
        closure_hoisting(node.body)) :
      (
        (
          node.type === "ForOfStatement" ||
          node.type === "ForInStatement") ?
        ArrayLite.concat(
          (
            node.left.type === "VariableDeclaration" ?
            closure_hoisting(node.left) :
            []),
          closure_hoisting(node.body)) :
        (
          node.type === "BlockStatement" ?
          ArrayLite.flatMap(node.body, closure_hoisting) :
          (
            node.type === "TryStatement" ?
            ArrayLite.concat(
              closure_hoisting(node.block),
              (
                node.handler !== null ?
                closure_hoisting(node.handler) :
                []),
              (
                node.finalizer !== null ?
                closure_hoisting(node.finalizer) :
                [])) :
            (
              node.type === "CatchClause" ?
              closure_hoisting(node.body) :
              (
                node.type === "SwitchStatement" ?
                ArrayLite.flatMap(node.cases, closure_hoisting) :
                (
                  node.type === "SwitchCase" ?
                  ArrayLite.flatMap(node.consequent, closure_hoisting) :
                  (
                    (
                      node.type === "VariableDeclaration" &&
                      node.kind === "var") ?
                    ArrayLite.map(
                      ArrayLite.flatMap(node.declarations, closure_hoisting),
                      bind.var) :
                    (
                      node.type === "VariableDeclarator" ?
                      collect(node.id) :
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
                            (
                              node.type === "ExportDefaultDeclaration" &&
                              node.declaration.type === "FunctionDeclaration") ||
                            (
                              node.type === "ExportNamedDeclaration" &&
                              node.declaration !== null)) ?
                          ArrayLite.map(
                            closure_hoisting(node.declaration),
                            export_self) :
                          [])))))))))))));

exports._get_closure_hoisting = (nodes, _variables) => (
  _variables = ArrayLite.concat(
    ArrayLite.flatMap(nodes, block_hoisting),
    ArrayLite.flatMap(nodes, closure_hoisting)),
  ArrayLite.forEach(nodes, make_check_export(_variables)),
  _variables);
