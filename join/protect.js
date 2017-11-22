
const Build = require("../util/build.js");

const bindings = {
  apply: Build.get(
    Build.identifier("Reflect"),
    "apply"),
  defineProperty: Build.get(
    Build.identifier("Reflect"),
    "defineProperty"),
  getPrototypeOf: Build.get(
    Build.identifier("Reflect"),
    "getPrototypeOf"),
  ownKeys: Build.get(
    Build.identifier("Reflect"),
    "ownKeys"),
  iterator: Build.get(
    Build.identifier("Symbol"),
    "iterator"),
  eval: Build.identifier("eval"),
  enumerate: Build.function(
    "enumerate",
    ["o"],
    [ 
      Build.Declare(
        "var",
        "ks",
        Build.array([]));
      Build.while(
        Build.identifier("o"),
        [
          Build.write(
            "ks",
            Build.apply(
              Build.get(
                Build.identifier("ks"),
                "concat"),
              [Build.apply(
                Build.identifier(load("ownKeys")),
                [Build.identifier("o")])])),
          Build.write(
            "o",
            Build.apply(
              load("getPrototypeOf"),
              [Build.identifier("o")]))])]);
  global: Build.conditional(
    Build.binary(
      "===",
      Build.identifier("window"),
      Build.primitive("undefined")),
    Build.identifier("global"),
    Build.identifier("window"))
};

const save = (name) => Build.If(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Build.identifier(ARAN_NAMESPACE+"_"+name)),
    Build.primitive("undefined")),
  Build.Declaration(
    "var",
    ARAN_NAMESPACE+"_"+name
    bindings[name]),
  null);

const load = (name) => Build.identifier(ARAN_NAMESPACE+"_"+name);

exports.save = () => Object.keys(bindings).map(save);
exports.load = load;
