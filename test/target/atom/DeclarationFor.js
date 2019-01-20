let sum = 0;
for (let i=0; i<4; i++)
  sum = sum + i;
if (sum !== 6)
  throw new Error("DeclarationFor");