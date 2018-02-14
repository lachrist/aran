
(function () {
  {}
  {var x=1; x=2; x=3}
  if (x !== 3)
    throw new Error("Block");
} ());
