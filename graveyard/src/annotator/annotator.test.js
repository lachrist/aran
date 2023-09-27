"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("acorn");
const ArrayLite = require("array-lite");
const Variable = require("../variable.js");
const Source = require("../source.js");
const Parser = require("../parser");
const Annotation = require("../annotation.js");
const Annotator = require("./annotator.js");

const parse = Parser.wrapAcorn(Acorn);

const prototypes = {
  Closure: {
    __proto__: null,
    setHoisting: [],
    setDirectEvalCall: false,
    setUseStrictDirective: false
  },
  Block: {
    __proto__: null,
    setHoisting: []
  },
  Eval: {
    __proto__: null,
    setSource: Source.make("eval", false, null)
  },
  BodyExpression: {
    __proto__: null,
    setDirectEvalCall: false
  },
  BodyBlock: {
    __proto__: null,
    setHoisting: [],
    setDirectEvalCall: false
  },
  BodyEval: {
    __proto__: null,
    setDirectEvalCall: false,
    setSource: Source.make("eval", false, null)
  }
};

const get = (object, keys) => {
  for (let index = 0; index < keys.length; index++) {
    // console.log(global.Array.isArray(object) ? "array" : object.type, keys[index]);
    object = object[keys[index]];
  }
  return object;
};

const create = (object) => {
  const annotation = Annotation.make();
  for (let name in object) {
    Annotation[name](annotation, object[name]);
  }
  return annotation;
};

const convert = (node, pairs) => ArrayLite.reduce(
  pairs,
  (map, {0:keys, 1:object}) => (
      map.set(
        get(node, keys),
        create(object)),
      map),
  new global.Map());

const test = (code, source, annotations, _node) => (
  _node = Parser.parse(code, source, parse, null),
  Assert.deepEqual(
    convert(_node, annotations),
    Annotator.annotate(_node, source)));

///////////////////////////
// hasUseStrictDirective //
///////////////////////////

test(
  `
    "foo";
    "bar";`,
  Source.make("script", false, null),
  [
    [[], prototypes.Closure]]);

test(
  `
    "foo";
    "bar";
    "use strict";`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setUseStrictDirective: true}]]);

/////////////
// Program //
/////////////

test(
  `let x;`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setHoisting: [Variable.Let("x")]}]]);

test(
  `
    "use strict";
    var x;
    eval("foo");`,
  Source.make("eval", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setHoisting: [Variable.Var("x")],
        setDirectEvalCall: true,
        setUseStrictDirective: true}],
    [
      ["body", 2, "expression"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendScope(
          Source.extendStrict(
            Source.make("eval", false, null)),
          [
            Variable.Var("x")])}]]);

//////////////////
// Declaration  //
//////////////////

test(
  `function f () {}`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setHoisting: [Variable.Function("f")]}],
    [
      ["body", 0],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "body"],
      {
        __proto__: prototypes.BodyBlock}]]);

test(
  `import "source";`,
  Source.make("module", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}]]);

test(
  `export * from "source";`,
  Source.make("module", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}]]);

test(
  `export default class c {};`,
  Source.make("module", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setHoisting: [
          Variable.exportDefault(
            Variable.Class("c"))]}]]);

test(
  `
    let x;
    export {x};`,
  Source.make("module", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setHoisting: [
          Variable.exportSelf(
            Variable.Let("x"))]}]]);

test(
  `export let x = eval(123);`,
  Source.make("module", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setHoisting: [
          Variable.exportSelf(
            Variable.Let("x"))],
        setDirectEvalCall: true}],
    [
      ["body", 0, "declaration", "declarations", 0, "init"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendScope(
          Source.extendStrict(
            Source.make("eval", false, null)),
          [
            Variable.exportSelf(
              Variable.Let("x"))])}]]);

/////////////
// Closure //
/////////////

test(
  `(function (x = eval(123)) {
    var y;
    return eval(456); });`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression"],
      {
        __proto__: prototypes.Closure,
        setDirectEvalCall: true,
        setHoisting: [
          Variable.Param("x")]}],
    [
      ["body", 0, "expression", "body"],
      {
        __proto__: prototypes.BodyBlock,
        setDirectEvalCall: true,
        setHoisting: [
          Variable.Var("y")]}],
    [
      ["body", 0, "expression", "params", 0, "right"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendScope(
          Source.extendFunction(
            Source.make("eval", false, null),
            "function"),
          [
            Variable.Param("x")])}],
    [
      ["body", 0, "expression", "body", "body", 1, "argument"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendScope(
          Source.extendFunction(
            Source.make("eval", false, null),
            "function"),
          [
            Variable.Var("y")])}]]);

test(
  `({ m () { eval(123); } });`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "properties", 0, "value"],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "properties", 0, "value", "body"],
      {
        __proto__: prototypes.BodyBlock,
        setDirectEvalCall: true}],
    [
      ["body", 0, "expression", "properties", 0, "value", "body", "body", 0, "expression"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendFunction(
          Source.make("eval", false, null),
          "method")}]]);

test(
  `(() => eval(123));`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression"],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "body"],
      {
        __proto__: prototypes.BodyEval,
        setDirectEvalCall: true,
        setSource: Source.extendArrow(
          Source.make("eval", false, null))}]]);

test(
  `(async function * () {
    "use strict";
    new.target;
    await eval(123);
    yield eval(456);
    return eval(789);
    return; });`,
  Source.make("script", false, null),
  ArrayLite.concat(
    [
      [
        [],
        {
          __proto__: prototypes.Closure}],
      [
        ["body", 0, "expression"],
        {
          __proto__: prototypes.Closure,
          setUseStrictDirective: true}],
      [
        ["body", 0, "expression", "body"],
        {
          __proto__: prototypes.BodyBlock,
          setDirectEvalCall: true}]],
    ArrayLite.map(
      [
        ["body", 0, "expression", "body", "body", 2, "expression", "argument"],
        ["body", 0, "expression", "body", "body", 3, "expression", "argument"],
        ["body", 0, "expression", "body", "body", 4, "argument"]],
      (location) => [
        location,
        {
          __proto__: prototypes.Eval,
          setSource: Source.extendStrict(
            Source.extendFunction(
              Source.make("eval", false, null),
              "function"))}])));

///////////
// Class //
///////////

test(
  `
    (class extends eval(123) {
      constructor () {
        eval(456);
        super(); }});`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setDirectEvalCall: true}],
    [
      ["body", 0, "expression", "superClass"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendStrict(
          Source.make("eval", false, null))}],
    [
      ["body", 0, "expression", "body", "body", 0, "value"],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "body", "body", 0, "value", "body"],
      {
        __proto__: prototypes.BodyBlock,
        setDirectEvalCall: true}],
    [
      ["body", 0, "expression", "body", "body", 0, "value", "body", "body", 0, "expression"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendFunction(
          Source.extendStrict(
            Source.make("eval", false, null)),
          "derived-constructor")}]]);

test(
  `
    (class {
      constructor () {
        eval(123); }});`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "body", "body", 0, "value"],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "body", "body", 0, "value", "body"],
      {
        __proto__: prototypes.BodyBlock,
        setDirectEvalCall: true}],
    [
      ["body", 0, "expression", "body", "body", 0, "value", "body", "body", 0, "expression"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendFunction(
          Source.extendStrict(
            Source.make("eval", false, null)),
          "constructor")}]]);

test(
  `
    (class {
      m () {
        eval(123); }});`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "body", "body", 0, "value"],
      {
        __proto__: prototypes.Closure}],
    [
      ["body", 0, "expression", "body", "body", 0, "value", "body"],
      {
        __proto__: prototypes.BodyBlock,
        setDirectEvalCall: true}],
    [
      ["body", 0, "expression", "body", "body", 0, "value", "body", "body", 0, "expression"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendFunction(
          Source.extendStrict(
            Source.make("eval", false, null)),
          "method")}]]);

///////////////
// Statement //
///////////////

const makeProgramPair = (boolean) => [
  [],
  {
    __proto__: prototypes.Closure,
    setDirectEvalCall: boolean}];

const makeEvalPair = (location) => [
  location,
  {
    __proto__: prototypes.Eval}];

const makeBlockPair = (location) => [
  location,
  {
    __proto__: prototypes.Block}];

// Atomic //

test(
  `debugger;`,
  Source.make("script", false, null),
  [
    makeProgramPair(false)]);

test(
  `;`,
  Source.make("script", false, null),
  [
    makeProgramPair(false)]);

test(
  `throw eval(123);`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "argument"])]);

test(
  `eval(123);`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression"])]);

// Compound //

test(
  `{ eval(123); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0]),
    makeEvalPair(["body", 0, "body", 0, "expression"])]);

test(
  `foo: { eval(123); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0, "body"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"])]);

test(
  `with (eval(123)) { eval(456); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "object"]),
    makeBlockPair(["body", 0, "body"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"])]);

test(
  `if (eval(123)) { eval(456); } else { eval(789); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "consequent", "body", 0, "expression"]),
    makeEvalPair(["body", 0, "alternate", "body", 0, "expression"]),
    makeBlockPair(["body", 0, "consequent"]),
    makeBlockPair(["body", 0, "alternate"])]);

test(
  `if (eval(123)) { eval(456); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "consequent", "body", 0, "expression"]),
    makeBlockPair(["body", 0, "consequent"])]);

test(
  `l: while (123) { break l; continue l; }`,
  Source.make("script", false, null),
  [
    makeProgramPair(false),
    makeBlockPair(["body", 0, "body", "body"])]);

test(
  `while (eval(123)) { eval(456); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0, "body"]),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"])]);

test(
  `do { eval(123); } while (eval(456))`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0, "body"]),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"])]);

test(
  `for (eval(12); eval(34); eval(56)) { eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "init"]),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "update"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"]),
    makeBlockPair(["body", 0]),
    makeBlockPair(["body", 0, "body"])]);

test(
  `for (; eval(34); eval(56)) { eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "update"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"]),
    makeBlockPair(["body", 0]),
    makeBlockPair(["body", 0, "body"])]);

test(
  `for (eval(12); ; eval(56)) { eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "init"]),
    makeEvalPair(["body", 0, "update"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"]),
    makeBlockPair(["body", 0]),
    makeBlockPair(["body", 0, "body"])]);

test(
  `for (eval(12); eval(34);) { eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "init"]),
    makeEvalPair(["body", 0, "test"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"]),
    makeBlockPair(["body", 0]),
    makeBlockPair(["body", 0, "body"])]);

test(
  `for (eval(123).k in eval(456)) { eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0]),
    makeBlockPair(["body", 0, "body"]),
    makeEvalPair(["body", 0, "left", "object"]),
    makeEvalPair(["body", 0, "right"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"])]);

test(
  `for (eval(123).k of eval(456)) { eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0]),
    makeBlockPair(["body", 0, "body"]),
    makeEvalPair(["body", 0, "left", "object"]),
    makeEvalPair(["body", 0, "right"]),
    makeEvalPair(["body", 0, "body", "body", 0, "expression"])]);

test(
  `try { eval(123); } catch { eval(456); } finally { eval(789); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0, "block"]),
    makeBlockPair(["body", 0, "handler"]),
    makeBlockPair(["body", 0, "handler", "body"]),
    makeBlockPair(["body", 0, "finalizer"]),
    makeEvalPair(["body", 0, "block", "body", 0, "expression"]),
    makeEvalPair(["body", 0, "handler", "body", "body", 0, "expression"]),
    makeEvalPair(["body", 0, "finalizer", "body", 0, "expression"])]);

test(
  `try { eval(123); } finally { eval(456); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0, "block"]),
    makeBlockPair(["body", 0, "finalizer"]),
    makeEvalPair(["body", 0, "block", "body", 0, "expression"]),
    makeEvalPair(["body", 0, "finalizer", "body", 0, "expression"])]);

test(
  `try { eval(123); } catch { eval(456); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0, "block"]),
    makeBlockPair(["body", 0, "handler"]),
    makeBlockPair(["body", 0, "handler", "body"]),
    makeEvalPair(["body", 0, "block", "body", 0, "expression"]),
    makeEvalPair(["body", 0, "handler", "body", "body", 0, "expression"])]);

test(
  `try {} catch ([e = eval(123)]) { let x; eval(456); }`,
  Source.make("script", false, null),
  [
    [
      [],
      {
        __proto__: prototypes.Closure,
        setDirectEvalCall: true}],
    [
      ["body", 0, "block"],
      {
        __proto__: prototypes.Block}],
    [
      ["body", 0, "handler"],
      {
        __proto__: prototypes.Block,
        setHoisting: [Variable.ComplexErrorParam("e")]}],
    [
      ["body", 0, "handler", "body"],
      {
        __proto__: prototypes.Block,
        setHoisting: [Variable.Let("x")]}],
    [
      ["body", 0, "handler", "param", "elements", 0, "right"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendScope(
          Source.make("eval", false, null),
          [
            Variable.ComplexErrorParam("e")])}],
    [
      ["body", 0, "handler", "body", "body", 1, "expression"],
      {
        __proto__: prototypes.Eval,
        setSource: Source.extendScope(
          Source.extendScope(
            Source.make("eval", false, null),
            [
              Variable.ComplexErrorParam("e")]),
          [
            Variable.Let("x")])}]]);

test(
  `switch (eval(12)) {
    case eval(34): eval(56);
    default: eval(78); }`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeBlockPair(["body", 0]),
    makeEvalPair(["body", 0, "discriminant"]),
    makeEvalPair(["body", 0, "cases", 0, "test"]),
    makeEvalPair(["body", 0, "cases", 0, "consequent", 0, "expression"]),
    makeEvalPair(["body", 0, "cases", 1, "consequent", 0, "expression"])]);

// Declaration //

////////////////
// Expression //
////////////////

// Environment //

test(
  `x;`,
  Source.make("script", false, null),
  [
    makeProgramPair(false)]);

test(
  `({[eval(123)]: x} = eval(456));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "left", "properties", 0, "key"]),
    makeEvalPair(["body", 0, "expression", "right"])]);

test(
  `(eval(123).k++);`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "argument", "object"])]);

test(
  `this;`,
  Source.make("script", false, null),
  [
    makeProgramPair(false)]);

test(
  `import.meta;`,
  Source.make("module", false, null),
  [
    makeProgramPair(false)]);

// Literal //

test(
  "`foo${eval(123)}bar${eval(456)}qux`;",
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "expressions", 0]),
    makeEvalPair(["body", 0, "expression", "expressions", 1])]);

test(
  "eval(123)`foo${eval(456)}bar${eval(789)}qux`;",
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "tag"]),
    makeEvalPair(["body", 0, "expression", "quasi", "expressions", 0]),
    makeEvalPair(["body", 0, "expression", "quasi", "expressions", 1])]);

test(
  `123;`,
  Source.make("script", false, null),
  [
    makeProgramPair(false)]);

test(
  `([eval(123), ...eval(456),,]);`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "elements", 0]),
    makeEvalPair(["body", 0, "expression", "elements", 1, "argument"])]);

test(
  `({[eval(123)]: eval(456), ... eval(789)});`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "properties", 0, "key"]),
    makeEvalPair(["body", 0, "expression", "properties", 0, "value"]),
    makeEvalPair(["body", 0, "expression", "properties", 1, "argument"])]);

// Control //

test(
  `(eval(123))?.k;`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "expression", "object"])]);

test(
  `import(eval(123));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "source"])]);

test(
  `(eval(123) || eval(456));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "left"]),
    makeEvalPair(["body", 0, "expression", "right"])]);

test(
  `(eval(123) ? eval(456) : eval(789));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "test"]),
    makeEvalPair(["body", 0, "expression", "consequent"]),
    makeEvalPair(["body", 0, "expression", "alternate"])]);

test(
  `(eval(123), eval(456))`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "expressions", 0]),
    makeEvalPair(["body", 0, "expression", "expressions", 1])]);

// Combination //

test(
  `(eval(123)[eval(456)]);`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "object"]),
    makeEvalPair(["body", 0, "expression", "property"])]);

test(
  `(!eval(123));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "argument"])]);

test(
  `(eval(123) + eval(456));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "left"]),
    makeEvalPair(["body", 0, "expression", "right"])]);

test(
  `(new (eval(123))(eval(456), eval(789)));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "callee"]),
    makeEvalPair(["body", 0, "expression", "arguments", 0]),
    makeEvalPair(["body", 0, "expression", "arguments", 1])]);

test(
  `((eval(123))(eval(456), eval(789)));`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "callee"]),
    makeEvalPair(["body", 0, "expression", "arguments", 0]),
    makeEvalPair(["body", 0, "expression", "arguments", 1])]);

/////////////
// Pattern //
/////////////

test(
  `([{[eval(123)]:x} = eval(123)] = "foo");`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "left", "elements", 0, "left", "properties", 0, "key"]),
    makeEvalPair(["body", 0, "expression", "left", "elements", 0, "right"])]);

test(
  `({[eval(123)]:{[eval(456)]:x}} = "foo");`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "left", "properties", 0, "key"]),
    makeEvalPair(["body", 0, "expression", "left", "properties", 0, "value", "properties", 0, "key"])]);

test(
  `([{[eval(123)]:x},, ...[{[eval(456)]:xs}]] = "foo");`,
  Source.make("script", false, null),
  [
    makeProgramPair(true),
    makeEvalPair(["body", 0, "expression", "left", "elements", 0, "properties", 0, "key"]),
    makeEvalPair(["body", 0, "expression", "left", "elements", 2, "argument", "elements", 0, "properties", 0, "key"])]);
