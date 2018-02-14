
(function () {
  var x;
  for (x of ["foo"]) {}
  if (x !== "foo")
    throw new Error("ForOf");
} ());
