
// The visitors of this file returns a list of statement.
// This is safe provided that control structures (if|while|do-while|for|for-in|label) have a statement block as body.
// Therefore, if it is not already the case, we put a block around the body of these structures.
// However, since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// Yet, this transformation is safe because the body of the above structure cannot be a declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

const ArrayLite = require("array-lite");
const Build = require("../../build");
const Interim = require("../interim.js");
const Util = require("../util");
const Visit = require("./index.js");

exports.EmptyStatement = (node) => [];

exports.BlockStatement = (node) => ARAN.cut.Block(
  ArrayLite.flaten(
    ArrayLite.map(
      node.body,
      Visit.Statement)));

exports.ExpressionStatement = (node) => ArrayLite.concat(
  ARAN.build.Statement(
      Visit.expression(node.expression)),
  ARAN.cut.$Drop0());

exports.IfStatement = (node) => ARAN.cut.If(
  Visit.expression(node.test),
  Util.Body(node.consequent),
  (
    node.alternate ?
    Util.Body(node.alternate) :
    []));

exports.LabeledStatement = (node) => ARAN.cut.Label(
  node.label.name,
  Util.Body(node.body));

exports.BreakStatement = (node) => ARAN.cut.Break(
  node.label ? node.label.name : null);

exports.ContinueStatement = (node) => ARAN.cut.Continue(
  node.label ? node.label.name : null);

exports.WithStatement = (node) => ARAN.cut.With(
  Visit.expression(node.object),
  Util.Body(node.body));

exports.SwitchStatement = (node) => ArrayLite.concat(
  Interim.Declare(
    "switch",
    Visit.expression(node.discriminant)),
  ARAN.cut.Switch(
    ArrayLite.map(
      node.cases,
      (clause) => [
        (
          clause.test ?
          ARAN.cut.binary(
            "===",
            ARAN.cut.$copy0before(
              Interim.read("switch")),
            Visit.expression(clause.test)) :
          ARAN.cut.primitive(true)),
        ArrayLite.flaten(
          ArrayLite.map(
            clause.consequent,
            Visit.Statement))])),
  ARAN.cut.$Drop0());

exports.ReturnStatement = (node) => ARAN.cut.Return(
  (
    node.argument ?
    Visit.expression(node.argument) :
    ARAN.cut.primitive(void 0)));

exports.ThrowStatement = (node) => ARAN.cut.Throw(
  Visit.expression(node.argument));

exports.TryStatement = (node) => ARAN.cut.Try(
  ArrayLite.flaten(
    ArrayLite.map(
      node.block.body,
      Visit.Statement)),
  (
    node.handler ?
    ArrayLite.concat(
      Util.Declare(
        "let",
        node.handler.param,
        ARAN.build.read("error")),
      ArrayLite.flaten(
        ArrayLite.map(
          node.handler.body.body,
          Visit.Statement))) :
    []),
  (
    node.finalizer ?
    ArrayLite.flaten(
      ArrayLite.map(
        node.finalizer.body,
        Visit.Statement)) :
    []));

exports.WhileStatement = (node) => ARAN.cut.While(
  Visit.expression(node.test),
  Util.Body(node.body));

exports.DoWhileStatement = (node) => ArrayLite.concat(
  Interim.Declare(
    "dowhile",
    ARAN.build.primitive(true)),
  ARAN.cut.While(
    ARAN.build.conditional(
      Interim.read("dowhile"),
      ARAN.build.sequence(
        [
          Interim.write(
            "dowhile",
            ARAN.build.primitive(false)),
          ARAN.cut.primitive(true)]),
      Visit.expression(node.test)),
    Util.Body(node.body)));

// for (let x; y; z) { ... }
//
// { 
//   let x;
//   while (y) { ... z; }
// }

exports.ForStatement = (node) => ARAN.cut.Block(
  ArrayLite.concat(
    (
      node.init.type === "VariableDeclaration" ?
      Util.Declaration(node.init) :
      ArrayLite.concat(
        ARAN.build.Statement(
          Visit.expression(node.init)),
        ARAN.cut.$Drop0())),
    ARAN.cut.While(
      Visit.expression(node.test),
      ArrayLite.concat(
        Util.Body(node.body),
        ARAN.build.Statement(
          Visit.expression(node.update)),
        ARAN.cut.$Drop0()))));

// for (let k in o) { ... }
//
// {
//   let k; 
//   var _o = o;
//   while (o) {
//     var _ks = keys(_o);
//     _o = getPrototypeOf(o);
//     var _i = 0;
//     while (_i < _ks.length) {
//       k = _ks[i];
//       i = i + 1;
//       ...
//     }
//   }
// }

exports.ForInStatement = (node) => ARAN.cut.Block(
  ArrayLite.concat(
    (
      node.left.type === "VariableDeclaration" ?
      Util.Declaration(node.left) :
      []),
    Interim.Declare(
      "object",
      Visit.expression(node.right)),
    ARAN.cut.While(
      Interim.read("object"),
      ArrayLite.concat(
        Interim.Declare(
          "keys",
          ARAN.cut.apply(
            ARAN.cut.$builtin("keys"),
            [
              Interim.read("object")])),
        ARAN.build.Statement(
          Interim.write(
            "object",
            ARAN.cut.apply(
              ARAN.cut.$builtin("getPrototypeOf"),
              [
                Interim.read("object")]))),
        Interim.Declare(
          "index",
          ARAN.cut.primitive(0)),
        ARAN.cut.While(
          ARAN.cut.binary(
            "<",
            Interim.read("index"),
            ARAN.cut.get(
              Interim.read("keys"),
              ARAN.cut.primitive("length"))),
          ArrayLite.concat(
            ARAN.build.Statement(
              Util.write(
                (
                  node.left.type === "VariableDeclaration" ?
                  node.left.declarations[0].id :
                  node.left),
                ARAN.cut.get(
                  Interim.read("keys"),
                  Interim.read("index")))),
            ARAN.build.Statement(
              Interim.write(
                "index",
                ARAN.cut.binary(
                  "+",
                  Interim.read("index"),
                  ARAN.cut.primitive(1)))),
            Util.Body(node.body)))))));

// The left member is executed at every loop:
// > for (o[(console.log("kaka"),"grunt")] in {foo:"bar", buz:"qux"}) console.log(o);
// kaka
// { foo: 5, grunt: 'foo' }
// kaka
// { foo: 5, grunt: 'buz' }
//
// for (x of xs) { ... }
//
// var _iterator = xs[Symbol.iterator]();
// while (!(_step = _iterator()).done) {
//   x = _step.value;
//   ...
// }

exports.ForOfStatement = (node) => ARAN.cut.Block(
  ArrayLite.concat(
    (
      node.left.type === "VariableDeclaration" ?
      Util.Declaration(node.left) :
      []),
    Interim.Declare(
      "iterator",
      ARAN.cut.invoke(
        Visit.expression(node.right),
        ARAN.cut.$builtin("iterator"),
        [])),
    ARAN.cut.While(
      ARAN.cut.unary(
        "!",
        ARAN.cut.get(        
          Interim.hoist(
            "step",
            ARAN.cut.invoke(
              Interim.read("iterator"),
              ARAN.cut.primitive("next"),
              [])),
          ARAN.cut.primitive("done"))),
      ArrayLite.concat(
        ARAN.build.Statement(
          Util.write(
            (
              node.left.type === "VariableDeclaration" ?
              node.left.declarations[0].id :
              node.left),
            ARAN.cut.get(
              Interim.read("step"),
              ARAN.cut.primitive("value")))),
        Util.Body(node.body)))));

exports.DebuggerStatement = (node) => ARAN.build.Debugger();

exports.FunctionDeclaration = (node) => {
  ARAN.context.hoisted.push(
    ARAN.cut.Declare(
      "var",
      node.id.name,
      Util.closure(node)));
  return [];
};

exports.VariableDeclaration = (node) => Util.Declaration(node);
