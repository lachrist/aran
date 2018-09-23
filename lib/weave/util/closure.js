
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");

exports.closure = (node) => {
  node.AranRest = (
    node.params.length &&
    node.params[node.params.length-1].type === "RestElement");
  node.AranLength = (
    node.AranRest ?
    node.params.length - 1 :
    node.params.length);
  if (node.id) {
    node.AranName = node.id.name;
  } else if (node.AranParent.type === "VariableDeclaration") {
    for (let index = 0; index < node.AranParent.declarations.length; index++) {
      if (node.AranParent.declarations[index].init === node) {
        node.AranName = (
          node.AranParent.declarations[index].id.type === "Identifier" ?
          node.AranParent.declarations[index].id.name :
          "");
        break;
      }
    }
  } else if (node.AranParent.type === "ObjectExpression") {
    for (let index = 0; index < node.AranParent.properties.length; index++) {
      if (node.AranParent.properties[index].value === node) {
        node.AranName = (
          !node.AranParent.properties[index].computed ?
          node.AranParent.properties[index].name :
          "");
        break;
      }
    }
  } else if (node.AranParent.type === "AssignmentExpression") {
    node.AranName = (
      node.operator === "=" && node.left.type === "Identifier" ?
      node.left.name :
      "");
  }
  return ARAN.cut.closure(
    ARAN.build.sequence(
      [
        ARAN.build.declare(
          "let",
          ARAN.unique("closure"),
          ARAN.build.closure(
            ArrayLite.concat(
              // const scope = {"new.target":new.target, this:this, arguments:arguments, callee:#AranID>};
              ARAN.build.Declare(
                "const",
                ARAN.unique("scope"),
                ARAN.build.object(
                  ArrayLite.concat(
                    ArrayLite.flatenMap(
                      (
                        node.type === "ArrowFunctionExpression" ?
                        [] :
                        ["new.target", "this", "arguments"]),
                      (identifier) => [
                        identifier,
                        ARAN.build.read(identifier)]),
                    (
                      node.id ?
                      [
                        node.id.name,
                        ARAN.build.read("callee")] :
                      [])))),
              // const args = META._Array_from(arguments);
              ARAN.build.Declare(
                "const",
                unique("arguments"),
                ARAN.build.apply(
                  ARAN.build.builtin("Array.from"),
                  [
                    ARAN.build.read("arguments")])),
              // const arrival = META.arrival(callee, scope, args, new.target);
              ARAN.build.Declare(
                "const",
                ARAN.unique("arrival"),
                traps.arrival(
                  ARAN.build.read("callee"),
                  ARAN.build.read(
                    ARAN.unique("scope")),
                  ARAN.build.read(
                    ARAN.unique("arguments")),
                  ARAN.build.read("new.target"))),
              // let _new_target = scope["new.target"];
              // let _this = scope["this"];
              // let $arguments = scope["arguments"];
              // let <NAME> = scope[<NAME>];
              ArrayLite.flatenMap(
                ArrayLite.concat(
                  (
                    node.type === "ArrowFunctionExpression" ?
                    [] :
                    ["new.target", "this", "arguments"]),
                  node.id ? node.id.name : []),
                (identifier) => ARAN.build.$Declare(
                  "let",
                  identifier,
                  ARAN.build.get(
                    ARAN.build.read("scope"),
                    ARAN.build.primitive(identifier)))),
              // #IF <ARROW>
              //   if (arrival) throw new META._TypeError("not a constructor");
              // #ELSE
              //   META.drop();
              (
                node.type === "ArrowFunctionExpression" ?
                ARAN.cut.If(
                  ARAN.build.read(
                    ARAN.unique("arrival")),
                  ARAN.cut.Throw(
                    ARAN.cut.construct(
                      ARAN.cut.builtin("TypeError"),
                      [
                        ARAN.cut.primitive("not a constructor")])),
                  []) :
                ARAN.build.Statement(
                  ARAN.cut.$drop(
                    ARAN.build.primitive(null)))),
              // #IF <AranRest>
              //   let rest = [];
              (
                node.AranRest ?
                ARAN.build.Declare(
                  "let",
                  ARAN.unique("rest"),
                  ARAN.build.array([])) :
                []),
              // let index = 0;
              ARAN.build.Declare(
                "let",
                ARAN.unique("index"),
                ARAN.build.primitive(0)),
              // while (index + #AranLength < arguments.length) {
              //   #IF <AranRest>
              //     rest[index] = arguments[index + #AranLength];
              //   #ELSE
              //     META.drop();
              //   index = index + 1;
              // }
              ARAN.build.While(
                ARAN.build.binary(
                  "<",
                  ARAN.build.binary(
                    "+",
                    ARAN.build.read(
                      ARAN.unique("index")),
                    ARAN.build.primitive(node.AranLength)),
                  ARAN.build.get(
                    ARAN.build.read(
                      ARAN.unique("arguments")),
                    ARAN.build.primitive("length"))),
                ArrayLite.concat(
                  (
                    node.AranRest ?
                    ARAN.build.Statement(
                      ARAN.build.set(
                        ARAN.build.read(
                          ARAN.unique("rest")),
                        ARAN.build.read(
                          ARAN.unique("index")),
                        ARAN.build.get(
                          ARAN.build.read("arguments"),
                          ARAN.build.binary(
                            "+",
                            ARAN.build.read(
                              ARAN.unique("index")),
                            ARAN.build.primitive(node.AranRest))))) :
                    ARAN.build.Statement(
                      ARAN.cut.$drop(
                        ARAN.cut.primitive(null)))),
                  ARAN.build.Statement(
                    ARAN.build.write(
                      ARAN.unique("index"),
                      ARAN.build.binary(
                        "+",
                        Interim.read("closure_index"),
                        ARAN.build.primitive(1)))))),
              // #IF <AranRest>
              //   let PARAM_REST = META.array(rest);
              (
                node.AranRest ?        
                Util.Declare(
                  "let",
                  node.params[node.params.length-1].argument,
                  ARAN.cut.$array(
                    Interim.read("closure_rest"))) :
                []),
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
                            ARAN.build.read("arguments"),
                            ARAN.build.primitive("length"))),
                        ARAN.build.get(
                          ARAN.build.read("arguments"),
                          ARAN.build.primitive(index)),
                        ARAN.cut.primitive(void 0)))))),
              (
                node.expression ?
                ARAN.cut.Return(
                  Visit.expression(node.body)) :
                ArrayLite.concat(
                  ArrayLite.flatenMap(
                    node.body.body,
                    Visit.Statement),
                  ARAN.cut.Return(
                    ARAN.cut.primitive(void 0))))))),
        ARAN.build.apply(
          ARAN.build.builtin("Reflect.defineProperty"),
          [
            ARAN.build.read(
              ARAN.unique("closure")),
            ARAN.build.primitive("length"),
            ARAN.build.object(
              [
                [
                  "length",
                  ARAN.build.primitive(
                    (
                      (
                        node.params.length &&
                        node.params[node.params.length-1].type === "RestElement") ?
                      node.params.length - 1 :
                      node.params.length))]])]),
        ARAN.build.apply(
          ARAN.build.builtin("Reflect.defineProperty"),
          [
            ARAN.build.read("closure_"+node.AranSerial),
            ARAN.build.primitive("length"),
            ARAN.build.object(
              [
                [
                  "length",
                  ARAN.build.primitive(
                    nameof(node))]])]),
        (
          node.type === "ArrowFunctionExpression" ?
          ARAN.build.set(
            ARAN.build.read(
              ARAN.unique("closure")),
            ARAN.build.primitive("prototype"),
            ARAN.build.primitive(void 0)) :
          ARAN.build.primitive(null)),
        ARAN.build.read(
          ARAN.unique("closure"))]));
};

