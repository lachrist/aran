
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");

const nameof = (node) => {
  if (node.id)
    return node.id.name;
  if (node.AranParent.type === "VariableDeclaration")
    for (let index = 0; index < node.AranParent.declarations.length; index++)
      if (node.AranParent.declarations[index].init === node)
        return (
          node.AranParent.declarations[index].id.type === "Identifier" ?
          node.AranParent.declarations[index].id.name :
          "");
  if (node.AranParent.type === "ObjectExpression")
    for (let index = 0; index < node.AranParent.properties.length; index++)
      if (node.AranParent.properties[index].value === node)
        return (
          !node.AranParent.properties[index].computed ?
          node.AranParent.properties[index].name :
          "");
  if (node.AranParent.type === "AssignmentExpression")
    return (
      node.operator === "=" && node.left.type === "Identifier" ?
      node.left.name :
      "");
  return "";
};


  cut.$closure = (boolean, number, identifier, identifiers, statements) => traps.closure(
    ARAN.build.apply(
      ARAN.build.builtin("Object.defineProperty"),
      [
        ARAN.build.apply(
          ARAN.build.builtin("Object.defineProperty"),
          [
            ARAN.build.$closure(
              ArrayLite.concat(
                ARAN.build.Declare(
                  "const",
                  "scope",
                  ARAN.build.object(
                    ArrayLite.concat(
                      ArrayLite.map(
                        identifiers,
                        (identifier) => [
                          identifier,
                          ARAN.build.read(identifier)]),
                      (
                        boolean ?
                        [
                          [
                            identifier,
                            ARAN.build.read("callee")]] :
                        [])))),
                ARAN.build.Statement(
                  traps.arrival(
                    ARAN.build.read("scope"),
                    ARAN.build.read("callee"),
                    ARAN.build.read("arguments"))),
                ArrayLite.flatenMap(
                  (
                    boolean ?
                    ArrayLite.concat(identifiers, [identifier]) :
                    identifiers),
                  (identifier) => ARAN.build.$Declare(
                    "var",
                    identifier,
                    ARAN.build.get(
                      ARAN.build.read("scope"),
                      ARAN.build.primitive(identifier)))),
                statements)),
            ARAN.build.primitive("length"),
            ARAN.build.object([
              [
                "value",
                ARAN.build.primitive(number)],
              [
                "configurable",
                ARAN.build.primitive(true)]])]),
        ARAN.build.primitive("name"),
        ARAN.build.object([
          [
            "value",
            ARAN.build.primitive(identifier)],
          [
            "configurable",
            ARAN.build.primitive(true)]])]));


const identifierss = {
  "ArrowFunctionExpression": [],
  "FunctionExpression": ["new.target", "this", "arguments"],
  "FunctionDeclaration": ["new.target", "this", "arguments"]
};

exports.closure = (node) => {
  node.AranRest = (
    node.params.length &&
    node.params[node.params.length-1].type === "RestElement");
  node.AranLength = (
    node.AranRest ?
    node.params.length - 1 :
    node.params.length);
  node.AranName = nameof(node);
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  // #IF <AranRest>
  //   let rest = ARAN.cut.array([]);
  // let index = 0;
  // while (index + callee.length < arguments.length) {
  //   #IF <AranRest>
  //     rest[index] = arguments[callee.length + index];
  //   #ELSE
  //     META.drop();
  //   index = index + 1;
  // }
  // #IF <AranRest>
  //   let PARAM_REST = rest;
  // let PARAM_N = n < arguments.length ? arguments[n] : META.primitive(void 0);
  // ...
  // let PARAM_0 = 0 < arguments.length ? arguments[0] : META.primitive(void 0);
  const statements1 = ArrayLite.concat(
    (
      node.AranRest ?
      ARAN.build.Statement(
        Interim.hoist(
          "closure_rest",
          ARAN.build.array([]))) :
      []),
    ARAN.build.Statement(
      Interim.hoist(
        "closure_index",
        ARAN.build.primitive(0))),
    ARAN.build.While(
      ARAN.build.binary(
        "<",
        ARAN.build.binary(
          "+",
          Interim.read("closure_index"),
          ARAN.build.primitive(node.AranRest)),
        ARAN.build.get(
          ARAN.build.read("arguments"),
          ARAN.build.primitive("length"))),
      ArrayLite.concat(
        ARAN.build.Statement(
          (
            node.AranRest ?
            ARAN.build.set(
              Interim.read("closure_rest"),
              Interim.read("closure_index"),
              ARAN.build.get(
                ARAN.build.read("arguments"),
                ARAN.build.binary(
                  "+",
                  Interim.read("closure_index"),
                  ARAN.build.primitive(node.AranRest)))) :
            ARAN.cut.$drop(
              ARAN.cut.primitive(null)))),
        ARAN.build.Statement(
          Interim.write(
            "closure_index",
            ARAN.build.binary(
              "+",
              Interim.read("closure_index"),
              ARAN.build.primitive(1)))))),
    (
      node.AranRest ?        
      Util.Declare(
        "let",
        node.params[node.params.length-1].argument,
        ARAN.cut.$array(
          Interim.read("closure_rest"))) :
      []),
    ArrayLite.flaten(
      ArrayLite.reverse(
        ArrayLite.map(
          node.params,
          (param, index) => (
            param.type === "RestElement" ?
            [] :
            Util.Declare(
              "let",
              param,
              ARAN.build.conditional(
                ARAN.build.binary(
                  "<",
                  ARAN.build.primitive(index),
                  ARAN.build.get(
                    ARAN.build.read("arguments"),
                    ARAN.build.primitive("length"))),
                ARAN.build.get(
                  ARAN.build.read("arguments"),
                  ARAN.build.primitive(index)),
                ARAN.cut.primitive(void 0))))))));

  const statements0 = ArrayLite.flaten(ARAN.hoisted);

  ARAN.hoisted = [];

  const statements2 = (
    node.expression ?
    ARAN.cut.Return(
      Visit.expression(node.body)) :
    ArrayLite.flatenMap(
      node.body.body,
      Visit.Statement));

  const expression = ARAN.cut.$closure(
    Boolean(node.id),
    node.AranLength,
    node.AranName,
    identifierss[node.type],
    ArrayLite.concat(
      (
        node.type === "ArrowFunctionExpression" ?
        ARAN.build.If(
          ARAN.build.read("new.target"),
          ARAN.build.Throw(
            ARAN.build.construct(
              ARAN.build.$load("TypeError"),
              [
                ARAN.build.primitive((node.id ? node.id.name : "anonymous")+" is not a constructor")])),
          []) :
        []),
      statements0,
      statements1,
      ArrayLite.flaten(ARAN.hoisted),
      statements2,
      ARAN.cut.Return(
        ARAN.cut.primitive(void 0))));

  ARAN.hoisted = temporary;

  return expression;

};
