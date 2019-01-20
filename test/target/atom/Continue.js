let x = true;
while (x) {
  x = false;
  continue;
  throw new Error("Continue1");
}
let y = true;
a : while (y) {
  y = false;
  continue a;
  throw new Error("Continue2");
}