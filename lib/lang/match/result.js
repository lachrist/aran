"use strict";

const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;

const ArrayLite = require("array-lite");
const Mapping = require("./mapping.js");

const print = (primitive) => (
  typeof primitive === "string" ?
  global_JSON_stringify(primitive) :
  global_String(primitive));

exports.checkout = (result, callback) => {
  if (typeof result.identifier === "string") {
    return callback(false, result.identifier);
  }
  if (typeof result.label === "string") {
    return callback(false, result.label);
  }
  if (result.structural !== null) {
    return callback(false, result.structural);
  }
  return callback(true, {identifier:result.identifier, label:result.label});
};

exports.Empty = () => ({
  identifier: Mapping.Empty(),
  label: Mapping.Empty(),
  structural: null});

exports.SingleIdentifier = (path, identifier1, identifier2) => ({
  identifier: (
    (
      (identifier1 === "input") ===
      (identifier2 === "input")) ?
    (
      identifier1 === "input" ?
      Mapping.Empty() :
      Mapping.Single(identifier1, identifier2)) :
    `Input missmatch at ${path} between ${identifier1} and ${identifier2}`),
  label: Mapping.Empty(),
  structural: null});

exports.SingleLabel = (path, label1, label2) => ({
  identifier: Mapping.Empty(),
  label: Mapping.Single(label1, label2),
  structural: null});

exports.check = (path, primitive1, primitive2, callback) => (
  primitive1 !== primitive2 ?
  {
    identifier: Mapping.Empty(),
    label: Mapping.Empty(),
    structural: `Structural mismatch at ${path} between ${print(primitive1)} and ${print(primitive2)}`} :
  callback());

exports.combine = (path, result1, result2) => ({
  identifier: Mapping.combine(path, result1.identifier, result2.identifier),
  label: Mapping.combine(path, result1.label, result2.label),
  structural: result1.structural === null ? result2.structural : result1.structural});

exports.bindIdentifier = (path, identifiers1, identifiers2, result) => ({
  identifier: (
    (
      ArrayLite.has(identifiers1, "input") ||
      ArrayLite.has(identifiers2, "input")) ?
    `Input identifier in binding at ${path}` :
    Mapping.bind(path, identifiers1, identifiers2, result.identifier)),
  label: result.label,
  structural: result.structural});

exports.bindLabel = (path, labels1, labels2, result) => ({
  identifier: result.identifier,
  label: Mapping.bind(path, labels1, labels2, result.label),
  structural: result.structural});
