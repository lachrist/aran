let o = {a:1};
delete o.a;
if ("a" in o)
  throw new Error("MemberDelete");