
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
    Build.primitive,
    Build.read],
  discard: [
    Build.primitive,
    Build.discard],
  builtin: [
    Build.primitive,
    (identifier) => Build.read(
      Escape(identifier))],
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
    Build.primitive,
    Build.primitive,
    null],
  write: [
    Build.primitive,
    null],
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
  enter: [
    Build.primitive],
  leave: [
    Build.primitive],
  program: [
    Build.primitive],
  arrival: [
    Build.primitive,
    Build.primitive,
    () => Build.get(
      Build.read("arguments"),
      Build.primitive("length"))],
  label: [
    Build.primitive],
  continue: [
    Build.prmitive],
  break: [
    Build.primitive],
  copy: [
    Build.primitive],
  drop: [
    Build.primitive]};
