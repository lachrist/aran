
const ArrayLite = require("array-lite");
const Build = require("../../../build");
const Escape = require("../../../escape.js");

const identity = (argument) => argument;

exports.combiners = {
  object: [
    (array) => Build.array(
      ArrayLite.map(
        array,
        (expressions) => Build.array(expressions)))],
  array: [
    Build.array],
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
    Build.array],
  apply: [
    identity,
    Build.array],
  construct: [
    identity,
    Build.array],
  unary: [
    Build.primitive,
    identity],
  binary: [
    Build.primitive,
    identity,
    identity]};

exports.producers = {
  read: [
    Build.primitive,
    Build.read],
  discard: [
    Build.primitive,
    Build.discard],
  builtin: [
    Build.primitive,
    Build.read],
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
    identity],
  write: [
    Build.primitive,
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
    Build.primitive],
  break: [
    Build.primitive],
  copy: [
    Build.primitive],
  drop: [
    Build.primitive]};
