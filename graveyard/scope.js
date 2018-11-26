
const Scope = require("../scope.js");
const Helper = require("./index.js");

// (
//   (
//     Reflect.has(token1, name) ?
//     (
//       token2 = Reflect.get(token, Symbol.unscopables),
//       token2 ? Reflect.get(token2, name) : false) :
//     true) :
//   LOOP :
//   ONWITH);

const scopable = (closure) => (token, expression, temporary) => ARAN.cut.conditional(
  ARAN.cut.conditonal(
    ARAN.cut.apply(
      ARAN.cut.builtin("Reflect.has"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.read(token),
        ARAN.cut.primitive(name)]),
    ARAN.cut.declare(
      temporary = ++ARAN.counter,
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.get"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.read(token),
          ARAN.cut.builtin("Symbol.unscopables")]),
      ARAN.cut.conditional(
        ARAN.cut.read(temporary),
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.get"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.read(temporary),
            ARAN.cut.primitive(name)]),
        ARAN.cut.primitive(false))),
    ARAN.cut.primitive(true)),
  expression,
  closures.object(token));

const deadzone = (closure) => (declared, writable) => (
  typeof declared === "number" ?
  ARAN.cut.conditional(
    ARAN.cut.read(declared),
    closure(writable),
    Helper.throw("ReferenceError", name+" is not defined")) :
  (
    declared ?
    closure(writable) : 
    Helper.throw("ReferenceError", name+" is not defined")));

exports.Sticker = (tokens) => ArrayLite.flatMap(
  tokens,
  (token) => ARAN.cut.Declare(
    "let",
    token,
    ARAN.cut.primitive(false)));

exports.Declare = (scope, kind, name, expression, token) => ArrayLite.concat(
  ARAN.cut.Declare(kind, name, expression),
  (
    kind === "var" ?
    [] :
    (
      token = Scope.declare(scope, name) ?
      (
        typeof temporary === "number" ?
        ARAN.cut.Statement(
          ARAN.cut.write(
            temporary,
            ARAN.cut.primitive(true),
            ARAN.cut.primitive(void 0))) :
        []))));

exports.read = (scope, name) => Scope.lookup(
  scope,
  name,
  {
    object: scopable(
      (token) => ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.get"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.read(token),
          ARAN.cut.primitive(name)])),
    local: deadzone(
      (writable) => ARAN.cut.read(name)),
    global: () => ARAN.cut.conditional(
      ARAN.cut.apply(
        ARAN.cut.builtin("AranReflect.hold"),
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
      Helper.throw("ReferenceError", name+" is not defined"))});

exports.write = (scope, name, token1, strict) => lookup(
  scope,
  name,
  {
    object: scopable(
      (token2) => (
        strict ?
        ARAN.cut.conditional(
          ARAN.cut.apply(
            ARAN.cut.builtin("Reflect.set"),
            ARAN.cut.primitive(void 0),    
            [
              ARAN.cut.read(token2),
              ARAN.cut.primitive(name),
              ARAN.cut.read(token1)]),
          ARAN.cut.read(token1),
          Helper.throw("TypeError", "Cannot assign object property")) :
        ARAN.cut.sequence(
          ARAN.cut.apply(
            ARAN.cut.builtin("Reflect.set"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.read(token2),
              ARAN.cut.primitive(name),
              ARAN.cut.read(token1)]),
          ARAN.cut.read(token1)))),
    local: deadzone(
      (writable) => (
        writable ?
        ARAN.cut.write(
          name,
          ARAN.cut.read(token1),
          ARAN.cut.read(token1)) :
        Helper.throw("TypeError", "Assignment to a constant variable"))),
    global: () => (
      strict ?
      ARAN.cut.conditional(
        ARAN.cut.apply(
          ARAN.cut.builtin("AranReflect.hold"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.builtin("global"),
            ARAN.cut.primitive(name)]),
        ARAN.cut.conditional(        
          ARAN.cut.apply(
            ARAN.cut.builtin("Reflect.set"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.builtin("global"),
              ARAN.cut.primitive(name),
              ARAN.cut.read(token1)]),
          ARAN.cut.read(token1),
          Helper.throw("TypeError", "Cannot assign object property")),
        Helper.throw("ReferenceError", name+" is not defined")) :
      ARAN.cut.sequence(
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.set"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.builtin("global"),
            ARAN.cut.primitive(name),
            ARAN.cut.read(number)]),
        ARAN.cut.read(token1)))});

exports.typeof = (scope, name) => lookup(
  scope,
  name,
  {
    object: scopable(
      (token) => ARAN.cut.apply(
        ARAN.cut.builtin("AranReflect.unary"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.primitive("typeof"),
          ARAN.cut.apply(
            ARAN.cut.builtin("Reflect.get"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.read(token),
              ARAN.cut.primitive(name)])])),
    local: deadzone(
      (writable) => ARAN.cut.apply(
        ARAN.cut.builtin("AranReflect.unary"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.primitive("typeof"),
          ARAN.cut.read(name)])),
    global: () => ARAN.cut.apply(
      ARAN.cut.builtin("AranReflect.unary"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.primitive("typeof"),
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.get"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.builtin("global"),
            ARAN.cut.primitive(name)])])});

exports.delete = (scope, name) => loop(
  scope,
  name,
  {
    object: scopable(
      (token) => ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.deleteProperty"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.read(token),
          ARAN.cut.primitive(name)])),
    local: (deadzone, writable) => ARAN.cut.primitive(false),
    global: () => ARAN.cut.apply(
      ARAN.cut.builtin("Reflect.deleteProperty"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.builtin("global"),
        ARAN.cut.primitive(name)])});
