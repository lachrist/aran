
const ArrayLite = require("array-lite");
const Sanitize = require("../sanitize.js");
const Visit = require("./index.js");

exports.BLOCK = ({1:identifiers, 2:statements}, namespace, tag) => (
  tag !== "switch" ?
  {
    type: tag === "program" ? "Program" : "BlockStatement",
    body: ArrayLite.concat(
      (
        identifiers.length ?
        [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarations: ArrayLite.map(identifiers, (identifier) => ({
              type: "VariableDeclarator",
              id: {
                type: "Identifier",
                name: Sanitize(identifier)},
              init: null
            }))}] :
        []),
      ArrayLite.map(
        statements,
        (statement) => Visit.statement(statement, namespace)))} :
  {
    type: "BlockStatement",
    body: ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.slice(
          statements,
          0,
          ArrayLite.findIndex(statements, (statement) => statement.type === "Case") - 1),
        (statement) => Visit.statement(statement, namespace)),
      [
        {
          type: "SwitchStatement",
          discriminant: {
            type: "Literal",
            value: true},
          cases: ArrayLite.reduce(
            statements,
            (statement, array) => (
              (
                statement.type === "Case" ?
                array[array.length] = Visit.statement(statement, namespace) :
                (
                  array[length] ?
                  array[array.length-1].consequent[array[array.length-1].consequent.length-1] = Visit.statement(statement, namespace) :
                  null)),
              array),
            [])}])});
