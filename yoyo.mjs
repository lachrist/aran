{
  let counter = 0;
  const iterable = {
    [Symbol.iterator]: () => ({
      next: () => {
        counter++;
        return { done: counter > 10, value: counter };
      },
      return: () => {
        console.log("return called");
      },
    }),
  };
  for (var x of iterable) {
    console.log(x);
  }
}
