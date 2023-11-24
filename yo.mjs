async function* f() {
  const x = class C extends (await (yield* (async function* () {
    await 123;
    return yield 123, Object;
  })())) {
    constructor() {}
  };
  yield x;
}

for await (const x of f()) {
  console.log(x);
}
