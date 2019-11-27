
const objectify = (closure) => Build.conditional(
  Build.conditional(
    Build.binary(
      "===",
      closure(),
      Build.primitive(null)),
    Build.primitive(true),
    Build.binary(
      "===",
      closure(),
      Build.primitive(void 0))),
  Build.throw(
    Build.construct(
      Build.builtin("TypeError"),
      [
        Build.primitive("Cannot convert 'null' or 'undefined' to an object")])),
  Build.apply(
    Build.builtin("Object"),
    Build.primitive(void 0),
    [
      closure()]));

exports.get = (either, expression) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [
    (
      typeof either === "function" ?
      objectify(either) :
      either),
    expression]);

exports.has = (either, expression) => Build.apply(
  Build.builtin("Reflect.has"),
  Build.primitive(void 0),
  [
    (
      typeof either === "function" ?
      objectify(either) :
      either),
    expression]);

exports.del = (boolean, either, expression) => (
  (
    (expression) => (
      boolean ?
      Build.conditional(
        expression,
        Build.primitive(true),
        Build.throw(
          Build.construct(
            Build.builtin("TypeError"),
            [
              Build.primitive("Cannot delete object property")]))) :
      expression))
  (
    Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [
        (
          typeof either === "function" ?
          objectify(either),
          either),
        expression])));

exports.set = (boolean, either, expression1, expression2) => (
  boolean ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),
      [
        // No objectify in strict mode:
        //
        // > function f () { "use strict"; var foo = 1; foo.bar = 123 }
        // undefined
        // > f()
        // Thrown:
        // TypeError: Cannot create property 'bar' on number '1'
        //     at f (repl:1:52)
        (
          typeof either === "function" ?
          either(),
          either),
        expression1,
        expression2]),
    Build.primitive(true),
    Build.throw(
      Build.construct(
        Build.builtin("TypeError"),
        [
          Build.primitive("Cannot assign object property")]))) :
  Build.apply(
    Build.builtin("Reflect.set"),
    Build.primitive(void 0),
    [
      (
        typeof either === "function" ?
        objectify(either) :
        either),
      expression1,
      expression2]));
