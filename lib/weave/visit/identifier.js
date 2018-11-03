
const Scope = require("./scope.js");

exports.read = (identifier) => Scope(
  ARAN.node.AranScope,
  identifier,
  (token) => ARAN.cut.apply(
    ARAN.cut.builtin("Reflect.get"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.read(token),
      ARAN.cut.primitive(node.name)]),
  (boolean) => ARAN.cut.read(node.name),
  () => ARAN.cut.conditional(
    ARAN.cut.apply(
      ARAN.cut.builtin("AranBuiltinHas"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.builtin("global"),
        ARAN.cut.primitive(identifier)]),
    ARAN.cut.apply(
      ARAN.cut.builtin("Reflect.get"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.builtin("global"),
        ARAN.cut.primitive(void 0)]),
    ARAN.cut.apply(
      ARAN.cut.closure(
        ARAN.cut.Throw(
          ARAN.cut.construct(
            ARAN.cut.builtin("ReferenceError"),
            [
              ARAN.cut.primitive(identifier+" is not defined")]))),
      ARAN.cut.primitive(void 0),
      [])));

exports.write = (identifier, token1) => Scope.lookup(
  ARAN.node.AranScope,
  identifier,
  (token2) => (
    ARAN.node.AranStrict ?
    ARAN.cut.conditional(
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.set"),
        ARAN.cut.primitive(void 0),    
        [
          ARAN.cut.read(token2),
          ARAN.cut.primitive(identifier),
          ARAN.cut.read(token1)]),
      ARAN.cut.primitive(void 0),
      ARAN.cut.apply(
        ARAN.cut.closure(
          ARAN.cut.Throw(
            ARAN.cut.construct(
              ARAN.cut.builtin("TypeError"),
              [
                ARAN.cut.primitive("Cannot assign object property")]))),
        ARAN.cut.primitive(void 0),
        [])) :
    ARAN.cut.apply(
      ARAN.cut.builtin("Reflect.set"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.apply(
          ARAN.cut.builtin("Object"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.read(token2)]),
        ARAN.cut.primitive(identifier),
        ARAN.cut.read(token1)])),
  (boolean) => (
    boolean ?
    ARAN.cut.apply(
      ARAN.cut.closure(
        ARAN.cut.Throw(
          ARAN.cut.construct(
            ARAN.cut.builtin("TypeError"),
            [
              ARAN.cut.primitive("Assignment to a constant variable")]))),
      ARAN.cut.primitive(void 0),
      []) :
    ARAN.cut.write(
      identifier,
      ARAN.cut.read(token1))),
  () => (
    ARAN.node.AranStrict ?
    ARAN.cut.conditional(
      ARAN.cut.apply(
        ARAN.cut.builtin("AranBuiltinHas"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.builtin("global"),
          ARAN.cut.primitive(identifier)]),
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.set"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.builtin("global"),
          ARAN.cut.primitive(identifier),
          ARAN.cut.read(number)]),
      Signal.reference(identifier+" is not defined")) :
    ARAN.cut.apply(
      ARAN.cut.builtin("Reflect.set"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.builtin("global"),
        ARAN.cut.primitive(identifier),
        ARAN.cut.read(number)])));

exports.typeof = (identifier) => Scope.lookup(
  ARAN.node.AranScope,
  identifier,
  (token) => ARAN.cut.apply(
    ARAN.cut.builtin("AranBuiltinUnary"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.primitive("typeof"),
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.get"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.read(token),
          ARAN.cut.primitive(identifier)])]),
  (boolean) => ARAN.cut.apply(
    ARAN.cut.builtin("AranBuiltinUnary"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.primitive("typeof"),
      ARAN.cut.read(identifier)]),
  () => ARAN.cut.apply(
    ARAN.cut.builtin("AranBuiltinUnary"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.primitive("typeof"),
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.get"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.builtin("global"),
          ARAN.cut.primitive(identifier)])]))

exports.delete = (identifier) => Scope.lookup(
  ARAN.node.AranScope,
  identifier,
  (token) => ARAN.cut.apply(
    ARAN.cut.builtin("Reflect.deleteProperty"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.read(token),
      identifier]),
  (boolean) => ARAN.cut.primitive(false),
  () => ARAN.cut.apply(
    ARAN.cut.builtin("Reflect.deleteProperty"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.builtin("global"),
      ARAN.cut.primitive(identifier)]));
