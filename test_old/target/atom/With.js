let o = {a:1};
with (o) {
  if (a !== 1)
    throw new Error("With1");
  a = 2;
}
if (o.a !== 2)
  throw new Error("With2");