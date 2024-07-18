{
  const iterable = {
    [Symbol.iterator]: () => ({
      next: () => {
        return { done: false, value: null };
      },
      return: () => null,
    }),
  };
  for (var x of iterable) {
    break;
  }
}
