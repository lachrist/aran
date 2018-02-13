
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

exports.modifiers = {
  // stack //
  swap: [primitive, primitive, identity],
  copy: [primitive, identity],
  drop: [identity],
  // producers //
  read: [primitive, identity],
  discard: [primitive, identity],
  builtin: [primitive, identity],
  newtarget: [identity],
  this: [identity],
  arguments: [identity],
  catch: [identity],
  primitive: [identity],
  regexp: [identity],
  closure: [identity],
  // consumers //
  drop: [identity],
  declare: [primitive, primitive, identity],
  write: [primitive, identity],
  test: [identity],
  with: [identity],
  throw: [identity],
  return: [identity],
  eval: [identity],
  completion: [identity],
  success: [identity],
  failure: [identity]};

exports.informers = {
  begin: [],
  end: [],
  try: [],
  finally: [],
  block: [],
  label: [primitive, primitive],
  leave: [primitive],
  break: [primitive, primitive],
  callee: [identity]};
