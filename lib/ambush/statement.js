
const ArrayLite = require("array-lite");
const Escape = require("./escape");
const Build = require("../build");
const Visit = require("./visit.js");

exports.Expression = ({1:expression, 2:serial}, trap) => Build.Expression(
  trap.drop(
    Visit.expression(expression, trap),
    serial));

exports.Write = ({1:identifier, 2:expression, 3:serial}, trap) => Build.Write(
  Escape(identifier),
  trap.write(
    Visit.expression(expression, trap),
    Build.primitive(identifier),
    serial));

exports.Break = ({1:label, 2:serial}, trap) => ArrayLite.concat(
  trap.Break(
    Build.primitive(label),
    serial),
  Build.Break(label));

exports.Continue = ({1:label, 2:serial}, trap) => ArrayLite.concat(
  trap.Continue(
    Build.primitive(label),
    serial),
  Build.Continue(label));

exports.Debugger = ({2:serial}, trap) => ArrayLite.concat(
  trap.Debugger(serial),
  Build.Debugger());

exports.Return = ({1:expression, 2:serial}, trap) => Build.Return(
  trap.return(
    Visit.expression(expression, trap),
    serial));

exports.Throw = ({1:expression, 2:serial}, trap) => Build.Throw(
  trap.throw(
    Visit.expression(expression, trap),
    serial));

exports.Block = ({1:labels, 2:block, 3:serial}, trap) => Build.Block(
  labels,
  Visit.BLOCK(block, trap, "block", labels));

exports.If = ({1:labels, 2:expression, 3:block1, 4:block2, 5:serial}, trap) => Build.If(
  labels,
  trap.test(
    Visit.expression(expression, trap),
    serial),
  Visit.BLOCK(block1, trap, "then", labels),
  Visit.BLOCK(block2, trap, "else", labels));

exports.Try = ({1:labels, 2:block1, 3:block2, 4:block3, 5:serial}, trap) => Build.Try(
  labels,
  Visit.BLOCK(block1, trap, "try", labels),
  Visit.BLOCK(block2, trap, "catch", labels),
  Visit.BLOCK(block3, trap, "finally", labels, trap));

exports.While = ({1:labels, 2:expression, 3:block, 4:serial}, trap) => Build.While(
  labels,
  trap.test(
    Visit.expression(expression, trap),
    serial),
  Visit.BLOCK(block, trap, "loop", labels));

exports.Case = ({1:expression, 2:serial}, trap) => Build.Case(
  (
    expression ?
    trap.test(
      Visit.expression(expression, trap),
      serial) :
    null));

exports.Switch = ({1:labels, 2:block, 3:serial}, trap) => Build.Switch(
  labels,
  Visit.BLOCK(block, trap, "switch", labels));
