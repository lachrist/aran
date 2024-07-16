console.log(
  new (class extends Object {
    constructor() {
      try {
        return;
      } finally {
        super();
      }
    }
  })(),
);

// var o = new C();
// console.log(typeof o);
// assert.sameValue(typeof o, "object");

{
  let x = true;

  while (x) {
    break;
    x = false;
    123;
  }
}
