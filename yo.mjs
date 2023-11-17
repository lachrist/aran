const g = {
  [Symbol.iterator]: () => ({
    next: (...args) => {
      console.log("next", args);
      return { value: undefined, done: false };
    },
    return: (...args) => {
      console.log("return", args);
    },
  }),
};

var [x, y, z] = g;
