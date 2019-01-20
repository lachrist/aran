let x;
x = 1;
if (x !== 1)
  throw new Error("IdentifierAssignment1");
x += 2;
if (x !== 3)
  throw new Error("IdentifierAssignment2");