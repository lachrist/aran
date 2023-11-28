class C {
  constructor() {
    console.log(this.#foo);
  }
  #foo = 123;
}

new C();
