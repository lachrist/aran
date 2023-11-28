class D {
  constructor() {
    return { __proto__: null };
  }
  foo() {
    console.log("foo");
  }
}

class C extends D {
  constructor() {
    super();
    super.foo();
  }
}

new C();
