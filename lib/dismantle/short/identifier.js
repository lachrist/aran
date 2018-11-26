
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("./scope.js");
const Throw = require("./throw.js");

const scopable = (scope, identifier, closure) => (token, expression, temporary) => Build.conditional(
  Build.conditonal(
    Build.apply(
      Build.builtin("Reflect.has"),
      Build.primitive(void 0),
      [
        Build.read(token),
        Build.primitive(identifier)]),
    Build.write(
      temporary = Scope.token(scope),
      Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.read(token),
          Build.builtin("Symbol.unscopables")]),
      Build.conditional(
        Build.read(temporary),
        Build.apply(
          Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.read(temporary),
            Build.primitive(identifier)]),
        Build.primitive(false))),
    Build.primitive(true)),
  expression,
  closure(token));

const deadzone = (identifier, closure) => (declared, writable) => (
  typeof declared === "number" ?
  Build.conditional(
    Build.read(declared),
    closure(writable),
    Throw.throw("ReferenceError", identifier+" is not defined")) :
  (
    declared ?
    closure(writable) : 
    Throw.throw("ReferenceError", identifier+" is not defined")));

exports.Declare = (identifier, expression, scope, $token) => (
  $token = Scope.declare(identifier, scope),
  ArrayLite.concat(
    Build.Write(identifier, expression),
    (
      $token ?
      Build.Write(
        $token,
        Build.primitive(true)) :
      [])));

exports.declare = (identifier, expression1, expression2, scope, $token) => (
  $token = Scope.declare(identifier, scope),
  Build.write(
    identifier,
    expression1,
    (
      $token ?
      Build.write(
        $token,
        Build.primitive(true),
        expression2) :
      expression2)));

exports.read = (identifier, scope) => Scope.lookup(
  scope,
  identifier,
  {
    with: scopable(
      scope,
      identifier,
      (token) => Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.read(token),
          Build.primitive(identifier)])),
    local: deadzone(
      identifier,
      (writable) => Build.read(identifier)),
    global: () => Build.conditional(
      Build.apply(
        Build.builtin("AranReflect.hold"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(identifier)]),
      Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(void 0)]),
      Throw.throw("ReferenceError", identifier+" is not defined"))});

// Right hand side is evaluated first:
//
// > with (new Proxy({}, {has: (tgt, key)=>(console.log("has", key), false)})) { x = this.console.log("right");}  
// right
// has x

exports.write = (strict, identifier, token1, scope) => lookup(
  scope,
  identifier,
  {
    with: scopable(
      scope,
      identifier,
      (token2) => set(
        strict,
        Build.read(token2),
        Build.primitive(identifier),
        Build.read(token1))),
    local: deadzone(
      identifier,
      (writable) => (
        writable ?
        Build.write(
          identifier,
          Build.read(token1),
          Build.primitive(void 0)) :
        Throw.throw("TypeError", "Assignment to a constant variable"))),
    global: () => (
      strict ?
      Build.conditional(
        Build.apply(
          Build.builtin("AranReflect.hold"),
          Build.primitive(void 0),
          [
            Build.builtin("global"),
            Build.primitive(identifier)]),
        set(
          strict,
          Build.builtin("global"),
          Build.primitive(identifier),
          Build.read(token1)),
        Throw.throw("ReferenceError", identifier+" is not defined")) :
      set(
        strict,
        Build.builtin("global"),
        Build.primitive(identifier),
        Build.read(token1)))});

exports.typeof = (identifier, scope) => lookup(
  scope,
  identifier,
  {
    with: scopable(
      scope,
      identifier,
      (token) => Build.apply(
        Build.builtin("AranReflect.unary"),
        Build.primitive(void 0),
        [
          Build.primitive("typeof"),
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.read(token),
              Build.primitive(identifier)])])),
    local: deadzone(
      (writable) => Build.apply(
        Build.builtin("AranReflect.unary"),
        Build.primitive(void 0),
        [
          Build.primitive("typeof"),
          Build.read(identifier)])),
    global: () => Build.apply(
      Build.builtin("AranReflect.unary"),
      Build.primitive(void 0),
      [
        Build.primitive("typeof"),
        Build.apply(
          Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.builtin("global"),
            Build.primitive(identifier)])])});

exports.discard = (identifier, scope) => loop(
  scope,
  identifier,
  {
    with: scopable(
      scope,
      identifier,
      (token) => Build.apply(
        Build.builtin("Reflect.deleteProperty"),
        Build.primitive(void 0),
        [
          Build.read(token),
          Build.primitive(identifier)])),
    local: (deadzone, writable) => Build.primitive(false),
    global: () => Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [
        Build.builtin("global"),
        Build.primitive(identifier)])});
