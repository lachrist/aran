
(function () {
  function f1 () {
    if (new.target !== void 0)
      throw new Error("NewTarget1");
  }
  f1();
  function f2 () {
    if (new.target === void 0)
      throw new Error("NewTarget2");
  };
  new f2();
} ());
