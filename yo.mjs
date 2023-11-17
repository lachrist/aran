const g = {
  [Symbol.iterator]: () => ({
    next: (...args) => {
      console.log("next", args);
      return { value: undefined, done: false };
    },
    return: (...args) => {
      console.log("return", args);
      return {};
    },
  }),
};

var [x = console.log("foo"), y = console.log("bar"), z = console.log("qux")] =
  g;
console.log({ x, y, z });
