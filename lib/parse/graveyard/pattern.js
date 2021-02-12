"use strict";

const ArrayLite = require("array-lite");

const isNotNull = (any) => any !== null;

const visit = (node) => visitors[node.type](node);

const visitors = {
  __proto__: null,
  Identifier: (node) => [node.name],
  MemberExpression: (node) => [],
  CallExpression: (node) => [],
  RestElement: (node) => visit(node.argument),
  ArrayPattern: (node) => ArrayLite.flatMap(
    ArrayLite.filter(node.elements, isNotNull),
    visit),
  Property: (node) => visit(node.value),
  ObjectPattern: (node) => ArrayLite.flatMap(node.properties, visit)};

exports.collect = visit;