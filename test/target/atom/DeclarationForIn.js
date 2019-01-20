let sum = "";
for (let k in {a:1,b:2,c:3})
  sum = sum + k;
if (sum !== "abc")
  throw new Error("DeclarationForIn");