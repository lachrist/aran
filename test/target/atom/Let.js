{
  let l = "foo";
  l = "bar"
  if (l !== "bar")
    throw new Error("Let1");
}
if (typeof l !== "undefined")
  throw new Error("Let2");