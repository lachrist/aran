
const ArrayLite = require("array-lite");

const Visit = require("../visit.js");

const Error = global.Error;

///////////////
// BlockLess //
///////////////

exports.Debugger = ({}, options) => {};

exports.Break = ({1:label}, options) => {
  if (!ArrayLite.includes(options.blabels, label)) {
    throw new Error("Unbound break label: "+JSON_stringify(label));
  }
};

exports.Continue = ({1:label}, options) => {
  if (!ArrayLite.includes(options.clabels, label)) {
    throw new Error("Unbound continue label: "+JSON_stringify(label));
  }
};

exports.Expression = ({1:expression}, options) => {
  Visit._expression(expression, {
    __proto__: null,
    syntax: options.syntax,
    identifiers: options.identifiers
  });
};

exports.Return = ({1:expression}, options) => {
  Visit._expression(expression, {
    __proto__: null,
    syntax: options.syntax,
    identifiers: options.identifiers
  });
};

///////////////
// BlockFull //
///////////////

exports.Block = ({1:block}, options) => {
  Visit._block(block, Object_assign({
    __proto__: null,
    tag: "block"
  }, options));
};

exports.If = ({1:expression, 2:block1, 3:block2}, options) => {
  Visit._expression(expression, {
    __proto__: null,
    syntax:options.syntax,
    identifiers:options.identifiers
  });
  Visit._block(block, Object_assign({
    __proto__: null,
    tag: "then"
  }, options);
  Visit._block(block, Object_assign({
    __proto__: null,
    tag: "else"
  }, options);
};

exports.While = ({1:expression, 2:block}, options) => {
  Visit._expression(expression, {syntax:options.syntax, identifiers:options.identifiers});
  Visit._block(block, Object_assign({
    __proto__: null,
    tag: "while"
  }, options);
};

exports.Try = ({1:block1, 2:block2, 3:block3}, options) => {
  Visit._block(block1, Object_assign({
    __proto__: null,
    tag: "try"
  }, options);
  Visit._block(block2, Object_assign({
    __proto__: null,
    tag: "catch"
  }, options);
  Visit._block(block3, Object_assign({
    __proto__: null,
    tag: "finally"
  }, options);
};
