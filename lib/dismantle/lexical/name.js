
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("./scope.js");

const scopable = (scope, name, closure) => (token, expression) => Build.conditional(
  Build.conditional(
    Build.binary(
      "in",
      Build.read(token),
      Build.primitive(name)),
    Scope.token(
      Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.read(token),
          Build.builtin("Symbol.unscopables")]),
      (token) => Build.conditional(
        Build.read(token),
        Build.apply(
          Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.read(token),
            Build.primitive(name)]),
        Build.primitive(false)),
      scope),
    Build.primitive(true)),
  expression,
  closure(token));

const deadzone = (name, closure) => (declared, writable) => (
  typeof declared === "number" ?
  Build.conditional(
    Build.read(declared),
    closure(writable),
    Build.apply(
      Build.builtin("AranThrowReferenceError"),
      Build.primitive(void 0),
      [
        Build.primitive(name+" is not defined")])) :
  (
    declared ?
    closure(writable) :
    Build.apply(
      Build.builtin("AranThrowReferenceError"),
      Build.primitive(void 0),
      [
        Build.primitive(name+" is not defined")])));

exports.read = (name, scope) => Scope.lookup(
  name,
  {
    with: scopable(
      scope,
      name,
      (token) => Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.read(token),
          Build.primitive(name)])),
    local: deadzone(
      name,
      (writable) => Build.read(name)),
    global: () => Build.conditional(
      Build.apply(
        Build.builtin("AranHold"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(name)]),
      Build.apply(
        Build.builtin("Reflect.get"),
        Build.primitive(void 0),
        [
          Build.builtin("global"),
          Build.primitive(name)]),
      Build.apply(
        Build.builtin("AranThrowReferenceError"),
        Build.primitive(void 0),
        [
          Build.primitive(name+" is not defined")]))},
  scope);

exports.typeof = (name, scope) => Scope.lookup(
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
        Build.primitive(name)))},
  scope);

exports.delete = (name, scope) => Scope.lookup(
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
      Build.primitive(name))},
  scope);

exports.write = (strict, name, expression1, expression2, scope) => (
  Scope.lookup(
    name,
    {
      with: () => true,
      local: () => false,
      global: () => false},
    scope) ?
  Build.sequence(
    Lexical.token(
      expression1,
      (token1) => Scope.lookup(
        name,
        {
          with: scopable(
            name,
            (token2) => strict ?
              Build.conditional(
                Build.apply(
                  Build.builtin("Reflect.set"),
                  Build.primitive(void 0),
                  [
                    Build.read(token2),
                    Build.primitive(name),
                    Build.read(token1)]),
                Build.primitive(void 0),
                Build.apply(
                  Build.builtin("AranThrowTypError")
                  Build.primitive(void 0),
                  [
                    Build.primitive("Cannot assign object property")])) :
              Build.apply(
                Build.builtin("Reflect.set"),
                Build.primitive(void 0),
                [
                  Build.read(token2),
                  Build.primitive(name),
                  Build.read(token1)])),
          local: deadzone(
            name,
            (writable) => (
              writable ?
              Build.write(
                name,
                Build.read(token),
                Build.primitive(void 0)) :
              Build.apply(
                Build.builtin("TypeError"),
                Buid.primitive(void 0),
                [
                  Build.primitive("Assignment to a constant variable")]))),
          global: () => (
            strict ?
            Build.conditional(
              Build.apply(
                Build.builtin("AranHold"),
                Build.primitive(void 0),
                [
                  Build.builtin("global"),
                  Build.primitive(name)]),
              Build.conditional(
                Build.apply(
                  Build.builtin("Reflect.set"),
                  Build.primitive(void 0),
                  [
                    Build.builtin("global"),
                    Build.primitive(name),
                    expression1]),
                Build.primitive(void 0),
                Build.apply(
                  Build.builtin("AranThrowTypError"),
                  Build.primitive(void 0),
                  [
                    Build.primitive("Cannot assign object property")]))),
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Build.builtin("global"),
                Build.primitive(name),
                expression1]))},
        scope),
      scope),
    expression2),
  Scope.lookup(
    name,
    {
      local: deadzone(
        name,
        (writable) => (
          writable ?
          Build.write(name, expression1, expression2) :
          Build.apply(
            Build.builtin("AranThrowTypeError"),
            Buid.primitive(void 0),
            [
              Build.primitive("Assignment to a constant variable")]))),
      global: () => (
        strict ?
        Build.conditional(
          Build.apply(
            Build.builtin("AranHold"),
            Build.primitive(void 0),
            [
              Build.builtin("global"),
              Build.primitive(name)]),
          Build.conditional(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Build.builtin("global"),
                Build.primitive(name),
                expression1]),
            expression2,
            Build.apply(
              Build.builtin("AranThrowTypError"),
              Build.primitive(void 0),
              [
                Build.primitive("Cannot assign object property")]))),
        Build.sequence(
          Build.apply(
            Build.builtin("Reflect.set"),
            Build.primitive(void 0),
            [
              Build.builtin("global"),
              Build.primitive(name),
              expression1]),
          expression2))},
    scope));
