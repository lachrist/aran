(function () {
  {let x = 1}
  if (typeof x !== "undefined")
    throw new Error("Block1");
  {var y = 1}
  if (y !== 1)
    throw new Error("Block2");
} ());