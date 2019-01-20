let o = {};
o.a = 1;
if (o.a !== 1)
  throw new Error("MemberAssignment1");
o.a += 2;
if (o.a !== 3)
  throw new Error("MemberAssignment2");