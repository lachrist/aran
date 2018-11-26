
// var p = new Proxy([{foo:123}, 2,3,4], {
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec))
// });
// var [{[(console.log("kaka"), "foo")]:xyz}] = p;

const ArrayLite = require("./array-lite");
const Identifier = require("./identifier.js");

module.exports = dispatch

const dispatch = (pattern, token) => {
  if (pattern.type === "Identifier")
    return identifier(pattern.name, token);
  if (pattern.type === "AssignmentPattern")
    return assignment(pattern.left, pattern.right, token);
  if (pattern.type === "ObjectPattern")
    return object(pattern.properties, token);
  if (pattern.type === "ArrayPattern")
    return array(pattern.elements, token);
  throw new Error("Unknwon pattern type: "+pattern.type);
};

const assignment = (pattern, expression, token1, token2) => ArrayLite.concat(
  [
    ARAN.cut.hoist(
      token2 = ++ARAN.counter,
      ARAN.cut.conditional(
        ARAN.cut.apply(
          ARAN.cut.builtin("AranBuiltinBinary"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.primitive("==="),
            ARAN.cut.read(token1),
            ARAN.cut.primitive(void 0)]),
        Visit.expression(expression),
        ARAN.cut.read(token1)))],
  dispatch(pattern, token2));

const identifier = Identifier.write;

const object = (properties, token1) => ArrayLite.flatenMap(
  properties,
  (property, token2) => ArrayLite.concat(
    [
      ARAN.cut.hoist(
        token2 = ++ARAN.counter,
        ARAN.cut.apply(
          ARAN.cut.apply("Reflect.get"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.apply(
              ARAN.cut.builtin("Object"),
              ARAN.cut.primitive(void 0),
              [
                ARAN.cut.read(token1)]),
            (
              property.computed ?
              Visit.expression(property.key) :
              ARAN.cut.primitive(property.key.name || property.key.value))]))],
    dispatch(property.value, token2)));

const array = (elements, token1, token2, token3) => ArrayLite.concat(
  [
    ARAN.cut.hoist(
      token2 = ++ARAN.counter,
      ARAN.cut.apply(
        Builtin.get(
          Builtin.objectify(
            ARAN.cut.read(token1)),
          ARAN.cut.builtin("Symbol.iterator")),
        ARAN.cut.read(token1),
        [])),
    ARAN.cut.hoist(
      token3 = ++ARAN.counter,
      ARAN.cut.primitive(void 0))],
  ArrayLite.flatenMap(
    elements,
    (element) => (
      element.type === "RestElement" ?
      ArrayLite.concat(
        [
          ARAN.cut.hoist(
            token4 = ++ARAN.counter,
            Builtin.array([])),
          ARAN.cut.apply(
            ARAN.cut.closure(
              ARAN.cut.While(
                Builtin.unary(
                  "!",
                  ARAN.cut.get(
                    ARAN.cut.write(
                      token3,
                      ARAN.cut.apply(
                        Builtin.get(
                          Builtin.objectify(
                            ARAN.cut.read(token2)),
                          ARAN.cut.primitive("next")),
                        ARAN.cut.read(token2),
                        [])),
                    ARAN.cut.primitive("done"))),
                ARAN.cut.Statement(
                  Builtin.set(
                    ARAN.cut.read(token4),
                    Builtin.get(
                      ARAN.cut.read(token4),
                      ARAN.cut.primitive("length")),
                    Builtin.get(
                      Builtin.objectify(
                        ARAN.cut.read(token3)),
                      ARAN.cut.primitive("value")))))))],
          dispatch(element.argument, token4)) :
      ArrayLite.concat(
        [
          ARAN.cut.write(
            token3,
            ARAN.cut.get(
              ARAN.cut.apply(
                Builtin.get(
                  Builtin.objectify(
                    ARAN.cut.read(token2)),
                  ARAN.cut.primitive("next")),
                ARAN.cut.read(token2),
                []),
              ARAN.cut.primitive("value")))],
        dispatch(element, token3)))));
