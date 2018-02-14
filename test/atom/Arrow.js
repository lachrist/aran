
(function () {
  var a1 = () => "foo";
  var a2 = () => { return "bar" };
  if (a1() !== "foo")
    throw new Error("Arrow1");
  if (a2() !== "bar")
    throw new Error("Arrow2");
  var check = false;
  try {
    new a1();
  } catch (error) {
    check = true;
  }
  if (!check)
    throw new Error("Arrow3");
} ());
