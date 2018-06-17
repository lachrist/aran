
const ArrayLite = require("array-lite");

const identity = (argument) => argument;
const primitive = (primitive) => ARAN.build.primitive(primitive);
const read = (string) => ARAN.build.read(string);
const array = (expressions) => ARAN.build.array(expressions);
const order = (strings) => ARAN.build.array(
  ArrayLite.map(strings, ARAN.build.primitive));

exports.computers = {
  // Combiners //
  apply: [identity, array],
  binary: [primitive, identity, identity],
  construct: [identity, array],
  delete: [identity, identity],
  get: [identity, identity],
  invoke: [identity, identity, array],
  set: [identity, identity, identity],
  unary: [primitive, identity]};

exports.modifiers = {
  // Combiners //
  array: [identity],
  object: [order, identity],
  // Producers //
  arrival: [primitive, identity],
  begin: [primitive, identity],
  catch: [identity],
  closure: [identity],
  discard: [primitive, identity],
  load: [primitive, identity],
  primitive: [identity],
  read: [primitive, identity],
  regexp: [identity],
  // Consumers //
  completion: [identity],
  declare: [primitive, primitive, identity],
  eval: [identity],
  failure: [identity, identity],
  return: [read, identity],
  save: [primitive, identity],
  success: [identity, identity],
  test: [identity],
  throw: [identity],
  with: [identity],
  write: [primitive, identity]};

exports.informers = {
  // Informers //
  block: [],
  break: [primitive, primitive],
  copy: [primitive],
  drop: [],
  end: [identity],
  finally: [],
  label: [primitive, primitive],
  leave: [primitive],
  swap: [primitive, primitive],
  try: []};
