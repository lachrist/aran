let [x1,x2] = ["foo1", "bar1"];
if (x1 !== "foo1")
  throw new Error("PatternArray1");
if (x2 !== "bar1")
  throw new Error("PatternArray2");
let [y1, y2, ... ys] = ["foo2", "bar2", "buz2", "qux2"];
if (y1 !== "foo2")
  throw new Error("PatternArray3");
if (y2 !== "bar2")
  throw new Error("PatternArray4");
if (ys[0] !== "buz2")
  throw new Error("PatternArray5");
if (ys[1] !== "qux2")
  throw new Error("PatternArray6");