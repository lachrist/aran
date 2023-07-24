let o = {
  f:function () {
    if (this !== o)
      throw new Error("This");
  }
}
o.f();