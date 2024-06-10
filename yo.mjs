async function g() {
  console.log("body");
}

console.log("foo1");

const gg = g();

console.log("foo2");

gg.next();

console.log("foo3");

gg.next();

console.log("foo4");
