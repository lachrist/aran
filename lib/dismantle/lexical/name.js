
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope.js");
const Short = require("../short.js");

const scopable = (scope, name, closure) => (token, expression, $token) => Build.conditional(
  Build.conditional(
    Short.has(
      Build.read(token),
      Build.primitive(name)),
    Build.write(
      $token = Scope.token(scope),
      Short.get(
        Build.read(token),
        Build.builtin("Symbol.unscopables")),
      Build.conditional(
        Build.read($token),
        Short.get(
          Build.read($token),
          Build.primitive(name)),
        Build.primitive(false))),
    Build.primitive(true)),
  expression,
  closure(token));

const deadzone = (name, closure) => (declared, writable) => (
  typeof declared === "number" ?
  Build.conditional(
    Build.read(declared),
    closure(writable),
    Short.throw_reference_error(name+" is not defined")) :
  (
    declared ?
    closure(writable) : 
    Short.throw_reference_error(name+" is not defined")));

exports.Declare = (name, expression, scope, $token) => (
  $token = Scope.declare(name, scope),
  ArrayLite.concat(
    Build.Write(name, expression),
    (
      $token ?
      Build.Write(
        $token,
        Build.primitive(true)) :
      [])));

exports.declare = (name, expression1, expression2, scope, $token) => (
  $token = Scope.declare(name, scope),
  Build.write(
    name,
    expression1,
    (
      $token ?
      Build.write(
        $token,
        Build.primitive(true),
        expression2) :
      expression2)));

exports.read = (name, scope) => Scope.lookup(
  scope,
  name,
  {
    with: scopable(
      scope,
      name,
      (token) => Short.get(
        Build.read(token),
        Build.primitive(name))),
    local: deadzone(
      name,
      (writable) => Build.read(name)),
    global: () => Build.conditional(
      Short.hold(
        Build.builtin("global"),
        Build.primitive(name)),
      Short.get(
        Build.builtin("global"),
        Build.primitive(name)),
      Short.throw_reference_error(name+" is not defined"))});

exports.write = (strict, name, token1, scope) => Scope.lookup(
  scope,
  name,
  {
    with: scopable(
      scope,
      name,
      (token2) => Short.set(
        strict,
        Build.read(token2),
        Build.primitive(name),
        Build.read(token1))),
    local: deadzone(
      name,
      (writable) => (
        writable ?
        Build.write(
          name,
          Build.read(token1),
          Build.primitive(void 0)) :
        Short.throw_type_error("Assignment to a constant variable"))),
    global: () => (
      strict ?
      Build.conditional(
        Short.hold(
          Build.builtin("global"),
          Build.primitive(name)),
        Short.set(
          strict,
          Build.builtin("global"),
          Build.primitive(name),
          Build.read(token1)),
        Short.throw_reference_error(name+" is not defined")) :
      Short.set(
        strict,
        Build.builtin("global"),
        Build.primitive(name),
        Build.read(token1)))});

exports.typeof = (name, scope) => Scope.lookup(
  scope,
  name,
  {
    with: scopable(
      scope,
      name,
      (token) => Short.unary(
        "typeof",
        Short.get(
          Build.read(token),
          Build.primitive(name)))),
    local: deadzone(
      (writable) => Short.unary(
        "typeof",
        Build.read("name"))),
    global: () => Short.unary(
      "typeof",
      Short.get(
        Build.builtin("global"),
        Build.primitive(name)))});

exports.delete = (name, scope) => Scope.lookup(
  scope,
  name,
  {
    with: scopable(
      scope,
      name,
      (token) => Short.delete(
        false,
        Build.read(token),
        Build.primitive(name))),
    local: (deadzone, writable) => Build.primitive(false),
    global: () => Short.delete(
      false,
      Build.builtin("global"),
      Build.primitive(name))});
