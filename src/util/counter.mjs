export const createCounter = (value) => ({ value });

export const incrementCounter = (counter) => {
  counter.value += 1;
  return counter.value;
};

export const resetCounter = (counter, value) => {
  counter.value = value;
};

export const gaugeCounter = ({ value }) => value;
