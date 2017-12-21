
const TrapArguments = require("./trap-arguments.js");
const Apply = Reflect.apply;

exports.combiners = (key) => Build[key];

exports.informers = (key) => () => [];

exports.producers = (key) => function () {
  const last = TrapArguments.producers[key].length-1;
  return TrapArguments.producers[key][last](arguments[last]);
};

exports.consumers = (key) => function () {
  return arguments[arguments.length-1];
};
