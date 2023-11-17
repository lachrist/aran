const g = {
  [Symbol.iterator]: () => ({
    next: (...args) => {
      console.log("next", args);
      return { value: 123, done: true };
    },
    return: (...args) => {
      console.log("return", args);
      return {};
    },
  }),
};

var [x, y, z] = g;
console.log({ x, y, z });
