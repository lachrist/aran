
const ArrayLite = require("array-lite");
const Array_from = Array.from;

const Error = global.Error;

////////////////////
// Variable Names //
////////////////////

const pnames = (pattern) => {
  const patterns = [pattern];
  let length = patterns.length;
  const names = [];
  while (length) {
    const pattern = patterns[--length];
    switch (pattern.type) {
      case "Identifier":
        names[names.length] = pattern.name;
        break;
      case "Property":
        patterns[length++] = pattern.value;
        break;
      case "RestElement":
        patterns[length++] = pattern.argument;
        break;
      case "AssignmentPattern":
        patterns[length++] = pattern.left;
        break;
      case "ObjectPattern":
        for (let index = 0; index < pattern.properties.length; index++)
          patterns[length++] = pattern.properties[index];
        break;
      case "ArrayPattern":
        for (let index = 0; index < pattern.elements.length; index++)
          patterns[length++] = pattern.elements[index];
        break;
      default: throw new Error("Unknown pattern type: "+pattern.type);
    }
  }
  return names;
};

const dnames = (declaration) => pnames(declaration.id);

exports.VarNames = (nodes) => {
  nodes = Array_from(nodes);
  let length = nodes.length;
  const names = [];
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
        ArrayLite.forEach(ArrayLite.flatMap(node.declarations, dnames), (name) => {
          if (!ArrayLite.includes(names, name)) {
            names[names.length] = name;
          }
        });
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(names, node.id.name)) {
        names[names.length] = node.id.name;
      }
    }
  }
  return names;
};

const bnloop = (nodes, kind) => (nodes) => ArrayLite.flatMap(
  nodes,
  (node) => (
    (
      node.type === "VariableDeclaration" &&
      node.kind === kind) ?
    ArrayLite.flatMap(node.declarations, dnames) :
    []));

exports.LetNames = (nodes) => bnloop(nodes, "lets");

exports.ConstNames = (nodes) => bnloop(nodes, "const");

exports.DeclarationNames = dnames;

exports.PatternNames = pnames;

//////////////////////////
// Function Declaration //
//////////////////////////

exports.FunctionDeclarations = (nodes) => ArrayLite.filter(
  nodes,
  (node) => node.type === "FunctionDeclaration");

exports.NonFunctionDeclarations = (nodes) => ArrayLite.filter(
  nodes,
  (node) => node.type !== "FunctionDeclaration");

////////////////
// Completion //
////////////////

const loop = (node, nodes) => {
  // Duplicate //
  if (node.type === "IfStatement") {
    return ArrayLite.concat(
      loop(node.consequent, []),
      node.alternate ? loop(node.alternate, []) : []); 
  }
  if (node.type === "TryStatement") {
    return ArrayLite.concat(
      loop(node.block, []),
      node.handler ? loop(node.handler.body, []) : [],
      [{label:null, nodes:[node]}]);
  }
  if (node.type === "WithStatement") {
    return loop(node.body, []);
  }
  // Labels Catch //
  if (node.type === "LabeledStatement") {
    return ArrayLite.map(loop(node.body, nodes), ({label, nodes}) => ({
      label: label === node.label.name ? null : label,
      nodes: nodes
    }));
  }
  if (node.type === "WhileStatement" || node.type === "DoWhileStatement" || node.type === "ForStatement" || node.type === "ForInStatement" || node.type === "ForOfStatement") {
    return ArrayLite.map(loop(node.body, []), ({label, nodes}) => ({
      label: label === "@break" || label === "@continue" ? null : label,
      nodes: nodes
    }));
  }
  if (node.type === "SwitchStatement") {
    return ArrayLite.map(loop({
      type:"BlockStatement",
      body: ArrayLite.flatMap(node.cases, ({consequent:nodes}) => nodes)
    }, []), ({label, nodes}) => ({
      label: label === "@break" ? null : label,
      nodes: nodes
    }));
  }
  // Chain //
  if (node.type === "BlockStatement" || node.type === "Program") {
    const completions = [];
    ArrayLite.forEach(node.body, (node) => {
      nodes = ArrayLite.flatMap(loop(node, nodes), ({label, nodes}) => {
        if (label === null)
          return nodes;
        completions[completions.length] = {label, nodes};
        return [];
      });
    });
    completions[completions.length] = {label:null, nodes:nodes};
    return completions;
  }
  // Stop //
  if (node.type === "ExpressionStatement") {
    return [{
      label: null,
      nodes: [node]
    }];
  }
  if (node.type === "VariableDeclaration" || node.type === "DebuggerStatement" || node.type === "FunctionDeclaration" || node.type === "EmptyStatement") {
    return [{
      label: null,
      nodes
    }];
  }
  if (node.type === "ContinueStatement") {
    return [{
      label: node.label ? node.label.name : "@continue",
      nodes
    }];
  }
  if (node.type === "BreakStatement") {
    return [{
      label: node.label ? node.label.name : "@break",
      nodes
    }];
  }
  if (node.type === "ThrowStatement") {
    return [];
  }
  if (node.type === "ReturnStatement") {
    throw new Error("Return statement should not appear here");
  }
  throw new Error("Unrecognized statement type: "+node.type);
};

exports.CompletionStatements = (node) => ArrayLite.flatMap(loop(node, []), ({label, nodes}) => {
  if (label !== null)
    throw new Error("Label escape: "+label);
  return nodes;
});

////////////
// Mixbag //
////////////

exports.IsUseStrict = (node) => (
  node.type === "ExpressionStatement" &&
  node.expression.type === "Literal" &&
  node.expression.value === "use strict");

exports.IsDirectEvalCall = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  ArrayLite.every(
    node.arguments,
    (node) => node.type !== "SpreadElements"))

exports.IsArgumentsFree = (objects) => {
  objects = Array_from(objects);
  let length = objects.length;
  while (length) {
    const object = objects[--length];
    if (object.type !== "FunctionExpression" || object.type !== "FunctionDeclaration") {
      if (object.type === "Identifier" && object.name === "arguments")
        return false;
      if (object.type === "CallExpression" && object.callee.type === "Identifier" && object.callee.name === "eval")
        return false;
      for (let key in object) {
        if (object[key] && typeof object[key] === "object") {
          objects[length++] = object[key];
        }
      }
    }
  }
  return true;
};
