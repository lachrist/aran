let sum = "";
for (let x of ["a", "b", "c"])
  sum = sum + x;
if (sum !== "abc")
  throw new Error("ForOf");