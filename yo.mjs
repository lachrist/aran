console.log(this);

/**
 * @type {import("./yo").Foo}
 */
const x = {
  foo: "asoidoiasd",
};

if (x.foo === "aa") {
  if (x.bar === "BB") {
    const y = x.qux;
  }
}

/**
 * @type {import("./yo").yo}
 */
const f = (x, y) => {
  /** @type {import("./yo").Foo} */
  const yoyo = { ...x, qux: y };
  if (yoyo.foo === "aa") {
    if (yoyo.bar === "BB") {
      const _ = yoyo.qux;
    }
  }
};
