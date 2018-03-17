
(function () {
  function f () {
    return;
    throw new Error("Return1");
  }
  if (f() !== void 0)
    throw new Error("Return2");
} ());
