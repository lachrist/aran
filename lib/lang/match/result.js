"use strict";

const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;

const ArrayLite = require("array-lite");
const Mapping = require("./mapping.js");

const print = (primitive) => (
  typeof primitive === "string" ?
  global_JSON_stringify(primitive) :
  global_String(primitive));

exports._checkout = (result, success, failure) => {
  if (typeof result.identifier === "string") {
    return failure(result.identifier);
  }
  if (typeof result.label === "string") {
    return failure(result.label);
  }
  if (result.structural !== null) {
    return failure(result.structural);
  }
  return success(result.identifier, result.label);
};

exports._empty = () => ({
  identifier: Mapping._empty(),
  label: Mapping._empty(),
  structural: null});

exports._single_identifier = (path, identifier1, identifier2) => ({
  identifier: (
    (
      (identifier1 === "input") ===
      (identifier2 === "input")) ?
    (
      identifier1 === "input" ?
      Mapping._empty() :
      Mapping._single(identifier1, identifier2)) :
    `Input missmatch at ${path} between ${identifier1} and ${identifier2}`),
  label: Mapping._empty(),
  structural: null});

exports._single_label = (path, label1, label2) => ({
  identifier: Mapping._empty(),
  label: Mapping._single(label1, label2),
  structural: null});

exports._check = (path, primitive1, primitive2, callback) => (
  primitive1 !== primitive2 ?
  {
    identifier: Mapping._empty(),
    label: Mapping._empty(),
    structural: `Structural mismatch at ${path} between ${print(primitive1)} and ${print(primitive2)}`} :
  callback());

exports._combine = (path, result1, result2) => ({
  identifier: Mapping._combine(path, result1.identifier, result2.identifier),
  label: Mapping._combine(path, result1.label, result2.label),
  structural: result1.structural === null ? result2.structural : result1.structural});

exports._bind_identifier = (path, identifiers1, identifiers2, result) => ({
  identifier: (
    (
      ArrayLite.has(identifiers1, "input") ||
      ArrayLite.has(identifiers2, "input")) ?
    `Input identifier in binding at ${path}` :
    Mapping._bind(path, identifiers1, identifiers2, result.identifier)),
  label: result.label,
  structural: result.structural});

exports._bind_label = (path, labels1, labels2, result) => ({
  identifier: result.identifier,
  label: Mapping._bind(path, labels1, labels2, result.label),
  structural: result.structural});
