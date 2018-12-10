
const ArrayLite = require("array-lite");
const Query = require("../query.js");
const Build = require("../build.js");
const Lexical = require("../lexical.js");
const Visit = require("./index.js");

const Array_isArray = Array.isArray;

const common = (tag, names1, names2, names3, nodes, scope) => Lexical.EXTEND(
  tag,
  ArrayLite.concat(
    names2,
    names3,
    ArrayLite.flatMap(
      node.body,
      (node) => (
        node.type === "VariableDeclaration" ?
        Query.DeclarationNames("let", node) :
        []))),
  ArrayLite.flatMap(
    node.body,
    (node) => (
      node.type === "VariableDeclaration" ?
      Query.DeclarationNames("const", node) :
      [])),
  (scope) => ArrayLite.concat(
    ArrayLite.flatMap(
      names1,
      (name) => Build.Expression(
        Build.apply(
          Build.builtin("AranDefineDataProperty"),
          Build.primitive(void 0),
          [
            Build.builtin("global"),
            Build.primitive(name),
            Build.primitive(void 0),
            Build.primitive(true),
            Build.primitive(true),
            Build.primitive(false)]))),
    ArrayLite.flatMap(
      names2,
      (name) => Build.Expression(
        Lexical.declare(
          name,
          Build.input(name),
          Build.primitive(void 0)))),
    ArrayLite.flatMap(
      names3,
      (name) => Build.Expression(
        Lexical.declare(
          name,
          Build.primitive(void 0),
          Build.primitive(void 0)))),
    ArrayLite.flatMap(
      nodes,
      (node) => (
        node.type === "FunctionDeclaration" ?
        Visit.Statement(node, scope) :
        [])),
    ArrayLite.flatMap(
      nodes,
      (node) => (
        node.type !== "FunctionDeclaration" ?
        Visit.Statement(node, scope) :
        []))),
  scope);

exports.WITH = (token, node, scope) => common(
  token,
  [],
  [],
  [],
  (
    node.type === "BlockStatement" ?
    node.body :
    [node]),
  scope);

exports.BODY = (node, scope) => common(
  false,
  [],
  [],
  [],
  (
    node ?
    (
      node.body.type === "BlockStatement" ?
      node.body :
      [node]) :
    []),
  scope);

exports.CLOSURE = (node, scope) => common(
  false,
  [],
  [],
  ArrayLite.flatMap(node.body, variables),
  node.body,
  scope);

exports.PROGRAM = (node, scope) => common(
  false,
  (
    Array_isArray(scope) ?
    scope :
    []),
  (
    scope && node.AranStrict ?
    [] :
    ArrayLite.flatMap(node.body, variables),),
  (
    scope || node.AranStrict ?
    ArrayLite.flatMap(node.body, variables), :
    []),
  node.body,
  (
    Array_isArray(scope) ?
    null :
    scope));

exports.SWITCH = (token, pairs, scope) => Lexical.EXTEND(
  false,
  ArrayLite.flatMap(
    pairs,
    (pair) => (
      (
        pair[0] &&
        pair[1].type === "VariableDeclaration") ?
      Query.DeclarationNames("let", pair[1]) :
      [])),
  ArrayLite.flatMap(
    pairs,
    (pair) => (
      (
        pair[0] &&
        pair[1].type === "VariableDeclaration") ?
      Query.DeclarationNames("const", pair[1]) :
      [])),
  (scope) => ArrayLite.concat(
    ArrayLite.flatMap(
      pairs,
      (pair) => (
        (
          pair[0] &&
          pair[1].type === "FunctionDeclaration") ?
        Visit.Statement(pair[1], scope))),
    ArrayLite.flatMap(
      pairs,
      (pair) => (
        (
          pair[0] ?
          (
            pair[1].type === "FunctionDeclaration" ?
            [] :
            Visit.Statement(pair[1], scope)) :
          [pair[1]]))))
  scope);
