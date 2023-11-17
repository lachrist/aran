// import { runInThisContext } from "node:vm";
// runInThisContext(``);

let {} = 123;

var count = 0;
class C {
  static m() {
    super[0] = count += 1;
  }
}

Object.setPrototypeOf(C, null);

assert.throws(TypeError, function () {
  C.m();
});

assert.sameValue(count, 1);
