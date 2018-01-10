
const ArrayLite = require("array-lite");
const Escape = require("../../../escape.js");

const identity = (argument) => argument;
const primitive = (primitive) => ARAN.build.primitive(primitive);
const array = (expressions) => ARAN.build.array(expressions);

exports.combiners = {
  object: [
    (expressions) => ARAN.build.array(
      ArrayLite.map(
        expressions,
        array))],
  array: [
    array],
  get: [
    identity,
    identity],
  set: [
    identity,
    identity,
    identity],
  delete: [
    identity,
    identity],
  invoke: [
    identity,
    identity,
    array],
  apply: [
    identity,
    array],
  construct: [
    identity,
    array],
  unary: [
    primitive,
    identity],
  binary: [
    primitive,
    identity,
    identity]};

exports.producers = {
  read: [
    primitive,
    (identifier) => ARAN.build.read(identifier)],
  discard: [
    primitive,
    (identifier) => ARAN.build.discard(identifier)],
  builtin: [
    primitive,
    (identifier) => ARAN.build.read(identifier)],
  this: [
    () => ARAN.build.read("this")],
  arguments: [
    () => ARAN.build.read("arguments")],
  error: [
    () => ARAN.build.read("error")],
  primitive: [
    primitive],
  regexp: [
    (array) => ARAN.build.regexp(array[0], array[1])],
  closure: [
    (array) => ARAN.build.closure(array[0], array[1])]};

exports.consumers = {
  declare: [
    primitive,
    primitive,
    identity],
  write: [
    primitive,
    identity],
  test: [
    identity],
  with: [
    identity],
  throw: [
    identity],
  return: [
    identity],
  eval: [
    identity]};

exports.informers = {
  enter: [
    primitive],
  leave: [
    primitive],
  program: [
    primitive],
  arrival: [
    primitive,
    primitive,
    () => ARAN.build.get(
      ARAN.build.read("arguments"),
      ARAN.build.primitive("length"))],
  label: [
    primitive],
  continue: [
    primitive],
  break: [
    primitive],
  copy: [
    primitive],
  drop: [
    primitive]};
