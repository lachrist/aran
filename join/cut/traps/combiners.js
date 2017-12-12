
// array :: [expression] -> expression
// object :: [[String, expression, expression]] -> expression
// get :: expression -> expression -> expression
// set :: expression -> expression -> expression -> expression
// delete :: expression -> expression -> expression
// enumerate :: expression -> expression
// apply :: expression -> expression -> [expression] -> expression
// construct :: expression -> [expression] -> expression
// unary :: String -> expression -> expression
// binary :: String -> expression -> expression -> expression

const Invoke = require("./invoke.js");
const Build = require("../../build");
const TrapKeys = require("../../../trap-keys.js");

const mapping = (property) => [
  Build.primitive(property[0]),
  property[1],
  property[2]];

const transformers = {
  object0: (properties) => Build.array(properties.map(mapping)),
  array0: Build.array,
  apply2: Build.array,
  construct1: Build.array,
  unary0: Build.primitive,
  binary0: Build.primitive};

TrapKeys.combiners.forEach((key) => {
  const mapping = (element, index) => {
    const transformer = transformers[key+index];
    return transformer ? transformer(element) : element;
  };
  points[key] = {
    forward: Build[key],
    cut: (...rest) => Invoke(key, rest.map(mapping))};
});
