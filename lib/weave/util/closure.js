
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

const identifierss = {
  "ArrowFunctionExpression": [],
  "FunctionExpression": ["new.target", "this", "arguments"],
  "FunctionDeclaration": ["new.target", "this", "arguments"]
};

exports.closure = (node) => {
  node.AranRest = (
    node.patterns.length !== 0 &&
    node.patterns[node.patterns.length-1].type === "RestElement");
  node.AranLength = node.AranRest ? node.params.length-1 : node.params.length;
  node.AranName = nameof(node);
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  // #IF <AranRest>
  //   let rest = [];
  // let index = 0;
  // while (index + callee.length < arguments.length) {
  //   #IF <AranRest>
  //     rest[index] = arguments[callee.length + index];
  //   #ELSE
  //     META.drop();
  //   index = index + 1;
  // }
  // #IF <AranRest>
  //   let pattern_rest = rest;
  // let pattern[n] = n < arguments.length ? arguments[n] : META.primitive(void 0);
  // ...
  // let pattern[0] = 0 < arguments.length ? arguments[0] : META.primitive(void 0);
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
          ARAN.build.primitive(node.patterns.length-1)),
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
                  ARAN.build.primitive(node.patterns.length-1),
                  Interim.read("closure_index")))) :
            ARAN.cut.$drop(
              ARAN.cut.primitive(null)))),
        ARAN.build.Statement(
          Interim.write(
            "closure_index",
            ARAN.build.binary(
              "+",
              ARAN.build.read("closure_index"),
              ARAN.build.primitive(1)))))),
    (
      node.AranRest ?        
      Util.Declare(
        "let",
        node.patterns[node.patterns.length-1].argument,
        ARAN.cut.array(
          Interim.read("closure_rest"))) :
      []),
    ArrayLite.flaten(
      ArrayLite.reverse(
        ArrayLite.map(
          node.patterns,
          (pattern, index) => (
            pattern.type === "RestElement" ?
            [] :
            Util.Declare(
              "let",
              pattern,
              ARNA.build.conditional(
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
    AranLength,
    AranName,
    (
      !node.expression &&
      node.body.body.length &&
      node.body.body[0].type === "ExpressionStatement" &&
      node.body.body[0].expression.type === "Literal" &&
      node.body.body[0].expression.value === "use strict"),
    identifierss[node.type],
    ArrayLite.concat(
      (
        node.type === "ArrowFunctionExpression" ?
        ARAN.build.If(
          ARAN.build.read("new.target"),
          ARAN.build.Throw(
            ARAN.build.construct(
              ARAN.build.get(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("__TYPE_ERROR__")),
              [
                ARAN.build.primitive(node.id ? node.id.name : "anonymous")+" is not a constructor"])),
          []),
        []),
      statements0,
      statements1,
      ArrayLite.flaten(ARAN.hoisted),
      statements2,
      ARAN.cut.Return(
        ARAN.cut.primitive(void 0)));

  ARAN.hoisted = temporary;

  return expression;

};
