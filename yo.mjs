// function* g() {
//   yield 0;
//   yield 1;
//   yield 2;
// }

// class TestIterator extends Iterator {
//   get next() {
//     let n = g();
//     return function () {
//       return n.next();
//     };
//   }
//   return() {
//     throw new Test262Error();
//   }
// }

// const x = new TestIterator();
// x.drop(0).next();

var obj = { foo: 123 };
({
  foo: (console.log("obj"), obj)[(console.log("key"), "foo")] = (console.log(
    "val",
  ),
  456),
} = {
  get foo() {
    console.log("get-foo");
    return undefined;
  },
});
console.log(obj);
