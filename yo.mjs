let index = 0;
const iterable = {
  [Symbol.iterator]: () => ({
    get next() {
      console.log("get next");
      return () => ({
        done: index > 10,
        value: (index += 1),
      });
    },
  }),
};

for (const x of iterable) {
  console.log(x);
}
