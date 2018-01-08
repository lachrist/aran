
const ArrayLite = require("array-lite");
const Build = require("../../../build");
const Escape = require("../../../escape.js");

exports.combiners = {
  object: [
    (array) => Build.array(
      ArrayLite.map(
        array,
        Build.array))],
  array: [
    Build.array],
  get: [
    null,
    null],
  set: [
    null,
    null,
    null],
  delete: [
    null,
    null],
  invoke: [
    null,
    null,
    Build.array],
  apply: [
    null,
    Build.array],
  construct: [
    null,
    Build.array],
  unary: [
    Build.primitive,
    null],
  binary: [
    Build.primitive,
    null,
    null]};

exports.producers = {
  read: [
    Build.read,
    Build.primitive],
  discard: [
    Build.discard,
    Build.primitive],
  builtin: [
    (identifier) => Build.read(
      Escape(identifier)),
    Build.primitive],
  this: [
    () => Build.read("this")],
  arguments: [
    () => Build.read("arguments")],
  error: [
    () => Build.read("error")],
  primitive: [
    Build.primitive],
  regexp: [
    (array) => Build.regexp(array[0], array[1])],
  closure: [
    (array) => Build.closure(array[0], array[1])]};

exports.consumers = {
  declare: [
    null,
    Build.primitive,
    Build.primitive],
  write: [
    null,
    Build.primitive],
  test: [
    null],
  with: [
    null],
  throw: [
    null],
  return: [
    null],
  eval: [
    null]};

exports.informers = {
  Enter: [
    Build.primitive],
  Leave: [
    Build.primitive],
  Program: [
    Build.primitive],
  Closure: [
    Build.primitive,
    Build.primitive,
    () => Build.get(
      Build.read("arguments"),
      Build.primitive("length"))],
  Label: [
    Build.primitive],
  Continue: [
    Build.prmitive],
  Break: [
    Build.primitive],
  Copy: [
    Build.primitive],
  Drop: [
    Build.primitive]};
