
const ArrayLite = require("array-lite");
let Build = require("../build.js");
const Property = require("../property.js");
const Data = require("./data.js");

const Error = global.Error;

Build = Object.assign({}, Build, {
  read: Build._read,
  write: Build._write,
  BLOCK: Build._BLOCK
});

const special = (identifier) => (
  typeof identifier === "number" ||
  identifier === "this" ||
  identifier === "new.target");

const lookup = (scope, identifier, internal, closures) => {
  const {tag, binding, token, parent} = Data.GetLookup(scope, identifier);
  if (tag === "closure")
    return lookup(parent, identifier, false, closures);
  if (tag === "miss") {
    if (special(identifier))
      throw new Error("Miss of hidden variable or this/new.target: "+identifier);
    return closures.miss();
  }
  if (tag === "with") {
    if (special(identifier))
      return lookup(parent, identifier, internal, closures);
    return Build.conditional(
      Build.conditional(
        Build.binary(
          "in",
          Build.read(token),
          Build.primitive(identifier)),
        Build.conditional(
          Property.getunsafe(
            Build.read(scope, token),
            Build.builtin("Symbol.unscopables")),
          Property.getunsafe(
            Property.getunsafe(
              Build.builtin(token),
              Build.builtin("Symbol.unscopables")),
            Build.primitive(identifier)),
          Build.primitive(false)),
        Build.primitive(true)),
      lookup(parent, identifier, internal, closures),
      closure.with(token));
  }
  if (tag !== "hit")
    throw new Error("Unknown tag: "+tag);
  if (binding.initialized)
    return closures.hit(binding.writable);
  if (special(identifier))
    throw new Error("Special identifier should always be initialized: "+identifier);
  if (internal)
    return Build.apply(
      Build.builtin("AranThrowReferenceError"),
      Build.primitive(void 0),
      [
        Build.primitive(identifier+" is not defined")]);
  binding.sticker = ARAN.counter++;
  return Build.conditional(
    Build.read(binding.sticker),
    Build.closures.hit(binding.writable),
    Build.apply(
      Build.builtin("AranThrowReferenceError"),
      Build.primitive(void 0),
      [
        Build.primitive(identifier+" is not defined")]));
};

exports.token = (scope, expression, closure) => {
  const token = ++ARAN.root.AranCounter;
  Data.SetBinding(scope, token, {initialized:true, writable:true, sticker:null});
  return Build.write(token, expression, closure(token));
};

exports.Token = (scope, expression, closure) => {
  const token = ++ARAN.root.AranCounter;
  Data.SetBinding(scope, token, {initialized:true, writable:true, sticker:null});
  return ArrayLite.concat(
    Build.Write(token, expression),
    closure(token));
};

exports.BLOCK = (scope, identifiers1, identifiers2, closure) => {
  scope = Data.ExtendBlock(scope);
  ArrayLite.forEach(identifiers1, (identifier) => {
    Data.SetBinding(scope, identifier, {initialized:false, writable:true, sticker:null});
  });
  ArrayLite.forEach(identifiers2, (identifier) => {
    Data.SetBinding(scope, identifier, {initialized:false, writable:true, sticker:null});
  });
  const statements = closure(scope);
  const identifiers3 = Data.GetIdentifiers(scope);
  const identifiers4 = ArrayLite.filter(
    ArrayLite.map(
      identifiers3,
      (identifier) => Data.GetLookup(scope, identifier).binding.sticker),
    (sticker) => sticker);
  return Build.BLOCK(
    ArrayLite.concat(identifiers3, identifiers4),
    ArrayLite.concat(
      ArrayLite.flatMap(
        identifiers4,
        (identifier) => Build.Write(
          identifier,
          Build.primitive(false))),
      statements));
};

exports.initialize = (scope, identifier, expression1, expression2) => {
  const {tag, binding} = Data.GetLookup(scope, identifier);
  if (tag !== "hit")
    throw new Error("Out of bound initialization: "+identifier);
  if (binding.initialized)
    throw new Error("Duplicate initialization: "+identifier);
  binding.initialized = true;
  if (!binding.sticker)
    return Build.write(identifier, expression1, expression2);
  return Build.write(
    identifier,
    expression1,
    Build.write(
      binding.sticker,
      Build.primitive(true),
      expression2));
};

exports.Initialize = (scope, identifier, expression) => {
  const {tag, binding} = Data.GetLookup(scope, identifier);
  if (tag !== "hit")
    throw new Error("Out of bound initialization: "+identifier);
  if (binding.initialized)
    throw new Error("Duplicate initialization: "+identifier);
  binding.initialized = true;
  if (!binding.sticker)
    return Build.Write(identifier, expression);
  return ArrayLite.concat(
    Build.Write(identifier, expression),
    Build.Write(
      binding.sticker,
      Build.primitive(true)))
};

exports.read = (scope, identifier) => lookup(
  scope,
  identifier,
  true,
  {
    with: (token) => Property.getunsafe(
      Build.read(token),
      Build.primitive(identifier)),
    hit: (writable) => Build.read(identifier),
    miss: () => Build.conditional(
      Build.apply(
        Build.builtin("AranHold"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(identifier)]),
      Property.getunsafe(
        Build.builtin("global"),
        Build.primitive(identifier)),
      Build.apply(
        Build.builtin("AranThrowReferenceError"),
        Build.primitive(void 0),
        [
          Build.primitive(identifier+" is not defined")]))});

exports.typeof = (identifier, scope) => lookup(
  scope,
  identifier,
  true,
  {
    with: (token) => Build.unary(
      "typeof",
      Property.getunsafe(
        Build.builtin(token),
        Build.primitive(identifier))),
    hit: (writable) => Build.unary(
      "typeof",
      Build.read(identifier)),
    miss: () => Build.unary(
      "typeof",
      Property.getunsafe(
        Build.builtin("global"),
        Build.primitive(identifier)))});

exports.delete = (scope, identifier) => lookup(
  scope,
  identifier,
  true,
  {
    with: (token) => Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [
        Build.read(token),
        Build.primitive(identifier)]),
    hit: (writabel) => Build.primitive(false),
    miss: () => Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [
        Build.builtin("global"),
        Build.primitive(identifier)])});

exports.Write = (scope, identifier, expression) => {
  const {tag, writable} = Data.GetLookup(scope, identifier)
  return (
    tag === "hit" ?
    (
      writable ?
      Build.Write(identifier, expression) :
      Build.Expression(
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Build.primitive(void 0),
          [
            Build.primitive("cannot assign constant variable: "+identifier)]))) :
    Build.Expression(
      exports.write(
        scope,
        identifier,
        expression,
        Build.primitive(void 0))));
};

exports.write = (scope, identifier, expression1, expression2) => {
  const hit = (writable, expression1, expression2) => (
    writable ?
    Build.write(identifier, expression1, expression2) :
    Build.apply(
      Build.builtin("AranThrowTypeError"),
      Build.primitive(void 0),
      [
        Build.primitive("Assignment to a constant variable")]));
  const miss = (expression1, expression2) => (
    Data.GetStrict(scope) ?
    Build.conditional(
      Build.apply(
        Build.builtin("AranHold"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(identifier)]),
      Build.conditional(
        Build.apply(
          Build.builtin("Reflect.set"),
          Build.primitive(void 0),
          [
            Build.builtin("global"),
            Build.primitive(identifier),
            expression1]),
        expression2,
        Build.apply(
          Build.builtin("AranThrowTypError"),
          Build.primitive(void 0),
          [
            Build.primitive("Cannot assign object property")])),
      Build.apply(
        Build.builtin("AranThrowReferenceError"),
        Build.primitive(void 0)
        [
          Build.primitive(identifier+" is node defined")])) :
    Buils.sequence(
      Build.apply(
        Build.builtin("Reflect.set"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(identifier),
          expression1]),
      expression2));
  const {tag, writable} = Data.GetLookup(scope, identifier);
  if (tag === "hit")
    return hit(writable, expression1, expression2);
  if (tag === "miss")
    return miss(expression1, expression2);
  const token1 = ARAN.counter++;
  Data.SetBinding(token1, {initialized:true, writabel:true, token:null});
  return Build.write(
    token1,
    expression1,
    Build.sequence(
      lookup(scope, identifier, true, {
        with: (token2) => (
          Data.GetStrict(scope) ?
          Build.conditional(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Build.read(token2),
                Build.primitive(identifier),
                Build.read(token1)]),
            Build.primitive(void 0),
            Build.apply(
              Build.builtin("AranThrowTypError"),
              Build.primitive(void 0),
              [
                Build.primitive("Cannot assign object property")])) :
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Build.read(token2),
              Build.primitive(identifier),
              Build.read(token1)])),
          hit: () => hit(
            Build.read(token1),
            Build.primitive(void 0)),
          miss: (writable) => miss(
            writable,
            Build.read(token1),
            Build.primitive(void 0))}),
      expression2));
};