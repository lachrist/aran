
(function () {
  var x = true;
  while (x) {
    x = false;
    continue;
    throw new Error("Continue1");
  }
  var y = true;
  a : while (y) {
    y = false;
    continue a;
    throw new Error("Continue2");
  }
} ());
