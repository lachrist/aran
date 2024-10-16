class c {
  constructor() {
    console.log(c);
  }
}

const d = c;
c = 123;
new d();
