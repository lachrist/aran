
(function () {
  function f () { return 1 }
  if (f() !== 1)
    throw new Error("Function");
} ());
