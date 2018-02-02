
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
  object: [object],
  array: [array],
  get: [identity, identity],
  set: [identity, identity, identity],
  delete: [identity, identity],
  invoke: [identity, identity, array],
  apply: [identity, array],
  construct: [identity, array],
  unary: [primitive, identity],
  binary: [primitive, identity, identity]};

exports.producers = {
  copy: [primitive, identity],
  read: [primitive, identity],
  discard: [primitive, identity],
  builtin: [primitive, identity],
  newtarget: [identity],
  this: [identity],
  arguments: [identity],
  catch: [identity],
  primitive: [identity],
  regexp: [identity],
  closure: [identity]};

exports.consumers = {
  drop: [identity],
  declare: [primitive, primitive, identity],
  write: [primitive, identity],
  test: [identity],
  with: [identity],
  throw: [identity],
  return: [identity],
  eval: [identity],
  terminate: [primitive, identity]};

exports.informers = {
  try: [],
  finally: [],
  block: [],
  program: [],
  callee: [identity],
  label: [primitive, primitive],
  leave: [primitive],
  break: [primitive, primitive]};
