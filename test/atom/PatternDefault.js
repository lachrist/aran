
(function () {
  var [x="foo", y="bar"] = [void 0, null];
  if (x !== "foo")
    throw new Error("PatternDefault1");
  if (y !== null)
    throw new Error("PatternDefault2");
} ());
