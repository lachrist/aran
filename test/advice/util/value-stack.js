
const Check = require("./check.js");
const Array_prototype_pop = Array.prototype.pop;
const Array_prototype_push = Array.prototype.push;
const Array_prototype_map = Array.prototype.map;

function consume (value, serial) {
  check("Consume", this._values[this._values.length-1], value, serial);
  return this._values.pop();
}

function produce (value, serial) {
  this._values.push(value);
  return value;
}

function flush (size, serial) {
  while (this._values.length > size)
    this._values.pop();
}

function size (serial) {
  return this._values.length;
}

function reify (jsonify) {
  return this._values.map(jsonify);
}

module.exports = (traps) => {
  const values = [];
  values.pop = Array_prototype_pop;
  values.push = Array_prototype_push;
  values.map = Array_prototype_map;
  traps.swap = (position1, position2, value, serial) => {
    const temporary = values[values.length-position1];
    values[values.length-position1] = values[values.length-position2];
    values[values.length-position2] = temporary;
    return value;
  };
  traps.copy = (position, value, serial) => {
    values.push(values[values.length-position]);
    return value;
  };
  traps.drop = (value, serial) => {
    values.pop();
    return value;
  };
  return {
    _values: values,
    consume: consume,
    produce: produce,
    flush: flush,
    size: size,
    reify: reify
  };
};
