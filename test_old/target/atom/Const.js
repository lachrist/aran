{
  const c = "foo";
  try {
    c = "bar";
  } catch (_) {
  }
  if (c !== "foo")
    throw new Error("Const1");
}
if (typeof c !== "undefined")
  throw new Error("Const2");