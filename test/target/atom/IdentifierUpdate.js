let x = 1;
if (x++ !== 1)
  throw new Error("IdentifierUpdate1");
if (++x !== 3)
  throw new Error("IdentifierUpdate2");