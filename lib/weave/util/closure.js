
const ArrayLite = require("array-lite");
const Visit = require("../visit");
const Util = require("./index.js");

const nameof (node) => {
  if (node.id) {
    return node.id.name;
  }
  if (node.AranParent.type === "VariableDeclaration") {
    for (let index = 0; index < node.AranParent.declarations.length; index++) {
      if (node.AranParent.declarations[index].init === node) {
        return (
          node.AranParent.declarations[index].id.type === "Identifier" ?
          node.AranParent.declarations[index].id.name :
          "");
      }
    }
  }
  if (node.AranParent.type === "ObjectExpression") {
    for (let index = 0; index < node.AranParent.properties.length; index++) {
      if (node.AranParent.properties[index].value === node) {
        return (
          !node.AranParent.properties[index].computed ?
          node.AranParent.properties[index].name :
          "");
      }
    }
  }
  if (node.AranParent.type === "AssignmentExpression") {
    return (
      node.operator === "=" && node.left.type === "Identifier" ?
      node.left.name :
      "");
  }
}

exports.closure = (node) => ARAN.cut.closure(
  {
    arrow: node.type === "ArrowFunctionExpression",
    callee: node.id ? node.id.name : null,
    name: nameof(node),
    length: (
      (
        node.params.length &&
        node.params[node.params.length-1].type === "RestElement") ?
      node.params.length - 1 :
      node.params.length)},
  ARAN.build.Hoist(
    ArrayLite.concat(
      // #IF <AranRest>
      //   let PARAM_REST = META.array(rest);
      // #ELSE
      //   META.drop();
      (
        (
          node.params.length &&
          node.params[node.params.length-1].type === "RestElement") ?        
        Util.Declare(
          "let",
          node.params[node.params.length-1].argument,
          ARAN.build.read("rest")) :
        ARAN.build.Statement(
          ARAN.cut.$drop())),
      // let PARAM_N = n < arguments.length ? arguments[n] : META.primitive(void 0);
      // ...
      // let PARAM_0 = 0 < arguments.length ? arguments[0] : META.primitive(void 0);
      ArrayLite.flaten(
        ArrayLite.reverse(
          ArrayLite.map(
            (
              node.AranRest ?
              ArrayLite.slice(0, node.params.length-1) :
              node.params),
            (param, index) => Util.Declare(
              "let",
              param,
              ARAN.build.conditional(
                ARAN.build.binary(
                  "<",
                  ARAN.build.primitive(index),
                  ARAN.build.get(
                    ARAN.build.read("args"),
                    ARAN.build.primitive("length"))),
                ARAN.build.get(
                  ARAN.build.read("args"),
                  ARAN.build.primitive(index)),
                ARAN.cut.primitive(void 0)))))),
      // #IF <ARROW>
      //   if (arrival) throw new META._TypeError("not a constructor");
      // #ELSE
      //   META.drop();
      (
        node.type === "ArrowFunctionExpression" ?
        ARAN.cut.If(
          ARAN.build.read("arrival"),
          ARAN.cut.Throw(
            ARAN.cut.construct(
              ARAN.cut.builtin("TypeError"),
              [
                ARAN.cut.primitive("not a constructor")])),
          []) :
        ARAN.build.Statement(
          ARAN.cut.$drop(
            ARAN.build.primitive(null))))),
    (
      node.expression ?
      ARAN.cut.Return(
        Visit.expression(node.body)) :
      ArrayLite.concat(
        ArrayLite.flatenMap(
          node.body.body,
          Visit.Statement),
        ARAN.cut.Return(
          ARAN.cut.primitive(void 0))))));
