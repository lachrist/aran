
const ArrayLite = require("array-lite");
const Escape = require("../../../escape.js");

const identity = (argument) => argument;
const primitive = (primitive) => ARAN.build.primitive(primitive);
const array = (expressions) => ARAN.build.array(expressions);
const object = (expressions) => ARAN.build.array(
  ArrayLite.map(
    expressions,
    array));

exports.combiners = {
  object: [
    object],
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
    identity],
  discard: [
    primitive,
    identity],
  builtin: [
    primitive,
    identity],
  this: [
    identity],
  arguments: [
    identity],
  error: [
    identity],
  primitive: [
    primitive],
  regexp: [
    identity],
  closure: [
    identity]};

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
    identity],
  terminate: [
    identity]};

exports.informers = {
  try: [],
  finally: [],
  block: [],
  program: [],
  label: [
    primitive],
  leave: [
    primitive],
  continue: [
    primitive],
  break: [
    primitive],
  copy: [
    primitive],
  drop: []};
