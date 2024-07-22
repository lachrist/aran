
const Visit = require("./index.js");
const Label = require("./label.js");
const Identifier = require("./identifier.js");

exports.BLOCK = ({1:labels, 2:identifiers, 3:statements}, namespace, tag) => ArrayLite.reduce(
  labels,
  (node, label) => ({
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: Label(label)},
    body: node}),
  {
    type: "BlockStatement",
    body: ArrayLite.concat(
      (
        tag === "program" ?
        [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarators: [
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: Identifier("@this")},
                init: {
                  type: "ThisExpression"}}]}] :
        (
          tag === "closure" ?
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name:  Identifier("@new.target")},
                  init: {
                    type: "MetaProperty",
                    meta: {
                      type: "Identifier",
                      name: "new" },
                    property: {
                      type: "Identifier",
                      name: "target" }}},
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: Identifier("@this")},
                  init: {
                    type: "ThisExpression" }},
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: Identifier("@arguments")},
                  init: {
                    type: "Identifier",
                    name: "arguments" }}]}] :
          [])),
      (
        identifiers.length ?
        [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarators: ArrayLite.map(
              identifiers,
              (identifier) => ({
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: Identifier(identifier)},
                init: null}))}] :
        []),
      ArrayLite.map(
        statements,
        (statement) => Visit.statement(statement, namespace)))});
