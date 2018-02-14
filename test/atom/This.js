
(function () {
  var o = {
    f:function () {
      if (this !== o)
        throw new Error("This");
    }
  }
  o.f();
} ());
