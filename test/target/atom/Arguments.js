let f = function () {
  if (arguments[0] !== "foo")
    throw new Error("Arguments1");
  if (arguments[1] !== "bar")
    throw new Error("Arguments2");
  if (arguments.length !== 2)
    throw new Error("Arguments3");
};
f("foo", "bar");