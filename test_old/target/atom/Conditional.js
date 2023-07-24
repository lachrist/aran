if ((true?1:2) !== 1)
  throw new Error("Conditional1");
if ((false?1:2) !== 2)
  throw new Error("Conditional2");