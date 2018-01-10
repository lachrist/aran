
const ArrayLite = require("array-lite");
const Build = require("../../../build");
const Escape = require("../../../escape.js");

const identity = (argument) => argument;
const primitive = primitive;
const array = array;

exports.combiners = {
  object: [
    (array) => Build.array(
      ArrayLite.map(
        array,
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
    (identifier) => Build.read(identifier)],
  discard: [
    primitive,
    (identifier) => Build.discard(identifier)],
  builtin: [
    primitive,
    (identifier) => Build.read(identifier)],
  this: [
    () => Build.read("this")],
  arguments: [
    () => Build.read("arguments")],
  error: [
    () => Build.read("error")],
  primitive: [
    primitive],
  regexp: [
    (array) => Build.regexp(array[0], array[1])],
  closure: [
    (array) => Build.closure(array[0], array[1])]};

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
    () => Build.get(
      Build.read("arguments"),
      Build.primitive("length"))],
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
