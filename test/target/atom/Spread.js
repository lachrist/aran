let f = function (x, y, z, t) {
  if (x !== 1)
    throw new Error("Spread1");
  if (y !== 2)
    throw new Error("Spread2");
  if (z !== 3)
    throw new Error("Spread3");
  if (t !== 4)
    throw new Error("Spread4")
  if (arguments.length !== 4)
    throw new Error("Spread5");
}
f (1, ...[2,3], 4);