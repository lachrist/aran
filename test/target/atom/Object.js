let b = "b";
let o = {
  a: 1,
  [b]: 2,
  get c () { return 3 },
  set c (v) {}
};
if (o.a !== 1)
  throw new Error("Object1");
if (o.b !== 2)
  throw new Error("Object2");
o.c = 666;
if (o.c !== 3)
  throw new Error("Object3");