export const createCounter = (value) => ({value});

export const incrementCounter = (counter) => {
  counter.value += 1;
  return counter.value;
};

export const setCounter = (counter, value) => {
  counter.value = value;
};

export const getCounter = ({value}) => value;
