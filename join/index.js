
const Cut = require("./cut");
const Visit = require("./visit");
const Build = require("./build.js");

module.exports = (program, pointcut) => { 
  program.__min__ = ++ARAN.counter;
  ARAN.index = ARAN.counter;
  ARAN.cut = Cut(pointcut);
  ARAN.context = Context(program.body[0]);
  const statements = Flaten.apply(
    null,
    program.body.map(Visit.Statement));
  return ARAN.cut.PROGRAM(
    ARAN.context.strict,
    Flaten.call(
      Flaten.apply(
        null,
        ARAN.hidden.map((identifier) => Build.Declare(
          "var",
          identifier,
          Build.primitive(null)))),
      Flaten.apply(null, ARAN.context.hoisted);
      statements));
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
