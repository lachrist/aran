const ARAN = (x) => console.dir(x);

class c {
  foo() {}
}

ARAN(Object.getOwnPropertyDescriptors(c.prototype));
