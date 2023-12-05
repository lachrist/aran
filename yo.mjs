const iterable = {
  [Symbol.iterator]: () => ({
    next: () => ({}),
  }),
};

for (const x of iterable) {
  console.log(x);
}

for (const x of iterable) {
  console.log(x);
}

let step = undefined;
while (((step = iterator.next()), !step.done)) {
  x = step.value;
  console.log(x);
}
