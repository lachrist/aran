let f1 = function () {
  if (new.target !== void 0)
    throw new Error("NewTarget1");
}
f1();
let f2 = function () {
  if (new.target === void 0)
    throw new Error("NewTarget2");
};
new f2();