
const global_Error = global.Error

exports.Throw = (message) => {
  throw new global_Error(message);
};

exports.Fix = (array, closure1, closure2) => {
  const loop = (index) => {
    if (index >= array.length) {
      return closure2();
    }
    return closure1(array[index], () => loop(index + 1));
  };
  return loop(0);
};
