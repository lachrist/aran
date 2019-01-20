let o = {
  f: function () {
    if (this !== o)
      throw new Error("MemberCall");
  }
}
o.f();