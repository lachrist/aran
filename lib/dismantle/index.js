
const Visit = require("./visit");

const Error = global.Error;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const Reflect_defineProperty = Reflect.defineProperty;

module.exports = (node, serial, nodes, scopes) => {
  const descriptor = Reflect_getOwnPropertyDescriptor(global, "ARAN")
  if (descriptor && !descriptor.configurable)
    throw new Error("ARAN must be a configurable property of the global object");
  Reflect_defineProperty(global, "ARAN", {
    configurable: true,
    value: {scopes,nodes}
  });
  const scope = serial ? JSON_parse(JSON_stringify(scopes[serial])) : null;
  const result = Visit.NODE(node, scope, false);
  if (descriptor)
    Reflect_defineProperty(global, "ARAN", descriptor);
  else
    delete global.ARAN;
  return result;
};
