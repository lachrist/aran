let o = {};
for (o.a of ["foo"]) {}
if (o.a !== "foo")
  throw new Error("ForOf");