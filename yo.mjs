async function* f() {
  const x = class C {
    constructor() {}
    [yield 123] = 456;
  };
  yield x;
}

for await (const x of f()) {
  console.log(x);
}
