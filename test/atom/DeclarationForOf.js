
(function () {
  for (var x of ["foo"]) {}
  if (x !== "foo")
    throw new Error("ForOf");
} ());
