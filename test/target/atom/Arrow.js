let a1 = () => "foo";
let a2 = () => { return "bar" };
if (a1() !== "foo")
  throw new Error("Arrow1");
if (a2() !== "bar")
  throw new Error("Arrow2");
let check = false;
try {
  new a1();
} catch (error) {
  check = true;
}
if (!check)
  throw new Error("Arrow3");