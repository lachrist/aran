let o = {a:1};
let x;
with (o) {
  if (delete x)
    throw new Error("IdentifierDelete1");
  if (! delete a)
    throw new Error("IdentifierDelete2");
  if (! delete a$strange$id)
    throw new Error("IdentifierDelete3");
}
if ("a" in o)
  throw new Error("IdentifierDelete4");