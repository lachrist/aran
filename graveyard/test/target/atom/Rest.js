let f = function (x, ...xs) {
  if (x !== "foo")
    throw new Error("Rest1");
  if (xs[0] !== "bar")
    throw new Error("Rest2");
  if (xs[1] !== "qux")
    throw new Error("Rest3");
};
f("foo", "bar", "qux");