
const ArrayLite = require("array-lite");
let Build = require("../build.js");
const Data = require("./data.js");

const Error = global.Error;

Build = Object.assign({
  read: Build._read,
  write: BUild._write,
  BLOCK: Build._BLOCK
}, Build);

exports.token = (scope, expression, closure) => {
  const token = ARAN.counter++;
  Data.SetBinding(token, {initialized:true, writable:true, sticker:null}, scope);
  return Build.write(token, closure(token));
};

exports.Token = (scope, expression, closure) => {
  const token = ARAN.counter++;
  Data.SetBinding(token, {initialized:true, writable:true, sticker:null}, scope);
  return ArrayLite.concat(
    Build.Expression(
      Build.write(token, expression, Build.primitive(void 0))),
    closure(token));
};

exports.BLOCK = (scope, names1, names2, closure) => {
  scope = Data.ExtendBlock(scope);
  ArrayLite.forEach(names1, (name) => {
    Data.SetBinding(name, {initialized:false, writable:true, sticker:null});
  });
  ArrayLite.forEach(names2, (name) => {
    Data.SetBinding(name, {initialized:false, writable:true, sticker:null});
  });
  const statements = closure(scope);
  const identifiers = Data.GetIdentifiers(scope);
  const stickers = ArrayLite.filter(
    ArrayLite.map(
      identifiers,
      (identifier) => Data.GetLookup(scope, identifier).binding.sticker),
    (sticker) => sticker);
  return Build.BLOCK(
    ArrayLite.concat(identifiers, stickers),
    ArrayLite.concat(
      ArrayLite.flatMap(
        stickers,
        (sticker) => Build.Expression(
          Build.write(
          bindings[identifier].token,
          Build.primitive(false)),
          Build.primitive(void 0))),
      statements));
};

exports.initialize = (scope, name, expression1, expression2) => {
  const {tag, binding} = Data.GetLookup(name, scope);
  if (tag !== "hit")
    throw new Error("Out of bound initialization: "+name);
  if (binding.initialized)
    throw new Error("Duplicate initialization: "+name);
  const expression = Build.write(name, expression1, express2);
  binding.initialized = true;
  if (!binding.token)
    return Build.write(name, expression1, expression2);
  return Build.write(
    name,
    expression1,
    Build.write(
      binding.token,
      Build.primitive(true),
      expression2));
};

const special = (identifier) => (
  typeof identifier === "number" ||
  identifier === "this" ||
  identifier === "new.target");

const lookup = (scope, identifier, internal, closures) => {
  const {tag, binding, token, parent} = Data.GetLookup(identifier, scope);
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
        Build.apply(
          Build.builtin("Reflect.has"),
          Build.primitive(void 0),
          [
            Build.read(token),
            Build.primitive(identifier)]),
        Build.conditional(
          Build.get(
            Build.read(token),
            Build.builtin("Symbol.unscopables")),
          Build.get(
            Build.get(
              Build.read(token),
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
    Build.read(binding.token),
    Build.closures.hit(binding.writable),
    Build.apply(
      Build.builtin("AranThrowReferenceError"),
      Build.primitive(void 0),
      [
        Build.primitive(identifier+" is not defined")]));
};

exports.read = (scope, identifier) => (
  lookup(
  scope,
  identifier,
  true,
  {
    with: (token) => Build.get(
      Build.read(token),
      Build.primitive(identifier)),
    hit: (writable) => Build.read(identifier),
    global: () => Build.conditional(
      Build.apply(
        Build.builtin("AranHold"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(identifier)]),
      Build.get(
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
      Build.get(
        Build.read(token),
        Build.primitive(identifier)));
    hit: (writable) => Build.unary(
      "typeof",
      Build.read("name")),
    global: () => Build.unary(
      "typeof",
      Build.get(
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
    global: () => Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [
        Build.builtin("global"),
        Build.primitive(identifier)])});

exports.write = (scope, identifier, expression1, expression2) => {
  let token1 = null;
  const expression3 = expression1;
  const expression4 = expression2;
  const expression5 = lookup(scope, identifier, true, {
    with: (token2) => {
      if (token1 === null) {
        token1 = ARAN.counter++;
        Data.SetBinding(token1, {initialized:true, writabel:true, token:null})));
        expression1 = Build.read(token1);
        expression2 = Build.primitive(void 0);
      }
      return (
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
            Build.read(token1)]));
      },
      hit: (writable) => (
        writable ?
        Build.write(identifier, expression1, expression2) :
        Build.apply(
          Build.builtin("AranThrowTypeError"),
          Buid.primitive(void 0),
          [
            Build.primitive("Assignment to a constant variable")])),
      miss: () => (
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
          expression2))});
  return (
    token1 ?
    Build.write(
      token1,
      expression3,
      Build.sequence(expression5, expression4)) :
    expression5);
};
