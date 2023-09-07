let [x="foo", y="bar"] = [undefined, null];
if (x !== "foo")
  throw new Error("PatternDefault1");
if (y !== null)
  throw new Error("PatternDefault2");