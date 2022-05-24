export const createCounter = (value) => ({value});

export const incrementCounter = (counter) => {
  counter.value += 1;
  return counter.value;
};
