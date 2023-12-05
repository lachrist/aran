for (var [x1, x2 = console.log("foo")] in { __proto__: null, a: 123 }) {
  console.log({ x1, x2 });
}
