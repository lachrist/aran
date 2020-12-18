
const ArrayLite = require("array-lite");

const Visit = require("../visit.js");

const Error = global.Error;

///////////////
// Producers //
///////////////

exports.read = ({1:identifier}, options) => {
  if (!ArrayLite.includes(options.identifiers, identifier)) {
    throw new Error("Unbound read identifier: "+JSON_stringify);
  }
};

exports.primitive = ({1:primitive}, options) => {}

exports.closure = ({1:block}, options) => {
  Visit._block(block, Object_assign({
    __proto__: null,
    tag: "closure",
    blabels: [],
    clabels: []
  }, options);
};

exports.intrinsic = ({1:name}, options) => {};

///////////////
// Consumers //
///////////////

exports.write = ({1:identifier, 2:expression1, 3:expression2}, options) => {
  if (!ArrayLite.includes(options.identifiers, identifier)) {
    throw new Error("Unbound write identifier: "+JSON_stringify(identifier));
  }
  Visit._expression(expression1, options);
  Visit._expression(expression2, options);
};

exports.throw = ({1:expression}, options) => {
  Visit._expression(expression, options);
};

exports.eval = ({1:expression}, options) => {
  Visit._expression(expression, options);
};

exports.conditional = ({1:expression1, 2:expression2, 3:expression3}, options) => {
  Visit._expression(expression1, options);
  Visit._expression(expression2, options);
  Visit._expression(expression3, options);
};

exports.sequence = ({1:expression1, 2:expression2}, options) => {
  Visit._expression(expression1, options);
  Visit._expression(expression2, options);
};

///////////////
// Combiners //
///////////////

exports.apply = ({1:expression1, 2:expression2, 3:expressions}, options) => {
  Visit._expression(expression1, options);
  Visit._expression(expression2, options);
  ArrayLite.forEach(expressions, (expression) => {
    Visit._expression(expression, options);
  });
};

exports.construct = ({1:expression, 2:expressions}, options) => {
  Visit._expression(expression, options);
  ArrayLite.forEach(expressions, (expression) => {
    Visit._expression(expression, options);
  });
};

exports.unary = ({1:operator, 2:expression}, options) => {
  Visit._expression(expression, options);
};

exports.binary = ({1:operator, 2:expression1, 3:expression2}, options) => {
  Visit._expression(expression1, options);
  Visit._expression(expression2, options);
};

exports.object = ({1:expression, 2:expressionss}, options) => {
  Visit._expression(expression, options);
  ArrayLite.forEach(expressionss, ({0:expression1, 1:expression2}) => {
    Visit._expression(expression1, options);
    Visit._expression(expression2, options);
  });
};
