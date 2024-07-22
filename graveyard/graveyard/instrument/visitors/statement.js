
const ArrayLite = require("array-lite");
const Build = require("../../build.js");
const Visit = require("../visit.js");

exports.Expression = ({1:expression, 2:serial}, options) => Build.Expression(
  options.trap.drop(
    Visit.expression(expression, options),
    serial));

exports.Break = ({1:label, 2:serial}, options) => ArrayLite.concat(
  Build.Expression(
    options.trap.break(
      Build.primitive(label),
      serial)),
  Build.Break(label));

exports.Continue = ({1:label, 2:serial}, options) => ArrayLite.concat(
  Build.Expression(
    options.trap.continue(
      Build.primitive(label),
      serial)),
  Build.Continue(label));

exports.Debugger = ({1:serial}, options) => ArrayLite.concat(
  Build.Expression(
    options.trap.debugger(serial)),
  Build.Debugger());

exports.Return = ({1:expression, 2:serial}, options) => Build.Return(
  options.trap.return(
    Visit.expression(expression, options),
    serial));

exports.Block = ({1:block, 2:serial}, options) => Build.Block(
  Visit.BLOCK(
    block,
    {
      __proto__: null,
      trap: options.trap,
      tag: "block"}));

exports.If = ({1:expression, 2:block1, 3:block2, 4:serial}, options) => Build.If(
  options.trap.test(
    Visit.expression(expression, options),
    serial),
  Visit.BLOCK(
    block1,
    {
      __proto__: null,
      trap: options.trap,
      tag: "then"}),
  Visit.BLOCK(
    block2,
    {
      __proto__: null,
      trap: options.trap,
      tag: "else"}));

exports.Try = ({1:block1, 2:block2, 3:block3, 4:serial}, trap) => Build.Try(
  Visit.BLOCK(
    block1,
    {
      __proto__: null,
      trap: options.trap,
      tag: "try"}),
  Visit.BLOCK(
    block2,
    {
      __proto__: null,
      trap: options.trap,
      tag: "catch"}),
  Visit.BLOCK(
    block3,
    {
      __proto__: null,
      trap: options.trap,
      tag: "catch"}));

exports.While = ({1:expression, 2:block, 3:serial}, options) => Build.While(
  options.trap.test(
    Visit.expression(expression, options),
    serial),
  Visit.BLOCK(
    block,
    {
      __proto__: null,
      trap: options.trap,
      tag: "loop"}));
