let o = {a:1};
if (o.a++ !== 1)
  throw new Error("MemberUpdate1");
if (++o.a !== 3)
  throw new Error("MemberUpdate2");