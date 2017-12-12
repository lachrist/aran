
const Cut = require("./cut");
const Visit = require("./visit");

module.exports = (program, pointcut) => {
  ARAN.cut = Cut(pointcut);
  return Visit.PROGRAM(program);
};



const Visit

const concat = Array.prototype.concat;

module.exports = (program) => {
  ARAN.context = Context(program.body[0]);
  const statements = concat.apply(
    [],
    program.body.map(Visit.Statement));
  statements.unshift(ARAN.cut.Program(ARAN.context.strict));
  statements.unshift(ARAN.cut.This());
  if (ARAN.context.strict)
    statements.unshift(Build.Strict());
  return {
    type: "Program",
    body: statements};
};



const Build = require("../util/build.js");

const bindings = {
  global: Build.conditional(
    Build.binary(
      Build.unary(
        "typeof",
        Build.read("window")),
      Build.primitive(void 0)),
    Build.read("global"),
    Build.read("window"));
  apply: Build.get(
    Build.read("Reflect"),
    "apply"),
  defineProperty: Build.get(
    Build.read("Reflect"),
    "defineProperty"),
  getPrototypeOf: Build.get(
    Build.read("Reflect"),
    "getPrototypeOf"),
  keys: Build.get(
    Build.read("Object"),
    "keys"),
  iterator: Build.get(
    Build.read("Symbol"),
    "iterator"),
  eval: Build.read("eval")
};

const save = (key) => Build.If(
  Build.binary(
    "===",
    Build.unary(
      "typeof",
      Build.read(ARAN.namespace+"_"+key)),
    Build.unary(
      "void",
      Build.primitive(0))),
  Build.Declaration(
    "var",
    ARAN.namespace+"_"+string
    bindings[key]),
  null);

module.exports = (key) => Build.read(ARAN.namespace+"_"+key);
module.exports.initialize = () => Object.keys(bindings).map(save);
