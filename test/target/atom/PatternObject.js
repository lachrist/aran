let {x, y:z} = {x:"foo", y:"bar"};
if (x !== "foo")
  throw new Error("PatternObject1");
if (z !== "bar")
  throw new Error("PatternObject2");