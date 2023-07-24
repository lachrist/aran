if (!true)
  throw new Error("Unary1");
let o = {a:1,b:2};
delete o.a;
if ("a" in o)
  throw new Error("Unary2");
delete o["b"]
if ("b" in o)
  throw new Error("Unary3");